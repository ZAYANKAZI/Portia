// src/components/canvas/sticker.jsx
import React, { useMemo, useRef } from "react";

function useResolvedSrc(source) {
  return useMemo(() => {
    if (!source) return "";
    if (typeof source === "string") return source;
    try { return URL.createObjectURL(source); } catch { return ""; }
  }, [source]);
}

/**
 * Sticker
 * - Renders above the card content (high z-index; uses st.z if provided)
 * - Rotates around the image CENTER (not the handle)
 * - Flip H / Flip V applied via scale(-1, 1) / scale(1, -1)
 * - All handles are data-no-export (won't appear in exported image)
 */
export default function Sticker({
  sectionId,
  st = {},
  scale = 1,
  onDragSticker,
  onResizeSticker,
  onRotateSticker,
}) {
  const {
    id,
    x = 0,
    y = 0,
    w = 120,
    h = 120,
    rotate = 0,         // degrees
    flipH = false,
    flipV = false,
    src,
    opacity = 1,
    z,                  // optional z-order from your UI (bring to front/back)
  } = st;

  const url = useResolvedSrc(src);
  const rootRef = useRef(null);

  // ---- DRAG ----
  const onDragDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const start = { sx: e.clientX, sy: e.clientY, x, y };
    const move = (ev) => {
      const dx = (ev.clientX - start.sx) / (scale || 1);
      const dy = (ev.clientY - start.sy) / (scale || 1);
      onDragSticker?.(sectionId, id, Math.round(start.x + dx), Math.round(start.y + dy));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  // ---- RESIZE ----
  const onResizeDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const start = { sx: e.clientX, sy: e.clientY, w, h };
    const move = (ev) => {
      const dw = (ev.clientX - start.sx) / (scale || 1);
      const dh = (ev.clientY - start.sy) / (scale || 1);
      const nw = Math.max(8, Math.round(start.w + dw));
      const nh = Math.max(8, Math.round(start.h + dh));
      onResizeSticker?.(sectionId, id, nw, nh);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  // ---- ROTATE (around image center) ----
  const onRotateDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const box = rootRef.current?.getBoundingClientRect();
    const cx = (box?.left || 0) + (box?.width || 0) / 2;
    const cy = (box?.top || 0) + (box?.height || 0) / 2;

    const move = (ev) => {
      const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
      const deg = (Math.round(ang) + 360) % 360;
      onRotateSticker?.(sectionId, id, deg);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  // ---- Compose transforms ----
  const scaleCss = scale || 1;
  const sX = flipH ? -1 : 1;
  const sY = flipV ? -1 : 1;
  const zIndex = typeof z === "number" ? z : 1000; // ensure above card

  return (
    <div
      ref={rootRef}
      className="absolute select-none group"
      style={{
        left: x * scaleCss,
        top: y * scaleCss,
        width: w * scaleCss,
        height: h * scaleCss,
        // Rotate around center of the sticker; apply flips
        transform: `rotate(${rotate}deg) scale(${sX}, ${sY})`,
        transformOrigin: "center center",
        // Keep stickers above card UI
        zIndex,
      }}
    >
      {/* CONTENT */}
      <img
        draggable={false}
        src={url}
        alt="sticker"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Selection outline (hidden in export) */}
      <div
        data-no-export="true"
        className="absolute inset-0 border border-transparent pointer-events-none group-hover:border-blue-500/90"
        style={{ boxSizing: "border-box", zIndex: 5 }}
      />

      {/* Drag overlay (below handles) */}
      <div
        data-no-export="true"
        onPointerDown={onDragDown}
        title="Move"
        className="absolute inset-0 cursor-move"
        style={{ background: "transparent", zIndex: 1 }}
      />

      {/* Rotate handle (above everything) */}
      <div
        data-no-export="true"
        onPointerDown={onRotateDown}
        title="Rotate"
        className="absolute left-1/2 -top-4 w-4 h-4 rounded-full bg-black/60 cursor-grab"
        style={{ transform: "translateX(-50%)", zIndex: 10, pointerEvents: "auto" }}
      />

      {/* Resize handle */}
      <div
        data-no-export="true"
        onPointerDown={onResizeDown}
        title="Resize"
        className="absolute right-0 bottom-0 w-4 h-4 bg-black/60 cursor-nwse-resize"
        style={{ zIndex: 10, pointerEvents: "auto" }}
      />
    </div>
  );
}
