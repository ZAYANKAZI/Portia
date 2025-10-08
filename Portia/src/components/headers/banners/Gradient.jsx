import React from "react";

function Render({ width = 800, height = 120, radius = 12, props = {} }) {
  const {
    color1 = "#b01c1c",
    color2 = "#e63946",
    angle = 90,
  } = props;

  return (
    <div
      style={{
        width,
        height,
        background: `linear-gradient(${Number(angle) || 0}deg, ${color1}, ${color2})`,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
      }}
    />
  );
}

const defaults = () => ({
  color1: "#b01c1c",
  color2: "#e63946",
  angle: 90,
});

function Panel({ value = {}, onChange }) {
  const {
    color1 = "#b01c1c",
    color2 = "#e63946",
    angle = 90,
  } = value;

  const set = (patch) => onChange?.(patch);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm text-gray-600">Color 1</label>
        <input
          type="color"
          value={color1}
          onChange={(e) => set({ color1: e.target.value })}
          className="h-8 w-16 p-0 border rounded"
          title="Gradient start color"
        />

        <label className="text-sm text-gray-600">Color 2</label>
        <input
          type="color"
          value={color2}
          onChange={(e) => set({ color2: e.target.value })}
          className="h-8 w-16 p-0 border rounded"
          title="Gradient end color"
        />

        <label className="text-sm text-gray-600">Angle (°)</label>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={angle}
          onChange={(e) => set({ angle: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

export default { Render, Panel, defaults };
