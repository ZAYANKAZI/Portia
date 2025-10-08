// src/utils/exportUtils.js
import { toJpeg, toPng, toSvg } from "html-to-image";
import { assembleSVG } from "./svgAssemble";

/** Wait for images and webfonts so export is crisp */
async function waitForAssets(el) {
  if (!el) return;
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise((res) => {
          if (img.complete && img.naturalWidth > 0) return res();
          img.addEventListener("load", res, { once: true });
          img.addEventListener("error", res, { once: true });
        })
    )
  );
  try { if (document.fonts?.ready) await document.fonts.ready; } catch {}
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1200);
  a.remove();
}

/** Hide editor-only UI for raster exports (keep handles out of JPG/PNG) */
function defaultFilter(n) {
  if (n?.dataset?.noExport === "true") return false;
  if (n?.classList) {
    const c = n.classList;
    if (c.contains("cursor-move")) return false;
    if (c.contains("cursor-nwse-resize")) return false;
    if (c.contains("cursor-grab")) return false;
    if (c.contains("ui-handle")) return false;
  }
  // external stylesheets can throw on cssRules; skip to be safe
  if (n?.tagName === "STYLE" && n.sheet) {
    try { void n.sheet.cssRules; } catch { return false; }
  }
  return true;
}

/** DOM → JPEG (1080p/4K/6K) */
export async function exportToJPEG(
  captureId = "preview-capture",
  fileName = "screen.jpg",
  pixelRatio = 1
) {
  const node = typeof captureId === "string" ? document.getElementById(captureId) : captureId;
  if (!node) { console.error("[exportToJPEG] capture node not found:", captureId); return; }
  await waitForAssets(node);
  node.classList.add("exporting");
  try {
    const dataUrl = await toJpeg(node, {
      quality: 0.95,
      pixelRatio,
      canvasWidth: 1920,
      canvasHeight: 1080,
      cacheBust: true,
      style: { transform: "none", transformOrigin: "top left", overflow: "hidden" },
      filter: defaultFilter,
    });
    const a = document.createElement("a");
    a.download = fileName;
    a.href = dataUrl;
    a.click();
  } catch (err) {
    console.error("[exportToJPEG] failed:", err);
  } finally {
    node.classList.remove("exporting");
  }
}

/** DOM → PNG (lossless, crisp). 6× is a solid default */
export async function exportBestPNG(
  captureId = "preview-capture",
  fileName = "screen-best.png",
  pixelRatio = 6
) {
  const node = typeof captureId === "string" ? document.getElementById(captureId) : captureId;
  if (!node) { console.error("[exportBestPNG] capture node not found:", captureId); return; }
  await waitForAssets(node);
  node.classList.add("exporting");
  try {
    const dataUrl = await toPng(node, {
      pixelRatio,
      canvasWidth: 1920,
      canvasHeight: 1080,
      cacheBust: true,
      style: { transform: "none", transformOrigin: "top left", overflow: "hidden" },
      filter: defaultFilter,
    });
    const u8 = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
    downloadBlob(new Blob([u8], { type: "image/png" }), fileName);
  } catch (err) {
    console.error("[exportBestPNG] failed:", err);
  } finally {
    node.classList.remove("exporting");
  }
}

/** DOM → SVG (exact preview). Do NOT over-filter; keep everything except explicit noExport */
export async function exportExactSVG(
  captureId = "preview-capture",
  fileName = "screen-exact.svg"
) {
  const node = typeof captureId === "string" ? document.getElementById(captureId) : captureId;
  if (!node) { console.error("[exportExactSVG] capture node not found:", captureId); return; }
  await waitForAssets(node);
  node.classList.add("exporting");
  try {
    const out = await toSvg(node, {
      cacheBust: true,
      canvasWidth: 1920,
      canvasHeight: 1080,
      filter: (n) => n?.dataset?.noExport !== "true",
      style: { transform: "none", transformOrigin: "top left", overflow: "hidden" },
    });

    if (typeof out === "string" && out.trim().startsWith("<svg")) {
      downloadBlob(new Blob([out], { type: "image/svg+xml" }), fileName);
      return;
    }
    if (typeof out === "string" && out.startsWith("data:image/svg+xml")) {
      const resp = await fetch(out);
      const blob = await resp.blob();
      downloadBlob(blob, fileName);
      return;
    }
    try {
      const svgText = atob(String(out).split(",")[1]);
      downloadBlob(new Blob([svgText], { type: "image/svg+xml" }), fileName);
    } catch (e) {
      console.error("[exportExactSVG] unexpected output format", e, out);
    }
  } catch (err) {
    console.error("[exportExactSVG] failed:", err);
  } finally {
    node.classList.remove("exporting");
  }
}

/** Exact PNG = (DOM -> exact SVG) -> rasterize to PNG (wasm preferred, canvas fallback) */
export async function exportExactPNG(
  captureId = "preview-capture",
  fileName = "screen-exact.png",
  scale = 6
) {
  const node = typeof captureId === "string" ? document.getElementById(captureId) : captureId;
  if (!node) { console.error("[exportExactPNG] capture node not found:", captureId); return; }

  await waitForAssets(node);
  node.classList.add("exporting");
  try {
    // 1) DOM -> SVG (exact)
    const out = await toSvg(node, {
      cacheBust: true,
      canvasWidth: 1920,
      canvasHeight: 1080,
      filter: (n) => n?.dataset?.noExport !== "true",
      style: { transform: "none", transformOrigin: "top left", overflow: "hidden" },
    });

    // Normalize to SVG string
    let svgText = "";
    if (typeof out === "string" && out.trim().startsWith("<svg")) {
      svgText = out;
    } else if (typeof out === "string" && out.startsWith("data:image/svg+xml")) {
      const resp = await fetch(out);
      svgText = await resp.text();
    } else {
      try {
        svgText = atob(String(out).split(",")[1]);
      } catch (e) {
        console.error("[exportExactPNG] unexpected toSvg output", e, out);
        return;
      }
    }

    // 2) Rasterize to PNG (prefer resvg-wasm, fallback to canvas)
    const width = 1920 * scale,
      height = 1080 * scale;

    let done = false;
    try {
      const mod = await import(/* @vite-ignore */ "@resvg/resvg-wasm");
      const init = mod.initWasm || mod.default || mod.init;
      if (init) { try { await init(); } catch {} }
      if (mod.Resvg) {
        const r = new mod.Resvg(svgText, { fitTo: { mode: "width", value: width } });
        const pngData = r.render().asPng();
        downloadBlob(new Blob([pngData], { type: "image/png" }), fileName);
        done = true;
      }
    } catch {}

    if (!done) {
      const blob = await rasterizeSVGWithCanvas(svgText, width, height);
      downloadBlob(blob, fileName);
    }
  } catch (err) {
    console.error("[exportExactPNG] failed:", err);
  } finally {
    node.classList.remove("exporting");
  }
}

/** Pure-vector route: delegates to svgAssemble (now restored) */
export async function exportSVG(screenLike, fileName = "screen.svg") {
  try {
    const svg = await assembleSVG(screenLike);
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), fileName);
  } catch (e) {
    console.error("[exportSVG] failed:", e);
  }
}

/** Canvas rasterizer fallback for any SVG string */
async function rasterizeSVGWithCanvas(svg, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/png"
      );
    };
    img.onerror = (e) => reject(e);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

/** VECTOR → PNG (ULTRA): assembler → wasm (or canvas) with DOM fallback */
export async function exportSVGtoPNG(
  screenLike,
  scale = 6,
  fileName = "screen-ultra-vector.png",
  captureId = "preview-capture"
) {
  const width = 1920 * scale;
  const height = 1080 * scale;

  try {
    const svg = await assembleSVG(screenLike);

    // 1) resvg-wasm
    try {
      const mod = await import(/* @vite-ignore */ "@resvg/resvg-wasm");
      const init = mod.initWasm || mod.default || mod.init;
      if (init) { try { await init(); } catch {} }
      if (mod.Resvg) {
        const r = new mod.Resvg(svg, { fitTo: { mode: "width", value: width } });
        const pngData = r.render().asPng();
        downloadBlob(new Blob([pngData], { type: "image/png" }), fileName);
        return;
      }
    } catch {}

    // 2) Canvas fallback
    try {
      const blob = await rasterizeSVGWithCanvas(svg, width, height);
      downloadBlob(blob, fileName);
      return;
    } catch {}

    // 3) DOM exact fallback (so it never fails)
    await exportExactPNG(captureId, fileName, scale);
  } catch (e) {
    console.error("[exportSVGtoPNG] failed before rasterization:", e);
  }
}
