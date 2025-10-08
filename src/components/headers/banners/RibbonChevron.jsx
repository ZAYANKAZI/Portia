// src/components/headers/banners/RibbonChevron.jsx
import React from "react";

const defaults = () => ({ color: "#e32727", chevron: 36, foldOpacity: 0.18 });

function Render({ width, height, radius, props }) {
  const { color, chevron, foldOpacity } = props;
  const c = Math.max(12, Number(chevron || 36));

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* base */}
      <rect x="0" y="0" width={width} height={height} rx={radius} ry={radius} fill={color} />
      {/* right fold chevron (inside bounds so nothing gets clipped) */}
      <polygon
        points={`${width - c},0 ${width},${height / 2} ${width - c},${height}`}
        fill={`rgba(0,0,0,${foldOpacity ?? 0.18})`}
      />
    </svg>
  );
}

function Panel({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm text-gray-600">Color</label>
      <input type="color" value={value.color ?? "#e32727"} onChange={(e) => onChange({ ...value, color: e.target.value })} />
      <label className="text-sm text-gray-600">Chevron Width</label>
      <input type="number" className="border rounded px-2" value={value.chevron ?? 36} onChange={(e) => onChange({ ...value, chevron: Number(e.target.value) })} />
      <label className="text-sm text-gray-600">Fold Opacity</label>
      <input type="number" step="0.01" min="0" max="1" className="border rounded px-2" value={value.foldOpacity ?? 0.18} onChange={(e) => onChange({ ...value, foldOpacity: Number(e.target.value) })} />
    </div>
  );
}

export default { Render, Panel, defaults };
