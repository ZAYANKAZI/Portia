// File: src/components/FormPanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import { TEMPLATE_REGISTRY, DEFAULT_TEMPLATE_TYPE } from "./templates/registry";
import CommonPanel from "./panels/CommonPanel";
import { useFontFamilies, ensureManifestLoaded, injectCssLink } from "/src/components/lib/fonts.ts";

// Built-ins (keep)
const GOOGLE_FONTS = [
  "Poppins","Montserrat","Inter","Roboto","Lato","Oswald","Playfair Display",
  "BernierDistressed","Alien-Encounters"
];

// Google loader (kept)
function defaultLoadGoogleFont(name) {
  if (!name) return;
  const fam = name.split(",")[0].trim();
  const id = `gf-${fam.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fam
  )}:wght@400;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

// utils
const uid = () =>
  (crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`).replace(/\./g, "");
const deepClone = (o) => JSON.parse(JSON.stringify(o));
const toFamily = (x) =>
  typeof x === "string"
    ? x.trim()
    : String(x?.value ?? x?.family ?? x?.name ?? x?.label ?? "").trim();

export default function FormPanel({
  data,
  setData,
  fontOptions: fontOptionsProp,     // may be strings or {value,label}
  loadGoogleFont: loadGoogleFontProp,
  revMap = {},
}) {
  const { screens, activeScreenId } = data || { screens: [], activeScreenId: "" };
  const active = (screens || []).find((s) => s.id === activeScreenId);

  // Load /fonts once
  useEffect(() => {
    injectCssLink("/fonts/fonts.css");  // idempotent
    ensureManifestLoaded();             // warms hook cache
  }, []);

  // Reactive user-installed families
  const userFontsRaw = useFontFamilies();
  const userFamilies = useMemo(
    () => (Array.isArray(userFontsRaw) ? userFontsRaw.map(toFamily).filter(Boolean) : []),
    [userFontsRaw]
  );

  // Merge: GOOGLE ∪ parent ∪ user
  const allFonts = useMemo(() => {
    const fromProp = (fontOptionsProp || []).map(toFamily).filter(Boolean);
    const input = [...GOOGLE_FONTS, ...fromProp, ...userFamilies];
    const seen = new Set();
    const merged = [];
    for (const f of input) {
      const fam = String(f).trim();
      if (!fam || seen.has(fam)) continue;
      seen.add(fam);
      merged.push({ value: fam, label: fam });
    }
    return merged;
  }, [fontOptionsProp, userFamilies]);

  const loadGoogleFont = loadGoogleFontProp || defaultLoadGoogleFont;

  // Per-card collapsed/expanded state (keep default: collapsed/false)
  const [cardOpenMap, setCardOpenMap] = useState({});
  useEffect(() => {
    if (!active) return;
    setCardOpenMap((m) => {
      const next = { ...m };
      for (const sec of active.sections || []) {
        if (next[sec.id] === undefined) next[sec.id] = false;
      }
      return next;
    });
  }, [active?.id, active?.sections]);

  // Screens ops
  const addScreen = () => {
    const id = uid();
    setData((prev) => ({
      ...prev,
      screens: [
        ...(prev.screens || []),
        { id, name: `Screen ${(prev.screens || []).length + 1}`, background: "", sections: [] }
      ],
      activeScreenId: id
    }));
  };
  const duplicateScreen = () => {
    if (!active) return;
    const id = uid();
    const copy = deepClone(active);
    copy.id = id;
    copy.name = `${active.name} copy`;
    setData((prev) => ({
      ...prev,
      screens: [...(prev.screens || []), copy],
      activeScreenId: id,
    }));
  };
  const removeScreen = () => {
    if ((screens || []).length <= 1) return;
    setData((prev) => {
      const next = (prev.screens || []).filter((s) => s.id !== activeScreenId);
      return { ...prev, screens: next, activeScreenId: next[0]?.id || "" };
    });
  };
  const renameScreen = (id, name) => {
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((s) => (s.id === id ? { ...s, name } : s)),
    }));
  };

  // Background helpers (keep legacy string; support new object)
  const setScreenBg = async (file) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () =>
      setData((prev) => ({
        ...prev,
        screens: (prev.screens || []).map((s) =>
          s.id === activeScreenId
            ? {
                ...s,
                background:
                  typeof s.background === "object"
                    ? { ...(s.background || {}), type: "image", image: fr.result }
                    : { type: "image", image: fr.result },
              }
            : s
        ),
      }));
    fr.readAsDataURL(file);
  };
  const clearScreenBg = () =>
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((s) =>
        s.id === activeScreenId ? { ...s, background: "" } : s
      ),
    }));

  // Cards ops
  const addCard = (type = DEFAULT_TEMPLATE_TYPE) => {
    const tpl = TEMPLATE_REGISTRY[type];
    const base = tpl?.defaults?.() || { type };
    const newId = uid();
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((s) =>
        s.id === activeScreenId
          ? { ...s, sections: [...(s.sections || []), { ...base, id: newId }] }
          : s
      ),
    }));
    setCardOpenMap((m) => ({ ...m, [newId]: false }));
  };
  const removeCard = (id) => {
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((s) =>
        s.id !== activeScreenId
          ? s
          : { ...s, sections: (s.sections || []).filter((sec) => sec.id !== id) }
      ),
    }));
    setCardOpenMap((m) => {
      const n = { ...m };
      delete n[id];
      return n;
    });
  };
  const duplicateCard = (id) => {
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((s) => {
        if (s.id !== activeScreenId) return s;
        const src = (s.sections || []).find((sec) => sec.id === id);
        if (!src) return s;
        const copy = deepClone(src);
        copy.id = uid();
        copy.x = (copy.x || 0) + 24;
        copy.y = (copy.y || 0) + 24;
        copy.stickers = Array.isArray(copy.stickers)
          ? copy.stickers.map((st) => ({ ...st, id: uid() }))
          : [];
        return { ...s, sections: [...(s.sections || []), copy] };
      }),
    }));
  };

  // Section updater
  const updateSection = (id, key, value) => {
    setData((prev) => ({
      ...prev,
      screens: (prev.screens || []).map((sc) =>
        sc.id !== activeScreenId
          ? sc
          : {
              ...sc,
              sections: (sc.sections || []).map((sec) =>
                sec.id === id
                  ? key === "header" && typeof value === "object"
                    ? { ...sec, header: { ...(sec.header || {}), ...value } }
                    : { ...sec, [key]: value }
                  : sec
              ),
            }
      ),
    }));
  };

  if (!active) return null;

  return (
    <div className="space-y-6">
      {/* screens bar */}
      <div className="ui-panel flex flex-wrap items-center gap-2">
        {(screens || []).map((sc) => (
          <button
            key={sc.id}
            onClick={() => setData((prev) => ({ ...prev, activeScreenId: sc.id }))}
            className={`px-3 py-1 rounded ${
              sc.id === activeScreenId ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {sc.name}
          </button>
        ))}
        <button onClick={addScreen} className="px-2 py-1 bg-green-600 text-white rounded">
          + Screen
        </button>
        <button onClick={duplicateScreen} className="px-2 py-1 bg-amber-500 text-white rounded">
          Duplicate
        </button>
        <button onClick={removeScreen} className="px-2 py-1 bg-red-600 text-white rounded">
          Remove
        </button>
        <input
          type="text"
          className="ml-2 border rounded px-2"
          value={active.name}
          onChange={(e) => renameScreen(active.id, e.target.value)}
        />
      </div>

      {/* === Background (Image | One | Two | Custom ≤4) === */}
      <div className="ui-panel space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm w-32">Background Type</label>
          <select
            className="input"
            value={
              active.background?.type ||
              (active.background ? (typeof active.background === "string" ? "image" : "one") : "one")
            }
            onChange={(e) => {
              const type = e.target.value;
              setData((prev) => ({
                ...prev,
                screens: (prev.screens || []).map((s) =>
                  s.id === activeScreenId
                    ? {
                        ...s,
                        background:
                          type === "image"
                            ? (typeof active.background === "string"
                                ? { type: "image", image: active.background }
                                : { type: "image", image: "" })
                            : type === "one"
                            ? { type: "one", colors: [active.background?.colors?.[0] || "#ffffff"] }
                            : type === "two"
                            ? {
                                type: "two",
                                colors: [
                                  active.background?.colors?.[0] || "#ffffff",
                                  active.background?.colors?.[1] || "#000000",
                                ],
                                direction: active.background?.direction || "to right",
                                ratio: active.background?.ratio ?? 50,
                              }
                            : {
                                type: "custom",
                                colors: active.background?.colors?.length
                                  ? active.background.colors.slice(0, 4)
                                  : ["#ffffff", "#000000"],
                                direction: active.background?.direction || "to right",
                              },
                      }
                    : s
                ),
              }));
            }}
          >
            <option value="image">Image</option>
            <option value="one">One Color</option>
            <option value="two">Two Colors</option>
            <option value="custom">Custom (≤4)</option>
          </select>
        </div>

        {/* Image picker */}
        {active.background?.type === "image" && (
          <div className="ui-panel file-row !mb-0">
            <label className="text-sm">Background:</label>
            <div className="file-wrap">
              <input type="file" accept="image/*" onChange={(e) => setScreenBg(e.target.files?.[0])} />
            </div>
            {active.background?.image && (
              <button className="clear-btn px-2 py-1 text-xs border rounded" onClick={clearScreenBg}>
                Clear
              </button>
            )}
          </div>
        )}

        {/* One / Two / Custom colors */}
        {["one", "two", "custom"].includes(active.background?.type || "") && (
          <div className="space-y-2">
            {Array.from({
              length:
                active.background?.type === "one"
                  ? 1
                  : active.background?.type === "two"
                  ? 2
                  : Math.min(4, Math.max(2, (active.background?.colors || []).length || 2)),
            }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <label className="text-sm w-32">Color {i + 1}</label>
                <input
                  type="color"
                  value={active.background?.colors?.[i] || "#ffffff"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setData((prev) => ({
                      ...prev,
                      screens: (prev.screens || []).map((s) => {
                        if (s.id !== activeScreenId) return s;
                        const bg =
                          s.background && typeof s.background === "object"
                            ? { ...s.background }
                            : { type: "one", colors: ["#ffffff"] };
                        const arr = Array.isArray(bg.colors) ? [...bg.colors] : [];
                        arr[i] = val;
                        bg.colors = arr.slice(0, bg.type === "one" ? 1 : bg.type === "two" ? 2 : 4);
                        return { ...s, background: bg };
                      }),
                    }));
                  }}
                  className="w-16 h-8 border rounded"
                />
              </div>
            ))}

            {active.background?.type === "custom" && (
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      screens: (prev.screens || []).map((s) => {
                        if (s.id !== activeScreenId) return s;
                        const bg =
                          s.background && typeof s.background === "object"
                            ? { ...s.background }
                            : { type: "custom", colors: ["#ffffff", "#000000"] };
                        const arr = Array.isArray(bg.colors) ? [...bg.colors] : [];
                        if (arr.length < 4) arr.push("#cccccc");
                        bg.colors = arr.slice(0, 4);
                        return { ...s, background: bg };
                      }),
                    }))
                  }
                >
                  + Add color
                </button>
                <button
                  className="px-2 py-1 text-xs border rounded"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      screens: (prev.screens || []).map((s) => {
                        if (s.id !== activeScreenId) return s;
                        const bg =
                          s.background && typeof s.background === "object"
                            ? { ...s.background }
                            : { type: "custom", colors: ["#ffffff", "#000000"] };
                        const arr = Array.isArray(bg.colors) ? [...bg.colors] : [];
                        if (arr.length > 2) arr.pop();
                        bg.colors = arr.slice(0, 4);
                        return { ...s, background: bg };
                      }),
                    }))
                  }
                >
                  − Remove color
                </button>
              </div>
            )}
          </div>
        )}

        {/* Direction & Ratio */}
        {["two", "custom"].includes(active.background?.type || "") && (
          <div className="flex items-center gap-2">
            <label className="text-sm w-32">Direction</label>
            <select
              className="input"
              value={active.background?.direction || "to right"}
              onChange={(e) => {
                const dir = e.target.value;
                setData((prev) => ({
                  ...prev,
                  screens: (prev.screens || []).map((s) =>
                    s.id === activeScreenId
                      ? {
                          ...s,
                          background: {
                            ...(s.background && typeof s.background === "object"
                              ? s.background
                              : { type: "two", colors: ["#ffffff", "#000000"] }),
                            direction: dir,
                          },
                        }
                      : s
                  ),
                }));
              }}
            >
              <option value="to right">Left → Right</option>
              <option value="to left">Right → Left</option>
              <option value="to bottom">Top → Bottom</option>
              <option value="to top">Bottom → Top</option>
              <option value="45deg">Diagonal ↘︎</option>
              <option value="135deg">Diagonal ↗︎</option>
            </select>

            {active.background?.type === "two" && (
              <>
                <label className="text-sm">Ratio</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={active.background?.ratio ?? 50}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setData((prev) => ({
                      ...prev,
                      screens: (prev.screens || []).map((s) =>
                        s.id === activeScreenId
                          ? {
                              ...s,
                              background: {
                                ...(s.background && typeof s.background === "object"
                                  ? s.background
                                  : { type: "two", colors: ["#ffffff", "#000000"] }),
                                ratio: val,
                              },
                            }
                          : s
                      ),
                    }));
                  }}
                />
                <span className="text-xs w-10 text-right">{active.background?.ratio ?? 50}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* cards (collapsed by default; unchanged) */}
      {(active.sections || []).map((s) => {
        const tpl = TEMPLATE_REGISTRY[s.type] || TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_TYPE];
        const Panel = tpl.Panel;
        const open = cardOpenMap[s.id] ?? false;
        const revKey = `${s.id}-${revMap[s.id] || 0}-${s.items?.length || 0}-${s.products?.length || 0}`;
        const stop = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn?.(e); };

        return (
          <details
            key={revKey}
            open={open}
            onToggle={(e) => {
              const isOpen = e.currentTarget ? e.currentTarget.open : false;
              setCardOpenMap((m) => ({ ...m, [s.id]: isOpen }));
            }}
            className="mb-3 ui-panel"
          >
            <summary className="panel-summary">
              <span className="text-gray-400 mr-1">{open ? "▾" : "▸"}</span>
              <span className="font-semibold flex-1">{s.title || tpl.label || s.type}</span>
              <button onClick={stop(() => duplicateCard(s.id))} className="px-2 py-1 bg-amber-500 text-white rounded text-xs">Duplicate</button>
              <button onClick={stop(() => removeCard(s.id))} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Remove</button>
            </summary>

            <div className="panel-body border-t">
              <Panel
                s={s}
                updateSection={updateSection}
                fontOptions={allFonts}
                loadGoogleFont={loadGoogleFont}
              />
              <CommonPanel s={s} updateSection={updateSection} />
            </div>
          </details>
        );
      })}

      {/* add card */}
      <div className="ui-panel flex items-center gap-2">
        <select id="cardType" className="border rounded px-2">
          {Object.entries(TEMPLATE_REGISTRY).map(([key, t]) => (
            <option key={key} value={key}>
              {t.label || key}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const sel = document.getElementById("cardType");
            const val = sel?.value || DEFAULT_TEMPLATE_TYPE;
            addCard(val);
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          + Add Card
        </button>
      </div>
    </div>
  );
}
