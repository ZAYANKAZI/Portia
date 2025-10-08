// File: src/routes/PlaygroundRoute.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "../pages/Home.jsx";

import * as projectStore from "../utils/projectStore.js";
import DebugHUD from "../playground/DebugHUD.jsx";
import { createLogger } from "../playground/logger.js";
import { EVENT } from "../playground/types.js";
import { makeSessionId } from "../playground/useSessionId.js";
import { captureScreenshot, downloadDataUrl } from "../playground/snapshots.js";

// Robust registry import (works with default/named/aliases)
import * as RegistryModule from "../components/templates/registry.js";
const REGISTRY =
  RegistryModule.registry ||
  RegistryModule.default ||
  RegistryModule.templates ||
  RegistryModule.cards ||
  RegistryModule;

export default function PlaygroundRoute() {
  const navigate = useNavigate();

  // Sandbox: block persistence (why: keep playground write-free)
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

  // Seed a visible blank project if nothing loaded (prevents black screen)
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

  // HUD / logs
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

  // Toolbar actions
  const fileRef = useRef(null);

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const migrated = projectStore.migrate ? projectStore.migrate(json) : json;
      const normalized = normalizeProject(migrated, REGISTRY); // <- ensures cards/background OK

      projectStore.hydrate?.(normalized) ?? projectStore.load?.(normalized);
      logger.push(EVENT.PROJECT_LOAD, { source: "upload", name: file.name });
    } catch (e) {
      logger.push(EVENT.ERROR, { where: "playground.import", message: String(e) });
      alert("Invalid or unsupported project JSON.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRestart = () => {
    projectStore.hydrate?.({
      schemaVersion: 2,
      background: { type: "one", colors: ["#111111"], direction: "to right", ratio: 50 },
      cards: [],
    }) ?? projectStore.load?.({
      schemaVersion: 2,
      background: { type: "one", colors: ["#111111"], direction: "to right", ratio: 50 },
      cards: [],
    });
  };

  const handleExit = () => {
    // Always land on landing page
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Real app shell (Home: same layout, FormPanel, canvas, features) */}
      <Home />

      {/* Playground Toolbar (top-left, collapsible) */}
      <Toolbar
        onExit={handleExit}
        onRestart={handleRestart}
        onPick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />

      {/* HUD (top-right; toggleable) */}
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

/* ================= helpers ================= */

function getStateSafe() {
  try {
    return projectStore.getState ? projectStore.getState() : projectStore.state;
  } catch {
    return {};
  }
}

// Normalizes legacy JSON to current schema & registry keys.
function normalizeProject(input, registry) {
  const out = { ...input };

  // schemaVersion
  if (!out.schemaVersion || out.schemaVersion < 2) out.schemaVersion = 2;

  // background: legacy {color} -> modern one-color
  if (!out.background) out.background = {};
  if (out.background && out.background.color && !out.background.type) {
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
  const regKeys = new Set(Object.keys(registry || {}));
  const alias = (t) => {
    if (!t) return t;
    const raw = String(t).trim();
    const lc = raw.toLowerCase().replace(/\s+/g, "");
    const map = {
      menucard: "menucard",
      menu: "menucard",
      "menu-card": "menucard",
      mealcard: "mealcard",
      meal: "mealcard",
      "meal-card": "mealcard",
      pizzacard: "pizzacard",
      pizza: "pizzacard",
      "pizza-card": "pizzacard",
    };
    // Try class-like names e.g., "MenuCard"
    if (!map[lc] && /card$/i.test(raw)) map[lc] = raw.replace(/\s+/g, "").toLowerCase();
    const guess = map[lc] || lc;
    return regKeys.has(guess) ? guess : guess;
  };

  let cards = Array.isArray(out.cards) ? out.cards : [];
  // Handle legacy shapes (e.g., sections/items)
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

  // Normalize each card and ensure required fields
  cards = cards.map((c, i) => {
    const t = alias(c.type || "menucard");
    const fallbackType = regKeys.has(t) ? t : (regKeys.values().next().value || "menucard");
    return {
      id: c.id || `c_${i + 1}`,
      type: regKeys.has(fallbackType) ? fallbackType : "menucard",
      x: clampNum(c.x, 0, 100, 5 + (i % 2) * 47),
      y: clampNum(c.y, 0, 100, 5 + Math.floor(i / 2) * 43),
      w: clampNum(c.w, 5, 100, 43),
      h: clampNum(c.h, 5, 100, 40),
      title: c.title ?? "",
      body: c.body ?? "",
      price: c.price ?? "",
      font: c.font ?? "Poppins",
      ...c,
    };
  });

  out.cards = cards;
  return out;
}

function clampNum(v, min, max, dflt) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
  return dflt;
}

/* ---------- UI bits (local-only) ---------- */
function Toolbar({ onExit, onRestart, onPick }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 10000,
        background: "#151515",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: open ? "10px" : "6px",
        color: "#e5e7eb",
        minWidth: open ? 220 : 60,
      }}
    >
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
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 10000,
        border: "1px solid #2a2a2a",
        background: "#151515",
        color: "#e5e7eb",
        borderRadius: 10,
        padding: "6px 10px",
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
