import React, { useEffect, useRef, useState } from "react";
import { TEMPLATE_REGISTRY } from "./templates/registry";
import Sticker from "./canvas/sticker.jsx";
import GridOverlay from "./GridOverlay.jsx";
/**
 * Workspace: fills viewport, no page scrollbars. Artboard 1920×1080 at 1:1.
 * Pan with: Middle mouse, Space+Left, Left when Hand tool is ON, or Left on background.
 * New: double-click inline editor popup targeting the section’s primary text.
 */
export default function PreviewCanvas({
  data,
  captureId = "preview-capture",
  onDragSection,
  onDragSticker,
  onResizeSticker,
  onRotateSticker,
  onMovePriceFlag,
  onEditSection,      // NEW
  leftDragPan = false,
  verticalBias = -120,
  showGrid = true,
  gridSize = 40,
  majorGrid = 200,

}) {
  if (!data) return null;

  const containerRef = useRef(null);
  const artboardRef = useRef(null);
  const wrapperRef = useRef(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const startPan = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const space = useRef(false);

  // ── Inline editor popup ─────────────────────────────────────────
  // popup = { x, y, sectionId, key, draft }
  const [popup, setPopup] = useState(null);

  const pickPrimaryKey = (s) => {
    const prefs = ["title", "heading", "name", "subtitle", "description", "price", "text"];
    for (const k of prefs) if (typeof s?.[k] === "string") return k;
    if (typeof s?.header?.title === "string") return "header.title";
    return null;
  };

  const openPopupAt = (clientX, clientY, section) => {
    const key = pickPrimaryKey(section);
    if (!key) return;
    const rect = artboardRef.current.getBoundingClientRect();
    const x = Math.max(8, Math.min(clientX - rect.left, 1920 - 8));
    const y = Math.max(8, Math.min(clientY - rect.top, 1080 - 8));
    const value = key.includes(".")
      ? key.split(".").reduce((o, p) => (o ? o[p] : undefined), section)
      : section[key];
    setPopup({ x, y, sectionId: section.id, key, draft: value || "" });
  };

  const commitPopup = (next) => {
    if (!popup) return;
    onEditSection?.(popup.sectionId, popup.key, next);
    setPopup(null);
  };
  const cancelPopup = () => setPopup(null);

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
      if (e.key === "Escape") cancelPopup();
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
    if (!el || popup) return;
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
  }, [pan, leftDragPan, popup]);

  // Double-click inside a section → popup
  const handleDblClick = (e) => {
    if (e.target.closest?.("[data-inline-editor='1']")) return;
    const host = e.target.closest?.("[data-sec-id]");
    if (!host) return;
    const secId = host.getAttribute("data-sec-id");
    const section = (data.sections || []).find((s) => s.id === secId);
    if (!section) return;
    openPopupAt(e.clientX, e.clientY, section);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#1e1e1e] relative"
      onWheel={(e) => e.stopPropagation()}
      onDoubleClick={handleDblClick}
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
            backgroundColor: "#000",
            backgroundImage: data.background ? `url(${data.background})` : "none",
            backgroundSize: "cover", backgroundPosition: "center",
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
