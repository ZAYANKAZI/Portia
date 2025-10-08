// File: src/components/GridOverlay.jsx
import React from "react";

/**
 * Crisp grid overlay for the 1920×1080 artboard.
 * Not exported (data-no-export), non-interactive (pointer-events: none).
 */
export default function GridOverlay({
  size = 40,          // minor spacing
  major = 200,        // major spacing
  color = "#ffffff",
  opacity = 0.18,     // minor lines
  majorOpacity = 0.34 // major lines
}) {
  const W = 1920;
  const H = 1080;

  // Why: explicit <line> elements with non-scaling strokes remain 1 CSS px regardless of zoom.
  const common = {
    stroke: color,
    vectorEffect: "non-scaling-stroke",
    shapeRendering: "crispEdges",
    strokeWidth: 1
  };

  const minorV = [];
  const minorH = [];
  for (let x = 0; x <= W; x += size) minorV.push(
    <line key={`v-${x}`} x1={x} y1="0" x2={x} y2={H} {...common} strokeOpacity={opacity} />
  );
  for (let y = 0; y <= H; y += size) minorH.push(
    <line key={`h-${y}`} x1="0" y1={y} x2={W} y2={y} {...common} strokeOpacity={opacity} />
  );

  const majorV = [];
  const majorH = [];
  for (let x = 0; x <= W; x += major) majorV.push(
    <line key={`V-${x}`} x1={x} y1="0" x2={x} y2={H} {...common} strokeOpacity={majorOpacity} />
  );
  for (let y = 0; y <= H; y += major) majorH.push(
    <line key={`H-${y}`} x1="0" y1={y} x2={W} y2={y} {...common} strokeOpacity={majorOpacity} />
  );

  return (
    <div
      data-no-export="true"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999 // ensure grid sits above sections/stickers
      }}
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <g>{minorV}{minorH}</g>
        <g>{majorV}{majorH}</g>
      </svg>
    </div>
  );
}
