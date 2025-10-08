// File: src/components/templates/PizzaCardPanel.jsx
import React from "react";
import HeaderPanel from "../../headers/panels/HeaderPanel.jsx";

function Row({ children }) { return <div className="grid grid-cols-12 gap-2 items-center">{children}</div>; }
function Label({ children, className = "" }) { return <label className={`col-span-3 text-sm ${className}`}>{children}</label>; }
function Section({ title, children, open = true }) {
  return (
    <details open={open} className="mb-3 border rounded">
      <summary className="px-3 py-2 text-sm font-semibold bg-gray-100">{title}</summary>
      <div className="p-3 space-y-3">{children}</div>
    </details>
  );
}

export default function PizzaCardPanel({
  s,
  updateSection,
  fontOptions = [],   // strings or {value,label}
  loadGoogleFont,
}) {
  const field = (key, cast = (v) => v) => ({
    value: s[key] ?? "",
    onChange: (e) => updateSection(s.id, key, cast(e.target.value)),
  });
  const num = (key) => field(key, (v) => Number(v || 0));
  const bool = (key) => field(key, (v) => (v === "true" ? true : v === "false" ? false : v));

  const setHeader = (k, v) => updateSection(s.id, "header", { ...(s.header || {}), [k]: v });
  const setHeaderProp = (k, v) =>
    updateSection(s.id, "header", { ...(s.header || {}), props: { ...(s.header?.props || {}), [k]: v } });

  // ---------- Fonts: normalize to strings ----------
  const toFamily = (x) =>
    typeof x === "string" ? x.trim() : String(x?.value ?? x?.family ?? x?.name ?? x?.label ?? "").trim();
  const normalizedFonts = React.useMemo(() => {
    const arr = Array.isArray(fontOptions) ? fontOptions : [];
    const seen = new Set(); const out = [];
    for (const it of arr) { const fam = toFamily(it); if (!fam || seen.has(fam)) continue; seen.add(fam); out.push(fam); }
    return out;
  }, [fontOptions]);
  const pickFamily = (val) => (val || "").split(",")[0]?.trim() || "";
  const fontSelectProps = (key, fallback) => ({
    value: pickFamily(s[key]) || normalizedFonts[0] || fallback,
    onChange: (e) => {
      const fam = e.target.value;
      updateSection(s.id, key, `${fam}, system-ui, sans-serif`);
      loadGoogleFont?.(fam);
    },
  });

  const ensurePrices = (arr, count) => {
    const n = Math.max(2, count || 2);
    return Array.from({ length: n }, (_, i) => arr?.[i] ?? "");
  };
  const setItem = (idx, patch) =>
    updateSection(s.id, "items", (s.items || []).map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () =>
    updateSection(s.id, "items", [...(s.items || []), { id: crypto.randomUUID(), name: "Item", desc: "", allergens: "", prices: ensurePrices([], s.colCount) }]);
  const removeItem = (idx) =>
    updateSection(s.id, "items", (s.items || []).filter((_, i) => i !== idx));

  const updateHeaderTitle = (value) => {
    const hdr = s.header || {};
    const props = { ...(hdr.props || {}), text: value, label: value };
    updateSection(s.id, "header", { ...hdr, props });
  };
  const updateHeaderTitleColor = (value) => {
    const hdr = s.header || {};
    const props = { ...(hdr.props || {}), textColor: value };
    updateSection(s.id, "header", { ...hdr, props });
  };
  const onChangeColCount = (value) => {
    const n = Math.max(2, Math.min(6, Number(value || 0)));
    const current = Array.isArray(s.colLabels) ? s.colLabels : [];
    const nextLabels = Array.from({ length: n }, (_, i) => current[i] ?? `Col ${i + 1}`);
    updateSection(s.id, "colCount", n);
    updateSection(s.id, "colLabels", nextLabels);
    updateSection(s.id, "items", (s.items || []).map((it) => ({ ...it, prices: ensurePrices(it.prices, n) })));
  };

  return (
    <>
      <Section title="Frame & Size">
        <Row>
          <Label>Width</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("w")} />
          <Label className="col-span-2">Height</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("h")} />
        </Row>
        <Row>
          <Label>Corner Radius</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("radius")} />
          <Label className="col-span-2">Opacity</Label>
          <input type="number" step="0.01" min="0" max="1" className="col-span-3 border rounded px-2" {...num("alpha")} />
        </Row>
        <Row>
          <Label>Perimeter Fill</Label>
          <select className="col-span-3 border rounded px-2" {...field("bgType")}>
            <option value="solid">solid</option>
            <option value="gradient">gradient</option>
          </select>
          {s.bgType === "solid" ? (
            <>
              <Label className="col-span-2">Frame Color</Label>
              <input type="color" className="col-span-2" {...field("frameColor")} />
            </>
          ) : (
            <>
              <Label className="col-span-2">Gradient From</Label>
              <input type="color" className="col-span-2" {...field("gradFrom")} />
              <Label className="col-span-2">Gradient To</Label>
              <input type="color" className="col-span-2" {...field("gradTo")} />
            </>
          )}
        </Row>
      </Section>

      {/* Header (style/align/height) is in HeaderPanel */}
      <HeaderPanel section={s} updateSection={updateSection} />

      <Section title="Header Placement">
        <Row>
          <Label>Banner Align</Label>
          <select
            className="col-span-3 border rounded px-2"
            value={s.header?.align ?? "center"}
            onChange={(e) => setHeader("align", e.target.value)}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
          <Label className="col-span-2">Banner Offset X</Label>
          <input
            type="number"
            className="col-span-3 border rounded px-2"
            value={s.header?.offsetX ?? 0}
            onChange={(e) => setHeader("offsetX", Number(e.target.value))}
          />
        </Row>
        <Row>
          <Label>Banner Offset Y</Label>
          <input
            type="number"
            className="col-span-3 border rounded px-2"
            value={s.header?.offsetY ?? 0}
            onChange={(e) => setHeader("offsetY", Number(e.target.value))}
          />
          <Label className="col-span-2">Title Offset X</Label>
          <input
            type="number"
            className="col-span-3 border rounded px-2"
            value={s.header?.props?.titleShiftX ?? 0}
            onChange={(e) => setHeaderProp("titleShiftX", Number(e.target.value))}
          />
        </Row>
        <Row>
          <Label>Title Offset Y</Label>
          <input
            type="number"
            className="col-span-3 border rounded px-2"
            value={s.header?.props?.titleShiftY ?? 0}
            onChange={(e) => setHeaderProp("titleShiftY", Number(e.target.value))}
          />
        </Row>
      </Section>

      <Section title="Header Title & Spacing">
        <Row>
          <Label>Title</Label>
          <input
            className="col-span-7 border rounded px-2"
            value={s.header?.props?.text || s.header?.props?.label || ""}
            onChange={(e) => updateHeaderTitle(e.target.value)}
            placeholder="PIZZA"
          />
          <Label className="col-span-2">Text Color</Label>
          <input
            type="color"
            className="col-span-1"
            value={s.header?.props?.textColor || "#ffffff"}
            onChange={(e) => updateHeaderTitleColor(e.target.value)}
          />
        </Row>
        <Row>
          <Label>Title Size</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("headerTitleSize")} />
          <Label className="col-span-2">Gap below header</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("contentTopPad")} />
        </Row>
      </Section>

      <Section title="Items">
        <div className="space-y-3">
          {(s.items || []).map((it, idx) => (
            <div key={it.id} className="border rounded p-2">
              <Row>
                <Label>Name</Label>
                <input
                  className="col-span-9 border rounded px-2"
                  value={it.name || ""}
                  onChange={(e) => setItem(idx, { name: e.target.value })}
                />
              </Row>
              <Row>
                <Label>Desc</Label>
                <input
                  className="col-span-9 border rounded px-2"
                  value={it.desc || ""}
                  onChange={(e) => setItem(idx, { desc: e.target.value })}
                />
              </Row>
              <div className="grid grid-cols-12 gap-2 mt-2">
                {ensurePrices(it.prices, s.colCount).map((val, i) => (
                  <React.Fragment key={`p${idx}-${i}`}>
                    <Label className="col-span-3">{`Price ${i + 1}`}</Label>
                    <input
                      className="col-span-3 border rounded px-2"
                      value={val}
                      onChange={(e) => {
                        const prices = ensurePrices(it.prices, s.colCount);
                        prices[i] = e.target.value;
                        setItem(idx, { prices });
                      }}
                    />
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <button className="px-2 py-1 text-sm rounded border hover:bg-gray-50" onClick={() => removeItem(idx)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button className="px-3 py-1.5 rounded border hover:bg-gray-50" onClick={addItem}>
            + Add Item
          </button>
        </div>
      </Section>

      <Section title="Typography">
        <Row>
          <Label>Header Font</Label>
          <select className="col-span-9 border rounded px-2" {...fontSelectProps("headerFont", "Poppins")}>
            {normalizedFonts.map((f) => (
              <option key={f} value={f}>{f.replace(/[_-]+/g, " ")}</option>
            ))}
          </select>
        </Row>
        <Row>
          <Label>Body Font</Label>
          <select className="col-span-9 border rounded px-2" {...fontSelectProps("bodyFont", "Inter")}>
            {normalizedFonts.map((f) => (
              <option key={f} value={f}>{f.replace(/[_-]+/g, " ")}</option>
            ))}
          </select>
        </Row>
        <Row>
          <Label>Name Color</Label>
          <input type="color" className="col-span-2" {...field("nameColor")} />
          <Label className="col-span-2">Name Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("nameSize")} />
        </Row>
        <Row>
          <Label>Desc Color</Label>
          <input type="color" className="col-span-2" {...field("descColor")} />
          <Label className="col-span-2">Desc Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("descSize")} />
        </Row>
        <Row>
          <Label>Allergens Color</Label>
          <input type="color" className="col-span-2" {...field("allergenColor")} />
          <Label className="col-span-2">Allergens Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("allergenSize")} />
          <Label className="col-span-2">Allergens Raise</Label>
          <input type="number" className="col-span-1 border rounded px-2" {...num("allergenRaise")} />
        </Row>
        <Row>
          <Label>Price Font</Label>
          <select className="col-span-3 border rounded px-2" {...fontSelectProps("priceFont", "Inter")}>
            {normalizedFonts.map((f) => (
              <option key={f} value={f}>{f.replace(/[_-]+/g, " ")}</option>
            ))}
          </select>
          <Label className="col-span-2">Price Color</Label>
          <input type="color" className="col-span-2" {...field("priceColor")} />
          <Label className="col-span-2">Price Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("priceSize")} />
        </Row>
        <Row>
          <Label>Row Gap</Label>
          <input type="number" className="col-span-3 border rounded px-2" {...num("rowGap")} />
          <Label className="col-span-2">Row Divider</Label>
          <select className="col-span-3 border rounded px-2" {...bool("divider")}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </Row>
        <Row>
          <Label>Footer Font</Label>
          <select className="col-span-9 border rounded px-2" {...fontSelectProps("footerFont", "Poppins")}>
            {normalizedFonts.map((f) => (
              <option key={f} value={f}>{f.replace(/[_-]+/g, " ")}</option>
            ))}
          </select>
        </Row>
        <Row>
          <Label>Line 1</Label>
          <input className="col-span-9 border rounded px-2" {...field("footerLine1")} />
        </Row>
        <Row>
          <Label>L1 Color</Label>
          <input type="color" className="col-span-2" {...field("footerLine1Color")} />
          <Label className="col-span-2">L1 Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("footerLine1Size")} />
          <Label className="col-span-2">L1 Align</Label>
          <select className="col-span-3 border rounded px-2" {...field("footerLine1Align")}>
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </Row>
        <Row>
          <Label>Line 2</Label>
          <input className="col-span-9 border rounded px-2" {...field("footerLine2")} />
        </Row>
        <Row>
          <Label>L2 Color</Label>
          <input type="color" className="col-span-2" {...field("footerLine2Color")} />
          <Label className="col-span-2">L2 Size</Label>
          <input type="number" className="col-span-2 border rounded px-2" {...num("footerLine2Size")} />
          <Label className="col-span-2">L2 Align</Label>
          <select className="col-span-3 border rounded px-2" {...field("footerLine2Align")}>
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </Row>
      </Section>
    </>
  );
}
