// File: src/components/headers/HeaderBanner.jsx
import React from "react";
import { HEADER_REGISTRY } from "./headerRegistry";

const DETACHED = new Set([
  "double-flag",
  "flag-tip",
  "image-brush",
  "twin-flag-threaded",
  "ribbon-chevron",
]);

export default function HeaderBanner({ width, height, radius, header = {}, children }) {
  const {
    type = "solid",
    align = "center",
    widthPct = 100,
    offsetX = 0,
    offsetY = 0,

    // overlay visual fields
    title,               // may be string OR React node (with data-path)
    subtitle,            // may be string OR React node
    titleFont = "",
    subtitleFont = "",
    titleColor,
    subtitleColor,
    titleSize,
    titleDescSize,

    // style-specific bucket (legacy text + shifts live here)
    props: hdrProps = {},
    height: bannerHeight, // optional per-banner height
  } = header;

  const entry = HEADER_REGISTRY[type] || HEADER_REGISTRY["solid"];
  const Render = entry?.Render;
  const defaults = entry?.defaults?.() || {};
  const styleProps = { ...defaults, ...hdrProps };

  // Requested offsets for the overlay text (from style props)
  const titleShiftX = Number(styleProps.titleShiftX || 0);
  const titleShiftY = Number(styleProps.titleShiftY || 0);

  // Placement (detached banners respect widthPct/align/offset)
  const isDetached = DETACHED.has(String(type).toLowerCase());
  const bannerW = isDetached ? Math.round((Number(widthPct || 100) * width) / 100) : width;

  let left = 0;
  if (isDetached) {
    if (align === "left") left = 0;
    else if (align === "right") left = width - bannerW;
    else left = Math.round((width - bannerW) / 2);
    left += Number(offsetX || 0);
  }

  let top = 0;
  if (isDetached) {
    const h = Number(bannerHeight || height);
    top = Math.round((height - h) / 2) + Number(offsetY || 0);
  }

  const justify =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  // ---- Node-safe title/subtitle (NO String() coercion) ----
  const hasNodeTitle = React.isValidElement(title);
  const hasNodeSubtitle = React.isValidElement(subtitle);

  // Fallback text sources if plain strings were provided via style props
  const fallbackTitleText =
    (!hasNodeTitle && typeof title === "string" && title.trim()) ||
    styleProps.text ||
    styleProps.label ||
    "";
  const fallbackSubtitleText =
    (!hasNodeSubtitle && typeof subtitle === "string" && subtitle.trim()) ||
    styleProps.subtitle ||
    "";

  const titleNode = hasNodeTitle ? (
    title
  ) : fallbackTitleText ? (
    <span
      style={{
        fontFamily: titleFont,
        color: titleColor,
        fontSize: Number(titleSize || 0) ? `${titleSize}px` : undefined,
        fontWeight: 900,
        lineHeight: 1.05,
        whiteSpace: "nowrap",
        letterSpacing: 0.4,
      }}
    >
      {fallbackTitleText}
    </span>
  ) : null;

  const subtitleNode = hasNodeSubtitle ? (
    subtitle
  ) : fallbackSubtitleText ? (
    <span
      style={{
        fontFamily: subtitleFont || titleFont,
        color: subtitleColor,
        fontSize: Number(titleDescSize || 0) ? `${titleDescSize}px` : undefined,
        fontWeight: 600,
        lineHeight: 1.05,
      }}
    >
      {fallbackSubtitleText}
    </span>
  ) : null;

  // Overlay content (prefer explicit children if provided)
  const overlay =
    children || (
      <div className="flex flex-col items-center gap-1">
        {titleNode}
        {subtitleNode}
      </div>
    );

  return (
    <div className="absolute inset-0" style={{ overflow: "visible", pointerEvents: "none" }}>
      <div
        className="relative"
        style={{
          position: "absolute",
          left,
          top,
          width: bannerW,
          height,
          overflow: "visible",
        }}
      >
        {/* 1) Banner graphics — FORCE NO INTERNAL TEXT */}
        {Render ? (
          <Render
            width={bannerW}
            height={height}
            radius={radius}
            // styles that read top-level or props text get blanked
            title=""
            subtitle=""
            props={{
              ...styleProps,
              text: "",
              label: "",
              subtitle: "",
              suppressText: true,
            }}
          />
        ) : (
          <div style={{ width: bannerW, height, background: "#333", borderRadius: radius }} />
        )}

        {/* 2) Our overlay (moves with titleShiftX/Y) */}
        {overlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: justify,
              padding: "0 24px",
              transform:
                titleShiftX || titleShiftY
                  ? `translate(${titleShiftX}px, ${titleShiftY}px)`
                  : undefined,
              pointerEvents: "auto", // allow inline-edit clicks on text nodes
              zIndex: 2,
            }}
          >
            {overlay}
          </div>
        )}
      </div>
    </div>
  );
}
