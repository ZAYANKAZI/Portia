import React, { useMemo, useEffect } from "react";

function useResolvedSrc(source) {
  return useMemo(() => {
    if (!source) return "";
    if (typeof source === "string") return source;
    try { return URL.createObjectURL(source); } catch { return ""; }
  }, [source]);
}
function PreviewThumb({ source }) {
  const url = useResolvedSrc(source);
  useEffect(() => () => { if (url && typeof source !== "string") { try { URL.revokeObjectURL(url); } catch {} } }, [url, source]);
  return (
    <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden flex-shrink-0"
      style={{ backgroundImage: url ? `url(${url})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
  );
}
export default function CommonPanel({ s, updateSection }) {
  const stickers = Array.isArray(s.stickers) ? s.stickers : [];
  const setStickers = (arr) => updateSection(s.id, "stickers", arr);
  const moveSticker = (from, to) => { const arr = [...stickers]; if (to < 0 || to >= arr.length) return; const [it] = arr.splice(from, 1); arr.splice(to, 0, it); setStickers(arr); };
  const patch = (idx, patch) => setStickers(stickers.map((st, i) => (i === idx ? { ...st, ...patch } : st)));
  const addStickers = async (files) => {
    if (!files || !files.length) return;
    const arr = [...stickers];
    for (const file of files) {
      const fr = new FileReader();
      await new Promise((resolve) => { fr.onload = () => { arr.push({ id: crypto.randomUUID(), src: fr.result, w: 220, h: 160, x: 12, y: 12, rotate: 0, flipH: false, flipV: false }); resolve(); }; fr.readAsDataURL(file); });
    }
    setStickers(arr);
  };
  return (
    <details open className="mb-3 border rounded" data-panel="section-images">
      <summary className="px-3 py-2 text-sm font-semibold bg-gray-100 flex items-center justify-between">
        <span>Section Images (Top Layer)</span>
        <label className="cursor-pointer px-2 py-1 rounded bg-blue-600 text-white">
          + Add Images
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) addStickers(Array.from(e.target.files)); e.target.value = ""; }} />
        </label>
      </summary>
      <div className="p-2 space-y-2">
        {stickers.length === 0 && (<div className="text-xs text-gray-500">No images yet. Click “+ Add Images”.</div>)}
        {stickers.map((st, idx) => (
          <div key={st.id} className="border rounded p-2 space-y-1 bg-white">
            <div className="flex items-center gap-2">
              <PreviewThumb source={st.src} />
              <label className="text-xs">W</label>
              <input type="number" className="w-16 border rounded px-1 text-sm" value={Math.round(st.w || 0)} onChange={(e) => patch(idx, { w: Math.max(8, Number(e.target.value) || 0) })} />
              <label className="text-xs">H</label>
              <input type="number" className="w-16 border rounded px-1 text-sm" value={Math.round(st.h || 0)} onChange={(e) => patch(idx, { h: Math.max(8, Number(e.target.value) || 0) })} />
              <label className="text-xs">Rotate</label>
              <input type="number" className="w-16 border rounded px-1 text-sm" value={Math.round(st.rotate || 0)} onChange={(e) => patch(idx, { rotate: Number(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-3 pl-2">
              <label className="inline-flex items-center gap-1 text-xs">
                <input type="checkbox" checked={!!st.flipH} onChange={(e) => patch(idx, { flipH: !!e.target.checked })} />Flip H
              </label>
              <label className="inline-flex items-center gap-1 text-xs">
                <input type="checkbox" checked={!!st.flipV} onChange={(e) => patch(idx, { flipV: !!e.target.checked })} />Flip V
              </label>
              <div className="ml-auto flex gap-1">
                <button className="px-2 py-0.5 text-xs border rounded" disabled={idx === 0} onClick={() => moveSticker(idx, 0)}>⏮</button>
                <button className="px-2 py-0.5 text-xs border rounded" disabled={idx === 0} onClick={() => moveSticker(idx, idx - 1)}>▲</button>
                <button className="px-2 py-0.5 text-xs border rounded" disabled={idx === stickers.length - 1} onClick={() => moveSticker(idx, idx + 1)}>▼</button>
                <button className="px-2 py-0.5 text-xs border rounded" disabled={idx === stickers.length - 1} onClick={() => moveSticker(idx, stickers.length - 1)}>⏭</button>
                <button className="ml-2 px-2 py-0.5 text-xs border rounded text-red-600" onClick={() => setStickers(stickers.filter((_, i) => i !== idx))}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
