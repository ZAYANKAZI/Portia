import React from "react";

function Render({ width = 800, height = 120, radius = 12, props = {} }) {
  const { color = "#176b3a" } = props; // default
  return (
    <div
      style={{
        width,
        height,
        background: color,
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
      }}
    />
  );
}

const defaults = () => ({ color: "#176b3a" });

function Panel({ value = {}, onChange }) {
  const { color = "#176b3a" } = value;
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm text-gray-600">Fill color</label>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange?.({ color: e.target.value })}
        className="h-8 w-16 p-0 border rounded"
        title="Header fill color"
      />
    </div>
  );
}

export default { Render, Panel, defaults };
