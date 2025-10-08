// File: src/components/templates/PizzaCard.jsx
import React, { useEffect, useRef, useState } from "react";
import HeaderBanner from "../headers/HeaderBanner";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isAttached = (style) => style === "solid" || style === "gradient";

function useDataUrl(fileOrUrl) {
  const [dataUrl, setDataUrl] = useState("");
  useEffect(() => {
    let cancelled = false;
    if (!fileOrUrl) { setDataUrl(""); return; }
    if (typeof fileOrUrl === "string") { setDataUrl(fileOrUrl); return; }
    const reader = new FileReader();
    reader.onload = () => { if (!cancelled) setDataUrl(reader.result || ""); };
    try { reader.readAsDataURL(fileOrUrl); } catch { setDataUrl(""); }
    return () => { cancelled = true; };
  }, [fileOrUrl]);
  return dataUrl;
}

export default function PizzaCard({
  id, x = 60, y = 60, w = 980, h = 1020,
  bgType = "gradient", frameColor = "#ffffff", gradFrom = "#ffffff", gradTo = "#e6e6e6",
  cardBg = "#ffffff", cardBgImage1 = "", cardBgFit = "cover", cardBg1Alpha = 1,
  cardBgImage2 = "", cardBg2Fit = "contain", cardBg2Alpha = 1,
  alpha = 0.98, radius = 26, padX = 28, padY = 22, contentTopPad = 8,

  header, bodyFont = "Inter", headerFont = "Poppins", headerTitleSize,

  colCount = 3, colLabels = ['10"', '12"', '16"'], colHeaderSize = 16,
  items = [],
  nameColor = "#c63b2f", nameSize = 30, descColor = "#333333", descSize = 20,
  allergenColor = "#2aa43a", allergenSize = 16, allergenRaise = -8, rowGap = 10, divider = true,
  priceFont = "Inter", priceColor = "#1f2937", priceSize = 22,
  footerFont = "Poppins", footerLine1 = "", footerLine1Color = "#178c45", footerLine1Size = 22, footerLine1Align = "center",
  footerLine2 = "", footerLine2Color = "#222222", footerLine2Size = 18, footerLine2Align = "center",
  onDrag,
}) {
  const ref = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    const start = { x, y };
    const move = (ev) =>
      onDrag && onDrag(id, Math.round(start.x + ev.clientX - sx), Math.round(start.y + ev.clientY - sy));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const frameBg =
    bgType === "solid" ? frameColor : `linear-gradient(180deg, ${gradFrom}, ${gradTo})`;
  const normalizedLabels = Array.isArray(colLabels) ? colLabels.filter(Boolean) : [];
  const priceCols = Math.max(2, Math.min(6, normalizedLabels.length || Number(colCount) || 2));

  const reservedHeight = clamp(header?.reservedHeight ?? header?.height ?? 0, 0, h);
  const attachGap = isAttached(header?.style);

  const hdrProps = { ...(header?.props || {}) };
  const titleText =
    (hdrProps.text ?? hdrProps.label ?? header?.title ?? header?.label ?? header?.text ?? "PIZZA").toString();
  const titleColor = hdrProps.textColor ?? "#ffffff";

  const tOffX = Number(hdrProps.titleShiftX ?? header?.titleShiftX ?? hdrProps.offsetX ?? header?.offsetX ?? 0);
  const tOffY = Number(hdrProps.titleShiftY ?? header?.titleShiftY ?? hdrProps.offsetY ?? header?.offsetY ?? 0);

  const bg1Url = useDataUrl(cardBgImage1);
  const bg2Url = useDataUrl(cardBgImage2);

  const fam = (f) =>
    `"${(f || "").toString().split(",")[0].trim()}", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;

  return (
    <div
      ref={ref}
      data-sec-id={id}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius,
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)", overflow: "visible", background: frameBg, opacity: alpha,
        userSelect: "none",
        fontFamily: fam(bodyFont),
      }}
    >
      {/* Plate */}
      <div
        style={{
          position: "absolute", inset: 10, borderRadius: Math.max(0, radius - 8),
          overflow: "hidden", zIndex: 0, background: cardBg,
        }}
      >
        {bg1Url ? (
          <div
            style={{
              position: "absolute", inset: 0, backgroundImage: `url(${bg1Url})`,
              backgroundSize: cardBgFit || "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
              opacity: clamp(cardBg1Alpha ?? 1, 0, 1), pointerEvents: "none",
            }}
          />
        ) : null}
        {bg2Url ? (
          <div
            style={{
              position: "absolute", inset: 0, backgroundImage: `url(${bg2Url})`,
              backgroundSize: cardBg2Fit || "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
              opacity: clamp(cardBg2Alpha ?? 1, 0, 1), pointerEvents: "none",
            }}
          />
        ) : null}
      </div>

      {/* Content */}
      <div style={{ position: "absolute", inset: 10, padding: `${padY}px ${padX}px`, zIndex: 1 }}>
        {/* Header (graphics) */}
        {header && reservedHeight > 0 && (
          <div style={{ position: "relative", height: reservedHeight, marginBottom: attachGap ? 8 : 0 }}>
            <HeaderBanner
              width={w - padX * 2}
              height={reservedHeight}
              radius={12}
              header={{ ...header, title: "", subtitle: "", props: { ...(header?.props || {}), text: "", label: "", subtitle: "", suppressText: true } }}
            />
            {/* Overlay title (movable) */}
            <div
              style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: header?.align === "left" ? "flex-start" : header?.align === "right" ? "flex-end" : "center",
                transform: `translate(${tOffX}px, ${tOffY}px)`, pointerEvents: "none",
              }}
            >
              <span
                data-path="header.props.text"
                style={{
                  display: "inline-block", pointerEvents: "auto",
                  fontFamily: fam(headerFont), fontWeight: 900,
                  fontSize: headerTitleSize ? Number(headerTitleSize) : Math.max(22, Math.min(64, reservedHeight - 24)),
                  color: titleColor, lineHeight: 1, padding: "0 2px", whiteSpace: "nowrap",
                }}
              >
                {titleText}
              </span>
            </div>
          </div>
        )}

        {/* Size labels */}
        <div
          style={{
            marginTop: Number(contentTopPad) || 0,
            display: "grid",
            gridTemplateColumns: `minmax(0,1fr) ${Array(priceCols).fill("minmax(90px,0.25fr)").join(" ")}`,
            columnGap: 16,
            alignItems: "end",
            fontFamily: fam(headerFont),
            marginBottom: 6,
          }}
        >
          <div />
          {Array.from({ length: priceCols }, (_, i) => (
            <div
              key={`hdr-${i}`}
              style={{ textAlign: "right", fontWeight: 800, fontSize: Number(colHeaderSize) || 16, color: "#3a3a3a", paddingBottom: 4, fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
            >
              {normalizedLabels[i] ?? `Col ${i + 1}`}
            </div>
          ))}
        </div>

        {/* Items */}
        <div>
          {items.map((it, row) => {
            const hasDesc = !!(it.desc && it.desc.trim());
            const prices = Array.from({ length: priceCols }, (_, i) => it.prices?.[i] ?? "");
            return (
              <div key={it.id || row} style={{ display: "grid", gridTemplateColumns: `minmax(0,1fr) ${Array(priceCols).fill("minmax(90px,0.25fr)").join(" ")}`, columnGap: 16, alignItems: "start", padding: `${row ? rowGap : 0}px 0`, borderTop: row && divider ? "1px dashed rgba(0,0,0,0.15)" : "none" }}>
                {/* Name + desc + allergens */}
                <div>
                  <div style={{ fontFamily: fam(bodyFont), fontWeight: 800, color: nameColor, fontSize: Number(nameSize) || 30, lineHeight: 1.1 }}>{it.name || "Item"}</div>
                  {hasDesc && <div style={{ fontFamily: fam(bodyFont), color: descColor, fontSize: Number(descSize) || 20, marginTop: 2 }}>{it.desc}</div>}
                  {!!(it.allergens && it.allergens.trim()) && (
                    <div style={{ fontFamily: fam(bodyFont), color: allergenColor, fontSize: Number(allergenSize) || 16, transform: `translateY(${Number(allergenRaise) || 0}px)` }}>
                      {it.allergens}
                    </div>
                  )}
                </div>

                {/* Prices */}
                {prices.map((p, i) => (
                  <div key={`p${row}-${i}`} style={{ textAlign: "right", fontFamily: fam(priceFont), color: priceColor, fontSize: Number(priceSize) || 22, fontWeight: 800 }}>
                    {p}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {(footerLine1 || footerLine2) && (
          <div style={{ marginTop: 12 }}>
            {footerLine1 && (
              <div style={{ fontFamily: fam(footerFont), color: footerLine1Color, fontSize: Number(footerLine1Size) || 22, textAlign: footerLine1Align || "center", lineHeight: 1.2 }}>
                {footerLine1}
              </div>
            )}
            {footerLine2 && (
              <div style={{ fontFamily: fam(footerFont), color: footerLine2Color, fontSize: Number(footerLine2Size) || 18, textAlign: footerLine2Align || "center", lineHeight: 1.2 }}>
                {footerLine2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
