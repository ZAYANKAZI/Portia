// src/utils/svgAssemble.js
// Minimal, robust assembler that returns an SVG string representing the current preview.
// It reuses html-to-image's toSvg, but with a *very permissive* filter so nothing disappears.

import { toSvg } from "html-to-image";

/** Wait for images + fonts so the SVG is complete */
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

/**
 * EXTREMELY permissive filter for exact/vector exports.
 * Only skip nodes explicitly marked as no-export.
 */
function exactFilter(n) {
  return n?.dataset?.noExport !== "true";
}

/**
 * assembleSVG(screenLike?)
 * Returns an SVG string of the current #preview-capture.
 * `screenLike` is accepted for future custom/vector pipelines,
 * but for now we mirror the on-screen composition exactly.
 */
export async function assembleSVG(screenLike) {
  const node = document.getElementById("preview-capture");
  if (!node) throw new Error("[assembleSVG] #preview-capture not found");

  await waitForAssets(node);

  const out = await toSvg(node, {
    cacheBust: true,
    canvasWidth: 1920,
    canvasHeight: 1080,
    filter: exactFilter,
    style: { transform: "none", transformOrigin: "top left", overflow: "hidden" },
  });

  // Normalize to raw SVG text
  if (typeof out === "string" && out.trim().startsWith("<svg")) {
    return out;
  }
  if (typeof out === "string" && out.startsWith("data:image/svg+xml")) {
    const resp = await fetch(out);
    return await resp.text();
  }
  // dataURL → text
  try {
    return atob(String(out).split(",")[1]);
  } catch {
    // Last resort: valid empty SVG so the caller never crashes
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"/>`;
  }
}

export default assembleSVG;
