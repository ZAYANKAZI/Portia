// src/components/templates/MenuCard.jsx
import React from "react";
import HeaderBanner from "../headers/HeaderBanner";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hexToRgba = (hex, a = 0.95) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#ffffff");
  const r = m ? parseInt(m[1], 16) : 255;
  const g = m ? parseInt(m[2], 16) : 255;
  const b = m ? parseInt(m[3], 16) : 255;
  return `rgba(${r},${g},${b},${a})`;
};

// Parse "€25.00", "$7.5", "9.90", "£12", "25€", etc.
function splitPrice(raw = "") {
  const s = String(raw).trim();
  if (!s) return null;
  const m = s.match(/^([^\d\-.,]+)?\s*([\-]?\d+(?:[.,]\d{1,2})?)\s*([^\d\-.,]+)?$/);
  if (!m) return null;
  const cur = m[1] || m[3] || "";
  const num = m[2].replace(",", ".");
  const [intPart, decPart = ""] = num.split(".");
  return { currency: cur, intPart, decPart };
}

export default function MenuCard(props) {
  const {
    id, x = 60, y = 60,
    bodyWidth: W = 820,

    // plate corners / padding
    radius = 18,
    plateRadiusTop,
    plateRadiusBottom,
    padX = 28,
    padY = 22,
    contentTopPad = 0,

    // plate background
    cardBg = "#ffffff",
    cardAlpha = 0.95,
    cardBgImage,

    // header config
    header = { type: "solid", align: "center", height: 120, props: {} },

    // title
    title = "CARD TITLE",
    titleDesc = "",
    titleColor = "#ffffff",
    titleDescColor = "#ffffff",
    titleSize = 64,
    titleDescSize = 22,
    titleFont = "Poppins, system-ui, sans-serif",
    bodyFont = "Inter, system-ui, sans-serif",

    // items typography
    nameSize = 32,
    descSize = 20,
    priceSize = 32,
    nameColor = "#222222",
    descColor = "#333333",
    priceColor = "#222222",
    allergensSize = 16,
    allergensColor = "#d32f2f",

    // price formatting
    priceFormat = "plain",   // "plain" | "split"
    currencyScale = 0.6,
    decimalsScale = 0.55,
    currencyDy = 0,
    decimalsDy = -2,

    // data
    products = [],

    onDrag,
  } = props;

  const headerType = (header?.type || "solid").toLowerCase();
  const isAttached = ["solid", "gradient"].includes(headerType);
  const isFreeHeader = !isAttached;
  const HEADER_H = Math.max(40, Number(header?.height || 120));

  const hp = header?.props || {};
  const widthPct = clamp(Number(header?.widthPct ?? hp.widthPct ?? 100), 10, 120);
  const offsetX  = Number(header?.offsetX  ?? hp.offsetX  ?? 0);
  const offsetY  = Number(header?.offsetY  ?? hp.offsetY  ?? hp.verticalOffset ?? 0);

  const plateRTop = plateRadiusTop ?? radius;
  const plateRBottom = plateRadiusBottom ?? radius;
  const bannerRadius = isAttached ? plateRTop : Number(hp.radius ?? 12);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    const move = (ev) => onDrag?.(id, Math.round(x + ev.clientX - sx), Math.round(y + ev.clientY - sy));
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up, { once: true });
  };

  const overlay = hexToRgba(cardBg, clamp(cardAlpha, 0, 1));

  const Title = (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 24px",
        textAlign: "center", color: titleColor, fontFamily: titleFont,
        pointerEvents: "auto" /* allow dbl-click */,
      }}
    >
      {!!(title || "").length && (
        <div data-path="title" style={{ fontSize: titleSize, lineHeight: 1.05, fontWeight: 800 }}>
          {title}
        </div>
      )}
      {!!(titleDesc || "").length && (
        <div
          data-path="titleDesc"
          style={{ fontSize: titleDescSize, lineHeight: 1.15, color: titleDescColor, marginTop: 6 }}
        >
          {titleDesc}
        </div>
      )}
    </div>
  );

  const renderPrice = (raw) => {
    if (priceFormat !== "split") return <span style={{ fontWeight: 800 }}>{raw}</span>;
    const parts = splitPrice(raw);
    if (!parts) return <span style={{ fontWeight: 800 }}>{raw}</span>;
    const curFS = Math.max(10, Math.round(priceSize * currencyScale));
    const decFS = Math.max(10, Math.round(priceSize * decimalsScale));
    return (
      <span style={{ display: "inline-flex", alignItems: "center", lineHeight: 1 }}>
        {parts.currency ? (
          <span style={{ fontSize: curFS, fontWeight: 800, marginRight: 4, transform: `translateY(${currencyDy}px)` }}>
            {parts.currency}
          </span>
        ) : null}
        <span style={{ fontSize: priceSize, fontWeight: 800, lineHeight: 1 }}>{parts.intPart}</span>
        {parts.decPart ? (
          <span style={{ fontSize: decFS, fontWeight: 800, lineHeight: 1, marginLeft: 2, transform: `translateY(${decimalsDy}px)` }}>
            .{parts.decPart}
          </span>
        ) : null}
      </span>
    );
  };

  return (
    <div className="absolute select-none" style={{ top: y, left: x, cursor: "move", zIndex: 10 }} onMouseDown={onMouseDown}>
      <div style={{ width: W, position: "relative", fontFamily: bodyFont, background: "transparent", overflow: "visible" }}>
        {isFreeHeader && (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HEADER_H, zIndex: 50 }}>
            <HeaderBanner width={W} height={HEADER_H} radius={bannerRadius} header={{ ...header, widthPct, offsetX, offsetY }}>
              {Title}
            </HeaderBanner>
          </div>
        )}

        <div
          style={{
            position: "relative",
            borderTopLeftRadius: plateRTop, borderTopRightRadius: plateRTop,
            borderBottomLeftRadius: plateRBottom, borderBottomRightRadius: plateRBottom,
            overflow: "hidden", zIndex: 0, boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            backgroundImage: cardBgImage ? `linear-gradient(${overlay}, ${overlay}), url("${cardBgImage}")` : "none",
            backgroundColor: cardBgImage ? "transparent" : overlay, backgroundSize: "cover", backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {isAttached && (
            <div style={{ position: "relative", width: "100%", height: HEADER_H }}>
              <HeaderBanner width={W} height={HEADER_H} radius={bannerRadius} header={{ ...header, widthPct: 100, offsetX: 0, offsetY: 0 }}>
                {Title}
              </HeaderBanner>
            </div>
          )}

          <div
            style={{
              position: "relative", zIndex: 1,
              paddingLeft: padX, paddingRight: padX, paddingBottom: padY, paddingTop: padY + (contentTopPad || 0),
            }}
          >
            {(products || []).map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start",
                  gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: nameSize, lineHeight: 1.15, color: nameColor }}>
                    <span data-path={`products.${idx}.name`}>{p.name || "Item"}</span>
                    {p.allergens ? (
                      <sup
                        data-path={`products.${idx}.allergens`}
                        style={{ marginLeft: 8, fontWeight: 800, fontSize: Math.max(10, allergensSize), color: allergensColor }}
                      >
                        {p.allergens}
                      </sup>
                    ) : null}
                  </div>

                  {p.description ? (
                    <div data-path={`products.${idx}.description`} style={{ fontSize: descSize, opacity: 0.95, color: descColor, marginTop: 6 }}>
                      {p.description}
                    </div>
                  ) : null}
                </div>

                <div
                  data-path={`products.${idx}.price`}
                  style={{ fontWeight: 800, fontSize: priceSize, lineHeight: 1, alignSelf: "center", color: priceColor, textAlign: "right" }}
                >
                  {renderPrice(p.price || "")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
