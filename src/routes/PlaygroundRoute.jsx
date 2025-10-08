// File: src/routes/PlaygroundRoute.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Home from "../pages/Home.jsx";
import * as projectStore from "../utils/projectStore.js";
import DebugHUD from "../playground/DebugHUD.jsx";
import { createLogger } from "../playground/logger.js";
import { EVENT } from "../playground/types.js";
import { makeSessionId } from "../playground/useSessionId.js";
import { captureScreenshot, downloadDataUrl } from "../playground/snapshots.js";
import * as RegistryModule from "../components/templates/registry.js";

// Robust registry (default/named/aliases)
const REGISTRY =
  RegistryModule.registry ||
  RegistryModule.default ||
  RegistryModule.templates ||
  RegistryModule.cards ||
  RegistryModule;

export default function PlaygroundRoute() {
  // Block persistence (no writes) only while on playground
  useEffect(() => {
    const ls = window.localStorage;
    const orig = {
      setItem: ls.setItem.bind(ls),
      removeItem: ls.removeItem.bind(ls),
      clear: ls.clear.bind(ls),
    };
    ls.setItem = () => {};
    ls.removeItem = () => {};
    ls.clear = () => {};
    return () => {
      ls.setItem = orig.setItem;
      ls.removeItem = orig.removeItem;
      ls.clear = orig.clear;
    };
  }, []);

  // Ensure visible blank project if nothing loaded
  useEffect(() => {
    const s = getStateSafe();
    if (!s || !s.background || !Array.isArray(s.cards)) {
      const blank = {
        schemaVersion: 2,
        background: { type: "one", colors: ["#111111"], direction: "to right", ratio: 50 },
        cards: [],
      };
      projectStore.hydrate?.(blank) ?? projectStore.load?.(blank);
    }
  }, []);

  // HUD
  const sessionId = useMemo(() => makeSessionId(), []);
  const logger = useMemo(() => createLogger({ sessionId }), [sessionId]);
  const [hudOpen, setHudOpen] = useState(true);

  const onScreenshot = async () => {
    const node = document.querySelector("#root") || document.body;
    const dataUrl = await captureScreenshot(node, 2);
    downloadDataUrl(dataUrl, `${sessionId}-playground-2x.png`);
    logger.push("artifact.screenshot", { scale: 2, bytes: dataUrl.length });
  };

  const onExport = async () => {
    try {
      logger.push(EVENT.EXPORT_START, {});
      await onScreenshot();
      logger.push(EVENT.EXPORT_SUCCESS, {});
    } catch (e) {
      logger.push(EVENT.EXPORT_FAIL, { message: String(e) });
      alert("Export failed. See logs.");
    }
  };

  // Import
  const fileRef = useRef(null);
  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const migrated = projectStore.migrate ? projectStore.migrate(json) : json;
      const normalized = normalizeProject(migrated, REGISTRY);
      projectStore.hydrate?.(normalized) ?? projectStore.load?.(normalized);
      logger.push(EVENT.PROJECT_LOAD, { source: "upload", name: file.name });
    } catch (e) {
      logger.push(EVENT.ERROR, { where: "playground.import", message: String(e) });
      alert("Invalid or unsupported project JSON.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Restart
  const handleRestart = () => {
    const blank = {
      schemaVersion: 2,
      background: { type: "one", colors: ["#111111"], direction: "to right", ratio: 50 },
      cards: [],
    };
    projectStore.hydrate?.(blank) ?? projectStore.load?.(blank);
  };

  // **Force exit → landing** (bypass guards)
  const handleExit = () => {
    try {
      // neutralize common “unsaved changes” guards
      window.onbeforeunload = null;
      // mark as safe if your app checks flags
      window.__PG_BYPASS_GUARDS__ = true;
    } catch {}
    // hard redirect (no SPA intercept)
    window.location.replace("/");
  };

  return (
    <>
      {/* Full app (Home: FormPanel + canvas + all features) */}
      <Home />

      {/* Playground toolbar */}
      <Toolbar onExit={handleExit} onRestart={handleRestart} onPick={() => fileRef.current?.click()} />
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />

      {/* HUD */}
      <HudToggle open={hudOpen} onToggle={() => setHudOpen((v) => !v)} />
      {hudOpen && (
        <DebugHUD
          sessionId={sessionId}
          logger={logger}
          metrics={{ fps: 0, zoom: 1, pan: { x: 0, y: 0 } }}
          onScreenshot={onScreenshot}
          onExport={onExport}
        />
      )}
    </>
  );
}

/* ------------ helpers ------------ */
function getStateSafe() {
  try {
    return projectStore.getState ? projectStore.getState() : projectStore.state;
  } catch {
    return {};
  }
}

// Normalize legacy JSON; seed 1 default card if none resolved
function normalizeProject(input, registry) {
  const out = { ...input };
  if (!out.schemaVersion || out.schemaVersion < 2) out.schemaVersion = 2;

  // background
  if (!out.background) out.background = {};
  if (out.background.color && !out.background.type) {
    out.background = {
      type: "one",
      colors: [out.background.color],
      direction: "to right",
      ratio: 50,
    };
  }
  if (!out.background.type) out.background.type = "one";
  if (!Array.isArray(out.background.colors)) {
    out.background.colors = [out.background.colors || "#111111"];
  }
  if (typeof out.background.direction !== "string") out.background.direction = "to right";
  if (typeof out.background.ratio !== "number") out.background.ratio = 50;

  // cards
  const keys = Object.keys(registry || {});
  const firstKey = keys[0] || "menucard";
  const has = (k) => keys.includes(k);
  const alias = (t) => {
    const raw = String(t || "").trim();
    const lc = raw.toLowerCase().replace(/\s+/g, "");
    const map = {
      menucard: "menucard", menu: "menucard", "menu-card": "menucard", menucardcomponent: "menucard",
      mealcard: "mealcard", meal: "mealcard", "meal-card": "mealcard",
      pizzacard: "pizzacard", pizza: "pizzacard", "pizza-card": "pizzacard",
    };
    const guess = map[lc] || lc || firstKey;
    return has(guess) ? guess : firstKey;
  };

  let cards = Array.isArray(out.cards) ? out.cards : [];
  if (!cards.length && Array.isArray(out.sections)) {
    cards = out.sections.map((s, i) => ({
      id: s.id || `sec_${i + 1}`,
      type: alias(s.type || "menucard"),
      x: s.x ?? (i % 2 === 0 ? 5 : 52),
      y: s.y ?? (i < 2 ? 5 : 48),
      w: s.w ?? 43,
      h: s.h ?? 40,
      title: s.title ?? s.name ?? "Untitled",
      body: s.body ?? "",
      price: s.price ?? "",
      font: s.font ?? "Poppins",
      ...s,
    }));
  }

  cards = cards.map((c, i) => ({
    id: c.id || `c_${i + 1}`,
    type: alias(c.type || firstKey),
    x: clamp(c.x, 0, 100, 5 + (i % 2) * 47),
    y: clamp(c.y, 0, 100, 5 + Math.floor(i / 2) * 43),
    w: clamp(c.w, 5, 100, 43),
    h: clamp(c.h, 5, 100, 40),
    title: c.title ?? "",
    body: c.body ?? "",
    price: c.price ?? "",
    font: c.font ?? "Poppins",
    ...c,
  }));

  if (!cards.length) {
    cards = [{
      id: "c_1",
      type: has(firstKey) ? firstKey : "menucard",
      x: 5, y: 5, w: 43, h: 40,
      title: "Sample",
      body: "Imported project had no cards; seeded one for preview.",
      price: "",
      font: "Poppins",
    }];
  }

  out.cards = cards;
  return out;
}

function clamp(v, min, max, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
}

/* ------------ UI bits ------------ */
function Toolbar({ onExit, onRestart, onPick }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      position: "fixed", top: 10, left: 10, zIndex: 10000,
      background: "#151515", border: "1px solid #2a2a2a", borderRadius: 10,
      padding: open ? "10px" : "6px", color: "#e5e7eb", minWidth: open ? 220 : 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: open ? 8 : 0 }}>
        <strong style={{ fontSize: 12 }}>{open ? "Playground (No Save)" : "PG"}</strong>
        <button title={open ? "Collapse" : "Expand"} onClick={() => setOpen((v) => !v)} style={btnIcon}>
          {open ? "«" : "»"}
        </button>
      </div>
      {open && (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onExit} style={btn}>⟵ Exit</button>
            <button onClick={onRestart} style={btn}>Restart</button>
          </div>
          <button onClick={onPick} style={btn}>Import Project (JSON)</button>
        </div>
      )}
    </div>
  );
}

function HudToggle({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={open ? "Hide HUD" : "Show HUD"}
      style={{
        position: "fixed", top: 10, right: 10, zIndex: 10000,
        border: "1px solid #2a2a2a", background: "#151515", color: "#e5e7eb",
        borderRadius: 10, padding: "6px 10px",
      }}
    >
      {open ? "HUD −" : "HUD +" }
    </button>
  );
}

const btn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #2a2a2a",
  background: "#1d1d1d",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 12,
};
const btnIcon = { ...btn, padding: "4px 8px", borderRadius: 6 };
