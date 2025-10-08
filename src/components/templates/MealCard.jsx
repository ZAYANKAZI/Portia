// src/components/templates/MealCard.jsx
import React from "react";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function PriceSingleFlag({
  x = 0, y = 0, w = 200, h = 84, notch = 36, radius = 18,
  color = "#1f8a4c", textColor = "#ffffff",
  currency = "€", intPart = "11", decPart = "00",
  currencyScale = 0.45, intScale = 0.75, decScale = 0.40,
  currencyDy = 0, decimalsDy = -2,
  direction = "right",
  onDragStart,
}) {
  const fsInt = Math.max(12, Math.round(h * intScale));
  const fsCur = Math.max(10, Math.round(h * currencyScale));
  const fsDec = Math.max(10, Math.round(h * decScale));

  const r = Math.min(radius, h / 2);
  const n = clamp(notch, 0, Math.max(0, w * 0.9));

  const dRight = [
    `M ${r} 0`, `H ${w}`, `L ${w - n} ${h / 2}`, `L ${w} ${h}`, `H ${r}`,
    `Q 0 ${h} 0 ${h - r}`, `V ${r}`, `Q 0 0 ${r} 0`, "Z",
  ].join(" ");
  const dLeft = [
    `M 0 0`, `H ${w - r}`, `Q ${w} 0 ${w} ${r}`, `V ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`, `H 0`, `L ${n} ${h / 2}`, "Z",
  ].join(" ");

  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, pointerEvents: "auto", userSelect: "none" }} onPointerDown={onDragStart}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <path d={direction === "left" ? dLeft : dRight} fill={color} />
      </svg>

      {/* Editable price parts */}
      <div
        style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6, color: textColor, fontWeight: 900, pointerEvents: "none",
        }}
      >
        <span data-path="currency" style={{ fontSize: fsCur, transform: `translateY(${currencyDy}px)`, pointerEvents: "auto" }}>
          {currency}
        </span>
        <span data-path="priceInt" style={{ fontSize: fsInt, lineHeight: 1, pointerEvents: "auto" }}>
          {intPart}
        </span>
        <span data-path="priceDec" style={{ fontSize: fsDec, transform: `translateY(${decimalsDy}px)`, pointerEvents: "auto" }}>
          .{decPart}
        </span>
      </div>
    </div>
  );
}

export default function MealCard(props) {
  const {
    id, x = 60, y = 60,

    // outer frame
    w = 520, h = 720, radius = 22,

    // frame background
    bgType = "gradient", gradFrom = "#ffffff", gradTo = "#c8421f", frameColor = "#ffffff",

    // inner plate
    padX = 24, padY = 22, cardBgType = "solid", cardBg = "#ffffff",
    cardBgImage = "", cardBgFit = "cover", cardAlpha = 0.95, cardBgAlpha,

    // ===== HEADER (3 text lines) =====
    titleAlign = "left", titleSpacing = 2, titleFont = "Poppins, system-ui, sans-serif",
    title1 = "CHICKEN BURGER", title1Size = 44, title1Color = "#257453",
    title2 = "MEAL", title2Size = 34, title2Color = "#1e1e1e",
    title3 = "(With Cheese)", title3Size = 22, title3Color = "#b01c1c",

    // ===== BODY =====
    bodyLines = ["(Breaded)"], bodySize = 22, bodyColor = "#1e1e1e", bodyFont = "Inter, system-ui, sans-serif",
    contentTopPad = 0,

    // ===== PRICE FLAG =====
    currency = "€", priceInt = "11", priceDec = "00",
    priceFlagColor = "#1f8a4c", priceTextColor = "#ffffff",
    priceFlagW = 200, priceFlagH = 84, priceFlagNotch = 36, priceFlagRadius = 18,
    priceFlagOffsetX = 0, priceFlagOffsetY = 0, priceFlagDirection = "right",
    currencyScale = 0.45, decimalsScale = 0.40, currencyDy = 0, decimalsDy = -2,

    onDrag, onMovePriceFlag,
  } = props;

  const onCardPointerDown = (e) => {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    const move = (ev) => onDrag?.(id, Math.round(x + ev.clientX - sx), Math.round(y + ev.clientY - sy));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const frameBackground = bgType === "solid" ? frameColor : `linear-gradient(180deg, ${gradFrom}, ${gradTo})`;
  const contentW = w - padX * 2;

  const present = (t) => t != null && String(t).trim().length > 0;
  const h1 = present(title1) ? title1Size * 1.1 : 0;
  const h2 = present(title2) ? title2Size * 1.1 : 0;
  const h3 = present(title3) ? title3Size * 1.1 : 0;
  const lines = [h1, h2, h3].filter((v) => v > 0).length;
  const titlesHeight = h1 + h2 + h3 + Math.max(0, lines - 1) * titleSpacing;

  const alignItems = titleAlign === "center" ? "center" : titleAlign === "right" ? "flex-end" : "flex-start";
  const textAlign = titleAlign;

  const bodyLineH = bodySize * 1.25;
  const bodyHeight = (bodyLines?.length || 0) * bodyLineH;
  const bodyTop = titlesHeight + contentTopPad;

  const priceBaseY = bodyTop + bodyHeight + 16;
  const priceY = Math.round(priceBaseY + (priceFlagOffsetY || 0));
  const priceX = Math.round((priceFlagOffsetX || 0));

  const onFlagPointerDown = (e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    const startX = e.clientX, startY = e.clientY;
    const startOX = priceFlagOffsetX || 0, startOY = priceFlagOffsetY || 0;
    const move = (ev) => onMovePriceFlag?.(id, startOX + Math.round(ev.clientX - startX), startOY + Math.round(ev.clientY - startY));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  return (
    <div
      data-sec-id={id}
      onPointerDown={onCardPointerDown}
      className="absolute"
      style={{
        left: x, top: y, width: w, height: h, borderRadius: radius,
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)", overflow: "visible",
        userSelect: "none", background: frameBackground, fontFamily: titleFont,
      }}
    >
      {/* inner plate */}
      <div
        style={{
          position: "absolute", inset: 10, borderRadius: Math.max(0, radius - 8), overflow: "hidden",
          background: cardBgType === "solid" ? cardBg : "transparent",
          opacity: clamp(cardBgAlpha ?? cardAlpha ?? 0.95, 0, 1),
          zIndex: 0,
        }}
      >
        {cardBgType === "image" && cardBgImage ? (
          <div
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${cardBgImage})`, backgroundSize: cardBgFit || "cover",
              backgroundPosition: "center", backgroundRepeat: "no-repeat",
            }}
          />
        ) : null}
      </div>

      {/* content area */}
      <div style={{ position: "absolute", inset: 10, padding: `${padY}px ${padX}px`, zIndex: 1 }}>
        {/* HEADER (3 lines) */}
        <div style={{ width: contentW, display: "flex", flexDirection: "column", alignItems, textAlign, gap: `${titleSpacing}px` }}>
          {present(title1) && (
            <div data-path="title1" style={{ color: title1Color, fontWeight: 900, fontSize: title1Size, lineHeight: 1.1 }}>
              {title1}
            </div>
          )}
          {present(title2) && (
            <div data-path="title2" style={{ color: title2Color, fontWeight: 900, fontSize: title2Size, lineHeight: 1.1 }}>
              {title2}
            </div>
          )}
          {present(title3) && (
            <div data-path="title3" style={{ color: title3Color, fontWeight: 900, fontSize: title3Size, lineHeight: 1.1 }}>
              {title3}
            </div>
          )}
        </div>

        {/* BODY */}
        <div style={{ marginTop: bodyTop, fontFamily: bodyFont }}>
          {bodyLines.map((t, i) => (
            <div key={i} data-path={`bodyLines.${i}`} style={{ fontSize: bodySize, color: bodyColor, fontWeight: 600, lineHeight: 1.25 }}>
              {t}
            </div>
          ))}
        </div>

        {/* PRICE FLAG (editable currency/int/dec) */}
        <PriceSingleFlag
          x={priceX} y={priceY} w={priceFlagW} h={priceFlagH}
          notch={priceFlagNotch} radius={priceFlagRadius}
          color={priceFlagColor} textColor={priceTextColor}
          currency={currency} intPart={priceInt} decPart={priceDec}
          currencyScale={currencyScale} decScale={decimalsScale}
          currencyDy={currencyDy} decimalsDy={decimalsDy}
          direction={priceFlagDirection}
          onDragStart={onFlagPointerDown}
        />
      </div>
    </div>
  );
}
