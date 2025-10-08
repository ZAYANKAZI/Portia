// src/components/BannerRibbon.jsx
import React from "react";

export default function BannerRibbon({
  width = 520,
  height = 120,
  radius = 18,
  color = "#FFB000",
  styleType = "chevron", // "chevron" | "flag" | "rect"
  className = "",
  style = {},
}) {
  const rx = Math.min(radius, height / 2);
  const notchW = Math.min(Math.round(height * 0.35), 48);
  const tipW = Math.min(Math.round(height * 0.75), 120);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base */}
      <rect x="0" y="0" width={width} height={height} rx={rx} fill={color} />

      {/* Right shape */}
      {styleType === "chevron" && (
        <>
          {/* subtle shadow fold */}
          <polygon
            points={`${width - notchW},0 ${width},${height / 2} ${width - notchW},${height}`}
            fill="rgba(0,0,0,.18)"
          />
        </>
      )}

      {styleType === "flag" && (
        <>
          {/* cut the right side to a flag tip */}
          <clipPath id="flagClip">
            <path
              d={`M0,0 H${width - tipW} L${width},${height / 2} L${width - tipW},${height} H0 Z`}
            />
          </clipPath>
          <g clipPath="url(#flagClip)">
            <rect x="0" y="0" width={width} height={height} rx={rx} fill={color} />
          </g>
          {/* tiny edge shadow to give depth */}
          <polygon
            points={`${width - tipW},0 ${width},${height / 2} ${width - tipW},${height}`}
            fill="rgba(0,0,0,.12)"
          />
        </>
      )}
    </svg>
  );
}
