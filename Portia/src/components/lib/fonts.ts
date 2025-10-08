// ============================================================================
// src/components/lib/fonts.ts  (ESM, 2-step flow, live families)
// ============================================================================
export type FontManifest = {
  families: Array<{
    family: string;
    variants: Array<{ style: string; weight: number; sources: string[] }>;
  }>;
};
type DirHandle = any; type FileHandle = any;
import { useEffect, useState } from "react";

const state = {
  rootDir: null as DirHandle | null,
  families: [] as string[],
  listeners: new Set<(families: string[]) => void>(),
  cssLinked: false,
  manifestLoaded: false,
};

function notify() { const list = [...state.families]; state.listeners.forEach(fn => fn(list)); }
export function onChange(cb: (families: string[]) => void) { state.listeners.add(cb); return () => state.listeners.delete(cb); }
export function listFamilies() { return [...state.families]; }
export function hasProjectRoot() { return !!state.rootDir; }

export async function connectProjectFolder() {
  if (!("showDirectoryPicker" in window)) throw new Error("Use Chrome/Edge.");
  const root: DirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
  const perm = await root.requestPermission?.({ mode: "readwrite" });
  if (perm && perm !== "granted") throw new Error("Permission denied.");
  // Normalize: allow selecting project root, /public, or /public/fonts
  let base: DirHandle = root;
  try {
    const p = await root.getDirectoryHandle("public", { create: false });
    await p.getDirectoryHandle("fonts", { create: true });
    base = root;
  } catch {
    try {
      const f = await root.getDirectoryHandle("fonts", { create: true });
      base = { getDirectoryHandle: async (n: string, o: any) => (n === "public" ? root : f) } as any;
    } catch {/* will create below */}
  }
  const publicDir = await base.getDirectoryHandle("public", { create: true });
  await publicDir.getDirectoryHandle("fonts", { create: true });
  state.rootDir = root;
  return { name: root.name };
}

export function injectCssLink() {
  if (state.cssLinked) return;
  if (!document.querySelector('link[data-portia-fonts="1"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/fonts/fonts.css";
    link.setAttribute("data-portia-fonts", "1");
    document.head.appendChild(link);
  }
  state.cssLinked = true;
}

export async function ensureManifestLoaded() {
  if (state.manifestLoaded) return;
  try {
    const res = await fetch("/fonts/manifest.json", { cache: "no-cache" });
    if (res.ok) {
      const json: FontManifest = await res.json();
      state.families = Array.from(new Set((json?.families || []).map(f => f.family).filter(Boolean)));
      state.manifestLoaded = true; notify();
    }
  } catch { /* no manifest yet */ }
}

export async function ready() {
  injectCssLink();
  if ((document as any)?.fonts?.ready) await (document as any).fonts.ready;
}

export function useFontFamilies(): string[] {
  const [families, setFamilies] = useState<string[]>(listFamilies());
  useEffect(() => {
    injectCssLink();
    ensureManifestLoaded().then(() => setFamilies(listFamilies()));
    const off = onChange(setFamilies);
    return () => off && off();
  }, []);
  return families;
}

export async function addFonts(filesLike: FileList | File[] | null | undefined) {
  if (!state.rootDir) throw new Error('Connect Project Folder first.');
  const files = Array.from(filesLike || []).filter((f: File) => /\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/.test(f.name));
  if (files.length === 0) return;

  const publicDir: DirHandle = await state.rootDir.getDirectoryHandle("public", { create: true });
  const fontsDir: DirHandle = await publicDir.getDirectoryHandle("fonts", { create: true });

  const groups = groupByFamily(files);
  const manifest = await readManifest(fontsDir);

  for (const [family, items] of groups) {
    const familyDir: DirHandle = await fontsDir.getDirectoryHandle(family, { create: true });
    const relPaths: string[] = [];
    for (const f of items) {
      const safe = safeName(f.name);
      const fh: FileHandle = await familyDir.getFileHandle(safe, { create: true });
      const ws = await fh.createWritable(); await ws.write(f); await ws.close();
      relPaths.push(`/fonts/${family}/${safe}`);
      try { const buf = await f.arrayBuffer(); const face = new FontFace(family, buf); await face.load(); (document as any).fonts.add(face); } catch {}
    }
    upsertManifest(manifest, family, relPaths);
  }

  await writeJson(fontsDir, "manifest.json", manifest);
  await writeText(fontsDir, "fonts.css", buildFontsCss(manifest));

  state.families = Array.from(new Set([...(state.families || []), ...manifest.families.map(f => f.family)]));
  notify(); injectCssLink(); await ready();
}

// helpers
function groupByFamily(files: File[]) {
  const map = new Map<string, File[]>();
  for (const f of files) {
    const base = f.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, "");
    const fam = base.replace(/[-_]*Regular$/i, "").replace(/[-_]*Normal$/i, "") || base;
    const key = fam.trim().slice(0, 80);
    if (!map.has(key)) map.set(key, []); map.get(key)!.push(f);
  } return map;
}
function safeName(n: string) { return n.replace(/[^a-zA-Z0-9._-]/g, "_"); }
async function writeText(dir: DirHandle, name: string, text: string) { const fh: FileHandle = await dir.getFileHandle(name, { create: true }); const ws = await fh.createWritable(); await ws.write(new Blob([text], { type: "text/plain" })); await ws.close(); }
async function writeJson(dir: DirHandle, name: string, obj: unknown) { await writeText(dir, name, JSON.stringify(obj, null, 2)); }
async function readManifest(fontsDir: DirHandle): Promise<FontManifest> {
  try { const fh: FileHandle = await fontsDir.getFileHandle("manifest.json"); const file: File = await fh.getFile(); return normalizeManifest(JSON.parse(await file.text())); }
  catch { return { families: [] }; }
}
function normalizeManifest(m: any): FontManifest {
  if (!m || !Array.isArray(m.families)) return { families: [] };
  return { families: m.families.map((x: any) => ({
    family: String(x.family),
    variants: (x.variants && x.variants.length) ? x.variants.map((v: any) => ({
      style: v?.style || "normal", weight: Number(v?.weight || 400), sources: Array.isArray(v?.sources) ? v.sources : [],
    })) : [{ style: "normal", weight: 400, sources: Array.isArray(x?.sources) ? x.sources : [] }],
  }))};
}
function upsertManifest(m: FontManifest, family: string, paths: string[]) {
  let entry = m.families.find(f => f.family === family);
  if (!entry) { entry = { family, variants: [{ style: "normal", weight: 400, sources: [] }] }; m.families.push(entry); }
  const v = entry.variants[0]; const set = new Set(v.sources); for (const p of paths) set.add(p);
  v.sources = [...set].sort((a,b)=> rank(a)-rank(b));
}
function rank(p: string){ return /\.woff2$/i.test(p)?0:/\.woff$/i.test(p)?1:/\.ttf$/i.test(p)?2:/\.otf$/i.test(p)?3:9; }
function buildFontsCss(manifest: FontManifest) {
  const parts = ['/* Generated by Add Font */'];
  for (const fam of manifest.families) for (const v of fam.variants) {
    const src = (v.sources||[]).map(p=>{
      const fmt=/\.woff2$/i.test(p)?"woff2":/\.woff$/i.test(p)?"woff":/\.ttf$/i.test(p)?"truetype":"opentype";
      return `url("${p}") format("${fmt}")`;
    }).join(", ");
    parts.push(`@font-face{font-family:"${fam.family}";font-style:${v.style};font-weight:${v.weight};font-display:swap;src:${src};}`);
  }
  return parts.join("\n");
}

