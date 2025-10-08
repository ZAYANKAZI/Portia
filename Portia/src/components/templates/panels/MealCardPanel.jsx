// ============================================================================
// File: src/components/templates/panels/MealCardPanel.jsx
// Desc: Stable Meal panel + dynamic fonts via prop (normalized)
// ============================================================================
import React from "react";

function Section({ title, children, open = true }) {
  return (
    <details open={open} className="mb-3 border border-gray-700 rounded bg-gray-900/40">
      <summary className="px-3 py-2 text-sm font-semibold text-gray-100 cursor-pointer select-none">
        {title}
      </summary>
      <div className="p-3 space-y-3">{children}</div>
    </details>
  );
}

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function MealCardPanel({
  s,
  updateSection,
  fontOptions = [], // strings or {value,label}
  loadGoogleFont,
}) {
  // ---------- Fonts: normalize to strings (no manifest reads here) ----------
  const toFamily = (x) =>
    typeof x === "string"
      ? x.trim()
      : String(x?.value ?? x?.family ?? x?.name ?? x?.label ?? "").trim();

  const fonts = React.useMemo(() => {
    const list = Array.isArray(fontOptions) ? fontOptions : [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const f = toFamily(list[i]);
      if (!f || seen.has(f)) continue;
      seen.add(f);
      out.push(f);
    }
    return out;
  }, [fontOptions]);

  const pickFamily = (cssStack) => (cssStack || "").split(",")[0].trim();
  const setFont = (key, fallback = "Poppins") => ({
    value: pickFamily(s[key]) || fonts[0] || fallback,
    onChange: (e) => {
      const fam = e.target.value;
      updateSection(s.id, key, `${fam}, system-ui, sans-serif`);
      loadGoogleFont?.(fam);
    },
  });

  const field = (key, cast = (v) => v) => ({
    value: s[key] ?? "",
    onChange: (e) => updateSection(s.id, key, cast(e.target.value)),
  });
  const num = (key) => field(key, (v) => Number(v || 0));

  return (
    <div className="space-y-4 text-gray-230">
      {/* Card Size */}
      <Section title="Card Size" open>
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-3 text-sm">Width</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("w")} />
          <label className="col-span-3 text-sm">Height</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("h")} />
        </div>
      </Section>

      {/* Header (3 lines) */}
      <Section title="Header" open>
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-3 text-sm">Align</label>
          <select className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" {...field("titleAlign")}>
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>

          <label className="col-span-3 text-sm">Spacing</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("titleSpacing")} />

          <label className="col-span-3 text-sm">Font</label>
          <select className="col-span-9 border border-gray-700 rounded px-2 bg-gray-900" {...setFont("titleFont")}>
            {fonts.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* Line 1 */}
          <label className="col-span-3 text-sm">Title 1</label>
          <input className="col-span-6 border border-gray-700 rounded px-2 bg-gray-900" {...field("title1")} />
          <input className="col-span-1 border border-gray-700 rounded px-1 bg-gray-900" type="number" {...num("title1Size")} />
          <input className="col-span-2 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("title1Color")} />

          {/* Line 2 */}
          <label className="col-span-3 text-sm">Title 2</label>
          <input className="col-span-6 border border-gray-700 rounded px-2 bg-gray-900" {...field("title2")} />
          <input className="col-span-1 border border-gray-700 rounded px-1 bg-gray-900" type="number" {...num("title2Size")} />
          <input className="col-span-2 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("title2Color")} />

          {/* Line 3 */}
          <label className="col-span-3 text-sm">Title 3</label>
          <input className="col-span-6 border border-gray-700 rounded px-2 bg-gray-900" {...field("title3")} />
          <input className="col-span-1 border border-gray-700 rounded px-1 bg-gray-900" type="number" {...num("title3Size")} />
          <input className="col-span-2 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("title3Color")} />
        </div>
      </Section>

      {/* Body */}
      <Section title="Body" open>
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-3 text-sm">Font</label>
          <select className="col-span-9 border border-gray-700 rounded px-2 bg-gray-900" {...setFont("bodyFont", "Inter")}>
            {fonts.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          <label className="col-span-3 text-sm">Lines (comma sep.)</label>
          <input
            className="col-span-9 border border-gray-700 rounded px-2 bg-gray-900"
            value={(s.bodyLines || []).join(", ")}
            onChange={(e) =>
              updateSection(s.id, "bodyLines", e.target.value.split(",").map((t) => t.trim()))
            }
          />

          <label className="col-span-3 text-sm">Size</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("bodySize")} />
          <label className="col-span-3 text-sm">Color</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("bodyColor")} />

          <label className="col-span-3 text-sm">Content Top Pad</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("contentTopPad")} />
        </div>
      </Section>

      {/* Card Background */}
      <Section title="Card Background">
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-3 text-sm">Type</label>
          <select className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" {...field("cardBgType")}>
            <option value="solid">solid</option>
            <option value="image">image</option>
          </select>

          <label className="col-span-3 text-sm">Color</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("cardBg")} />

          <label className="col-span-3 text-sm">Opacity</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" step="0.01" min="0" max="1" {...field("cardAlpha", Number)} />

          <label className="col-span-3 text-sm">Image</label>
          <div className="col-span-9 flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await fileToDataURL(f);
                  updateSection(s.id, "cardBgImage", url);
                }
                e.target.value = "";
              }}
            />
            {s.cardBgImage ? (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border border-gray-700"
                onClick={() => updateSection(s.id, "cardBgImage", "")}
              >
                Clear
              </button>
            ) : null}
          </div>

          <label className="col-span-3 text-sm">Image Fit</label>
          <select className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" {...field("cardBgFit")}>
            <option value="cover">cover</option>
            <option value="contain">contain</option>
          </select>
        </div>
      </Section>

      {/* Price Flag */}
      <Section title="Price Flag">
        <div className="grid grid-cols-12 gap-2">
          <label className="col-span-3 text-sm">Direction</label>
          <select className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" {...field("priceFlagDirection")}>
            <option value="right">Right notch</option>
            <option value="left">Left notch</option>
          </select>

          <label className="col-span-3 text-sm">Color</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("priceFlagColor")} />

          <label className="col-span-3 text-sm">Text Color</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="color" {...field("priceTextColor")} />

          <label className="col-span-3 text-sm">W</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagW")} />
          <label className="col-span-3 text-sm">H</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagH")} />

          <label className="col-span-3 text-sm">Notch</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagNotch")} />
          <label className="col-span-3 text-sm">Radius</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagRadius")} />

          <label className="col-span-3 text-sm">Offset X</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagOffsetX")} />
          <label className="col-span-3 text-sm">Offset Y</label>
          <input className="col-span-3 border border-gray-700 rounded px-2 bg-gray-900" type="number" {...num("priceFlagOffsetY")} />

          <label className="col-span-3 text-sm">€ / Int / Dec</label>
          <div className="col-span-9 grid grid-cols-3 gap-2">
            <input className="border border-gray-700 rounded px-2 bg-gray-900" {...field("currency")} />
            <input className="border border-gray-700 rounded px-2 bg-gray-900" {...field("priceInt")} />
            <input className="border border-gray-700 rounded px-2 bg-gray-900" {...field("priceDec")} />
          </div>
        </div>
      </Section>
    </div>
  );
}
