import React from "react";

const defaults = () => ({ color: "#e32727", tip: 42, radius: 12 });

// build a path that only rounds the LEFT corners
function leftOnlyRoundedRectPath(w, h, r) {
  const rr = Math.max(0, Math.min(r || 0, Math.min(w, h) / 2));
  // M r,0 H w V h H r A r,r 0 0 1 0,h-r V r A r,r 0 0 1 r,0 Z
  return `M ${rr} 0 H ${w} V ${h} H ${rr} A ${rr} ${rr} 0 0 1 0 ${h - rr} V ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
}

function Render({ width = 800, height = 120, radius = 12, props = {} }) {
  const tip = Math.max(6, Number(props.tip ?? 42));
  const color = props.color || "#e32727";
  const w = Math.max(tip + 4, Number(width) || 0);

  const clipId = React.useId();
  const path = leftOnlyRoundedRectPath(w, height, radius);

  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* concave notch on the RIGHT */}
        <polygon
          points={`0,0 ${w},0 ${w - tip},${height / 2} ${w},${height} 0,${height}`}
          fill={color}
        />
      </g>
    </svg>
  );
}

function Panel({ value = {}, onChange }) {
  const { color = "#e32727", tip = 42, radius = 12 } = value;
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm text-gray-600">Color</label>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange?.({ ...value, color: e.target.value })}
        className="h-8 w-16 p-0 border rounded"
      />

      <label className="text-sm text-gray-600">Notch Width (px)</label>
      <input
        type="number"
        min={6}
        step={1}
        value={tip}
        onChange={(e) => onChange?.({ ...value, tip: Number(e.target.value) })}
        className="border rounded px-2"
      />

      <label className="text-sm text-gray-600">Header Corner Radius</label>
      <input
        type="number"
        min={0}
        step={1}
        value={radius}
        onChange={(e) => onChange?.({ ...value, radius: Math.max(0, Number(e.target.value) || 0) })}
        className="border rounded px-2"
      />
    </div>
  );
}

export default { Render, Panel, defaults };
