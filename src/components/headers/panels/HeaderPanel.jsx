import React from "react";
import { HEADER_BEHAVIOR, headerDefaults, HEADER_REGISTRY } from "../headerRegistry";

export default function HeaderPanel({ section, updateSection }) {
  const h = section.header || headerDefaults("solid");

  const applyHeader = (partial) => {
    updateSection(section.id, "header", { ...h, ...partial });
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const setNum = (key, lo, hi) => (e) => applyHeader({ [key]: clamp(Number(e.target.value), lo, hi) });

  const onTypeChange = (e) => {
    const nextType = e.target.value;
    const def = headerDefaults(nextType);
    applyHeader({
      ...def,
      type: nextType,
      align: h.align ?? def.align,
      height: h.height ?? def.height,
      widthPct: h.widthPct ?? def.widthPct,
      offsetX: h.offsetX ?? def.offsetX,
      offsetY: h.offsetY ?? def.offsetY,
      props: { ...(HEADER_REGISTRY[nextType]?.defaults?.() || {}), ...(h.props || {}) },
    });
  };

  const isFree = HEADER_BEHAVIOR[h.type] === "free";
  const StylePanel = HEADER_REGISTRY[h.type]?.Panel || null;
  const hp = h.props || {};

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm text-gray-600">Style</label>
        <select className="border rounded px-2" value={h.type || "solid"} onChange={onTypeChange}>
          {Object.keys(HEADER_REGISTRY).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <label className="text-sm text-gray-600">Align</label>
        <select
          className="border rounded px-2"
          value={h.align ?? "center"}
          onChange={(e) => applyHeader({ align: e.target.value })}
        >
          <option value="left">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>

        <label className="text-sm text-gray-600">Reserved Height (px)</label>
        <input
          type="number"
          className="border rounded px-2"
          min={40}
          max={320}
          value={h.height ?? 120}
          onChange={setNum("height", 40, 320)}
        />
      </div>

      {isFree && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-gray-600">Header Width %</label>
          <input type="range" min="10" max="120" step="1" value={h.widthPct ?? 100} onChange={setNum("widthPct", 10, 120)} />

          <label className="text-sm text-gray-600">Horizontal Offset</label>
          <input type="number" className="border rounded px-2" value={h.offsetX ?? 0} onChange={setNum("offsetX", -500, 500)} />

          <label className="text-sm text-gray-600">Vertical Offset</label>
          <input type="number" className="border rounded px-2" value={h.offsetY ?? 0} onChange={setNum("offsetY", -500, 500)} />

          {/* NEW: independent header corner radius for FREE styles */}
          <label className="text-sm text-gray-600">Header Corner Radius</label>
          <input
            type="number"
            className="border rounded px-2"
            min={0}
            max={120}
            value={hp.radius ?? 12}
            onChange={(e) => applyHeader({ props: { ...hp, radius: Math.max(0, Number(e.target.value) || 0) } })}
          />
        </div>
      )}

      {StylePanel ? (
        <StylePanel
          value={hp}
          onChange={(next) => {
            if (next && typeof next === "object" && !Array.isArray(next)) {
              applyHeader({ props: { ...hp, ...next } });
            }
          }}
        />
      ) : null}
    </div>
  );
}
