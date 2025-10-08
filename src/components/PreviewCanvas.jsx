import React, { useEffect, useRef, useState } from "react";
import { TEMPLATE_REGISTRY } from "./templates/registry";
import Sticker from "./canvas/sticker.jsx";
import GridOverlay from "./GridOverlay.jsx";

/**
 * Workspace: fills viewport, no page scrollbars. Artboard 1920×1080 at 1:1.
 * Pan with: Middle mouse, Space+Left, Left when Hand tool is ON, or Left on background.
 * Double-click opens inline editor (handled by card components).
 */
export default function PreviewCanvas({
  data,
  captureId = "preview-capture",
  onDragSection,
  onDragSticker,
  onResizeSticker,
  onRotateSticker,
  onMovePriceFlag,
  onEditSection,      // kept for callers that use it
  leftDragPan = false,
  verticalBias = -120,
  showGrid = true,
  gridSize = 40,
  majorGrid = 200,
}) {
  if (!data) return null;

  const containerRef = useRef(null);
  const artboardRef   = useRef(null);
  const wrapperRef    = useRef(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const startPan = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const space = useRef(false);

  // ---- Background style helper (supports legacy string and new object) ----
  const getBackgroundStyle = (bg) => {
    if (!bg) return { backgroundColor: "#000" };
    if (typeof bg === "string") {
      // Legacy: string = image data URL or path
      return {
        backgroundColor: "#000",
        backgroundImage: bg ? `url(${bg})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    // Object: { type, image, colors[], direction, ratio }
    const type = bg.type || "one";
    const direction = bg.direction || "to right";
    if (type === "image") {
      return {
        backgroundColor: "#000",
        backgroundImage: bg.image ? `url(${bg.image})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (type === "one") {
      return { background: (bg.colors && bg.colors[0]) || "#000" };
    }
    if (type === "two") {
      const a = bg.colors?.[0] || "#000";
      const b = bg.colors?.[1] || "#111";
      const r = typeof bg.ratio === "number" ? bg.ratio : 50;
      const stopA = Math.max(0, Math.min(100, r));
      const stopB = stopA + 0.001; // epsilon to avoid seams
      return { background: `linear-gradient(${direction}, ${a} 0% ${stopA}%, ${b} ${stopB}% 100%)` };
    }
    if (type === "custom") {
      const cols = Array.isArray(bg.colors) && bg.colors.length >= 2 ? bg.colors.slice(0, 4) : ["#000", "#111"];
      const n = cols.length;
      let acc = 0;
      const step = 100 / n;
      const stops = cols.map((c, i) => {
        const from = Math.max(0, Math.min(100, acc));
        acc += step;
        const to = Math.max(0, Math.min(100, acc));
        const eps = i < n - 1 ? 0.001 : 0;
        return `${c} ${from}% ${to - eps}%`;
      }).join(", ");
      return { background: `linear-gradient(${direction}, ${stops})` };
    }
    return { backgroundColor: "#000" };
  };

  // ── Center with vertical bias ───────────────────────────────────
  const recenter = () => {
    const el = containerRef.current;
    const box = artboardRef.current;
    if (!el || !box) return;
    const nx = (el.clientWidth - 1920) / 2;
    const ny = (el.clientHeight - 1080) / 2 + verticalBias;
    setPan({ x: nx, y: ny });
  };
  useEffect(() => {
    recenter();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recenter);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Space-drag
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === "Space") {
        space.current = true;
        if (containerRef.current) containerRef.current.style.cursor = "grab";
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") {
        space.current = false;
        if (containerRef.current) containerRef.current.style.cursor = "default";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Pan handlers
  const beginPanIfNeeded = (e) => {
    const el = containerRef.current;
    if (!el) return;
    const insideArtboard = !!e.target?.closest?.(`#${CSS.escape(captureId)}`);
    const leftPasteboard = e.button === 0 && !insideArtboard;
    const leftWithHand   = e.button === 0 && leftDragPan;
    const middleAnywhere = e.button === 1;
    const spaceLeft      = space.current && e.button === 0;

    if (middleAnywhere || spaceLeft || leftWithHand || leftPasteboard) {
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      startPan.current = { ...pan };
      el.style.cursor = "grabbing";
      e.preventDefault();
    }
  };
  const onMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: startPan.current.x + dx, y: startPan.current.y + dy });
  };
  const endPan = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = space.current ? "grab" : "default";
  };
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    el.addEventListener("mousedown", beginPanIfNeeded);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endPan);
    return () => {
      el.removeEventListener("mousedown", beginPanIfNeeded);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endPan);
    };
  }, [pan, leftDragPan]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#1e1e1e] relative"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* translated wrapper (no scrollbars) */}
      <div
        ref={wrapperRef}
        style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          transform: `translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        {/* artboard */}
        <div
          id={captureId}
          ref={artboardRef}
          style={{
            position: "absolute",
            width: 1920, height: 1080, left: 0, top: 0,
            pointerEvents: "auto",
            ...getBackgroundStyle(data.background),
            boxShadow: "0 0 25px rgba(0,0,0,0.6)",
            overflow: "visible",
          }}
        >
          {showGrid && <GridOverlay size={gridSize} major={majorGrid} />}

          {/* sections */}
          {(data.sections || []).map((s) => {
            const entry = TEMPLATE_REGISTRY[s.type] || TEMPLATE_REGISTRY["menu-card"];
            const Component = entry.Component;
            return (
              <div key={s.id} data-sec-id={s.id} style={{ position: "relative" }}>
                <Component
                  {...s}
                  onDrag={(id, nx, ny) => onDragSection?.(id, nx, ny)}
                  onMovePriceFlag={(id, offX, offY) => onMovePriceFlag?.(id, offX, offY)}
                />
              </div>
            );
          })}

          {/* stickers */}
          {(data.sections || []).map((s) =>
            (s.stickers || []).map((st) => (
              <Sticker
                key={st.id}
                sectionId={s.id}
                st={st}
                onDragSticker={onDragSticker}
                onResizeSticker={onResizeSticker}
                onRotateSticker={onRotateSticker}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
