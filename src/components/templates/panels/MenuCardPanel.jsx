// File: src/components/templates/panels/MenuCardPanel.jsx
import React from "react";
import HeaderPanel from "../../headers/panels/HeaderPanel";

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 font-semibold text-gray-800"
      >
        <span>{title}</span>
        <span className="text-gray-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

const isFreeHeader = (t) =>
  ["double-flag", "flag-tip", "image-brush"].includes((t || "").toLowerCase());

async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function MenuCardPanel({
  s,
  updateSection,
  fontOptions = [], // strings or {value,label}
}) {
  const set = (key, value) => updateSection(s.id, key, value);
  const setNum = (key, raw, lo = -Infinity, hi = Infinity) => {
    const n = Number(raw);
    const v = Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : 0;
    updateSection(s.id, key, v);
  };
  const setHeader = (key, value) =>
    updateSection(s.id, "header", { ...(s.header || {}), [key]: value });

  const free = isFreeHeader(s.header?.type);

  const rows =
    (Array.isArray(s.products) && s.products.length ? s.products : s.items) || [];

  const syncRows = (next) => {
    updateSection(s.id, "products", next);
    updateSection(s.id, "items", next);
  };

  const addProduct = () => {
    const row = {
      id: crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`,
      name: "Item",
      description: "",
      allergens: "",
      price: "€0.00",
    };
    syncRows([...(rows || []), row]);
  };
  const updateProduct = (idx, patch) =>
    syncRows((rows || []).map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeProduct = (idx) =>
    syncRows((rows || []).filter((_, i) => i !== idx));
  const moveProduct = (from, to) => {
    const arr = [...(rows || [])];
    if (to < 0 || to >= arr.length || from === to) return;
    const [row] = arr.splice(from, 1);
    arr.splice(to, 0, row);
    syncRows(arr);
  };

  // ---------- Fonts: normalize to strings ----------
  const toFamily = (x) =>
    typeof x === "string"
      ? x.trim()
      : String(x?.value ?? x?.family ?? x?.name ?? x?.label ?? "").trim();

  const normalizedFonts = React.useMemo(() => {
    const list = Array.isArray(fontOptions) ? fontOptions : [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const fam = toFamily(list[i]);
      if (!fam || seen.has(fam)) continue;
      seen.add(fam);
      out.push({ key: `f:${i}:${fam}`, value: fam, label: fam });
    }
    return out;
  }, [fontOptions]);

  const pickFamily = (cssStack) => (cssStack || "").split(",")[0].trim();
  const onFontChange = (key) => (e) =>
    set(key, `${e.target.value}, system-ui, sans-serif`);

  const titleValue = pickFamily(s.titleFont) || normalizedFonts[0]?.value || "";
  const bodyValue =
    pickFamily(s.bodyFont) || normalizedFonts[1]?.value || normalizedFonts[0]?.value || "";

  return (
    <div className="space-y-4">
      {/* 1) Header */}
      <Section title="Header" defaultOpen>
        <HeaderPanel section={s} updateSection={updateSection} />
        {free && (
          <div className="mt-3 grid grid-cols-2 gap-2 items-center">
            <label className="text-sm text-gray-600">Width %</label>
            <input
              type="number"
              className="border rounded px-2"
              min={10}
              max={120}
              value={s.header?.widthPct ?? 90}
              onChange={(e) => setHeader("widthPct", Number(e.target.value))}
            />
          </div>
        )}
      </Section>

      {/* 2) Title Text */}
      <Section title="Title Text" defaultOpen>
        <div className="grid grid-cols-2 gap-2 items-center">
          <label className="text-sm text-gray-600">Title</label>
          <input
            className="border rounded px-2"
            placeholder="CARD TITLE"
            value={s.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
          />

          <label className="text-sm text-gray-600">Subtitle (optional)</label>
          <input
            className="border rounded px-2"
            placeholder="Subtitle"
            value={s.titleDesc ?? ""}
            onChange={(e) => set("titleDesc", e.target.value)}
          />

          <label className="text-sm text-gray-600">Title Size</label>
          <input
            type="number"
            className="border rounded px-2"
            value={s.titleSize ?? 64}
            onChange={(e) => setNum("titleSize", e.target.value, 8, 200)}
          />

          <label className="text-sm text-gray-600">Subtitle Size</label>
          <input
            type="number"
            className="border rounded px-2"
            value={s.titleDescSize ?? 22}
            onChange={(e) => setNum("titleDescSize", e.target.value, 6, 120)}
          />

          <label className="text-sm text-gray-600">Title Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.titleColor ?? "#ffffff"}
            onChange={(e) => set("titleColor", e.target.value)}
          />

          <label className="text-sm text-gray-600">Subtitle Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.titleDescColor ?? "#ffffff"}
            onChange={(e) => set("titleDescColor", e.target.value)}
          />
        </div>
      </Section>

      {/* 3) Fonts */}
      <Section title="Fonts" defaultOpen>
        <div className="grid grid-cols-2 gap-2 items-center">
          <label className="text-sm text-gray-600">Title Font</label>
          <select
            className="border rounded px-2"
            value={titleValue}
            onChange={onFontChange("titleFont")}
          >
            {normalizedFonts.map((f) => (
              <option key={f.key} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <label className="text-sm text-gray-600">Body Font</label>
          <select
            className="border rounded px-2"
            value={bodyValue}
            onChange={onFontChange("bodyFont")}
          >
            {normalizedFonts.map((f) => (
              <option key={f.key} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* 4) Body Typography */}
      <Section title="Body Typography" defaultOpen>
        <div className="grid grid-cols-2 gap-2 items-center">
          <label className="text-sm text-gray-600">Name Size</label>
          <input
            type="number"
            className="border rounded px-2"
            value={s.nameSize ?? 32}
            onChange={(e) => setNum("nameSize", e.target.value, 8, 200)}
          />
          <label className="text-sm text-gray-600">Name Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.nameColor ?? "#222222"}
            onChange={(e) => set("nameColor", e.target.value)}
          />

          <label className="text-sm text-gray-600">Desc Size</label>
          <input
            type="number"
            className="border rounded px-2"
            value={s.descSize ?? 20}
            onChange={(e) => setNum("descSize", e.target.value, 6, 120)}
          />
          <label className="text-sm text-gray-600">Desc Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.descColor ?? "#333333"}
            onChange={(e) => set("descColor", e.target.value)}
          />

          <label className="text-sm text-gray-600">Allergens Size</label>
          <input
            type="number"
            className="border rounded px-2"
            value={s.allergensSize ?? 16}
            onChange={(e) => setNum("allergensSize", e.target.value, 6, 80)}
          />
          <label className="text-sm text-gray-600">Allergens Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.allergensColor ?? "#d32f2f"}
            onChange={(e) => set("allergensColor", e.target.value)}
          />
        </div>
      </Section>

      {/* 5) Products */}
      <Section title="Products" defaultOpen>
        <div className="space-y-2">
          {(rows || []).map((r, i) => (
            <div key={r.id} className="grid grid-cols-6 gap-2 items-center">
              <input
                className="col-span-2 border rounded px-2"
                placeholder="Name"
                value={r.name || ""}
                onChange={(e) => updateProduct(i, { name: e.target.value })}
              />
              <input
                className="col-span-2 border rounded px-2"
                placeholder="Desc"
                value={r.description || ""}
                onChange={(e) => updateProduct(i, { description: e.target.value })}
              />
              <input
                className="col-span-1 border rounded px-2"
                placeholder="Allergens"
                value={r.allergens || ""}
                onChange={(e) => updateProduct(i, { allergens: e.target.value })}
              />
              <input
                className="col-span-1 border rounded px-2"
                placeholder="€0.00"
                value={r.price || ""}
                onChange={(e) => updateProduct(i, { price: e.target.value })}
              />
              <div className="col-span-6 flex gap-2 justify-end">
                <button className="px-2 py-1 text-xs border rounded" onClick={() => moveProduct(i, i - 1)}>↑</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => moveProduct(i, i + 1)}>↓</button>
                <button className="px-2 py-1 text-xs border rounded" onClick={() => removeProduct(i)}>Remove</button>
              </div>
            </div>
          ))}
          <button className="px-3 py-1.5 border rounded" onClick={addProduct}>+ Add Product</button>
        </div>
      </Section>

      {/* 6) Card Background */}
      <Section title="Card Background">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-gray-600">Color</label>
          <input
            type="color"
            className="h-8 w-16 p-0 border rounded"
            value={s.cardBg ?? "#ffffff"}
            onChange={(e) => set("cardBg", e.target.value)}
          />

          <label className="text-sm text-gray-600">Opacity</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="border rounded px-2"
            value={s.cardAlpha ?? 0.95}
            onChange={(e) => setNum("cardAlpha", e.target.value, 0, 1)}
          />

          <label className="text-sm text-gray-600">Background Image</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await fileToDataURL(f);
                  set("cardBgImage", url);
                }
                e.target.value = "";
              }}
            />
            {s.cardBgImage ? (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded border"
                onClick={() => set("cardBgImage", "")}
              >
                Clear
              </button>
            ) : null}
          </div>

          <label className="text-sm text-gray-600">Image Fit</label>
          <select
            className="border rounded px-2"
            value={s.cardBgFit ?? "cover"}
            onChange={(e) => set("cardBgFit", e.target.value)}
          >
            <option value="cover">cover</option>
            <option value="contain">contain</option>
          </select>
        </div>
      </Section>
    </div>
  );
}
