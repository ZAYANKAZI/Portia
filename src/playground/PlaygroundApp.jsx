// File: src/playground/PlaygroundApp.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import FormPanel from "../components/FormPanel.jsx";
import PreviewCanvas from "../components/PreviewCanvas.jsx";
import * as store from "../utils/projectStore.js";
import * as RegistryModule from "../components/templates/registry.js";

// Robust registry resolution (named/default/templates/cards)
const registry =
  RegistryModule.registry ||
  RegistryModule.default ||
  RegistryModule.templates ||
  RegistryModule.cards ||
  RegistryModule;

export default function PlaygroundApp() {
  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  // File picker
  const fileRef = useRef(null);

  // Sandbox: disable persistence side-effects
  const sandboxStore = useMemo(() => {
    const patched = { ...store };
    patched.save = () => {};      // no-op
    patched.persist = () => {};   // no-op
    return patched;
  }, []);

  // Canvas sizing wrapper to avoid “blank” due to zero height
  const canvasWrapRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ w: 1280, h: 720 });
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      // Give Preview a stable sized area; keep 16:9 if space allows
      const maxW = Math.max(600, cr.width - 24);
      const maxH = Math.max(400, cr.height - 24);
      // Maintain 16:9 letterboxed fit
      const targetW = Math.min(maxW, (maxH * 16) / 9);
      const targetH = (targetW * 9) / 16;
      setWrapperSize({ w: Math.floor(targetW), h: Math.floor(targetH) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Helpers
  const getState = () =>
    (sandboxStore.getState && sandboxStore.getState()) || sandboxStore.state || {};

  const handleUpload = async (file) => {
    setError("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // In-memory migrate + hydrate only
      const migrated = sandboxStore.migrate ? sandboxStore.migrate(json) : json;
      if (sandboxStore.hydrate) sandboxStore.hydrate(migrated);
      else if (sandboxStore.load) sandboxStore.load(migrated);

      setProjectName(file.name);
      setLoaded(true);
      setSidebarOpen(true); // open so FormPanel is visible after load
    } catch {
      setError("Invalid JSON. Please select a valid project file.");
    }
  };

  const handleExit = () => {
    try { sandboxStore.hydrate?.({}); } catch {}
    window.location.href = "/";
  };

  const handleRestart = () => {
    setLoaded(false);
    setProjectName("");
    setError("");
    try { sandboxStore.hydrate?.({}); } catch {}
    setSidebarOpen(true);
  };

  const state = getState();

  return (
    <div
      style={{
        height: "100vh",
        display: "grid",
        gridTemplateColumns: `${sidebarOpen ? 320 : 44}px 1fr`,
        background: "#111",
        color: "#e5e7eb",
      }}
    >
      {/* Sidebar */}
      <div style={{ borderRight: "1px solid #2a2a2a", position: "relative" }}>
        {/* Collapse / expand */}
        <button
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setSidebarOpen((v) => !v)}
          style={{
            position: "absolute",
            top: 8,
            right: sidebarOpen ? 8 : 6,
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "1px solid #2a2a2a",
            background: "#1c1c1c",
            color: "#e5e7eb",
            cursor: "pointer",
          }}
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          {sidebarOpen ? "«" : "»"}
        </button>

        {/* Compact header */}
        <div style={{ padding: sidebarOpen ? "12px 12px 8px" : "8px 6px", fontSize: 12 }}>
          {sidebarOpen ? (
            <strong>Playground (No Save)</strong>
          ) : (
            <span title="Playground">PG</span>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding: sidebarOpen ? "0 12px 12px" : "0 4px 8px" }}>
          {/* Exit / Restart (icons when collapsed) */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={handleExit} title="Exit" style={btn(sidebarOpen)}>
              {sidebarOpen ? "⟵ Exit" : "⟵"}
            </button>
            <button onClick={handleRestart} title="Restart" style={btn(sidebarOpen)}>
              {sidebarOpen ? "Restart" : "↺"}
            </button>
          </div>

          {/* Upload (always accessible) */}
          {!loaded && (
            <div style={{ display: "grid", gap: 8 }}>
              {sidebarOpen && <div>1) Import project JSON</div>}
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                style={{ width: "100%" }}
                title="Upload project JSON"
              />
              {error && (
                <div style={{ color: "#f87171", fontSize: 12 }}>{error}</div>
              )}
              {sidebarOpen && (
                <div style={{ fontSize: 11, opacity: 0.75 }}>
                  • Nothing is saved. Close tab or Exit to leave.
                </div>
              )}
            </div>
          )}

          {/* FormPanel (only when loaded) */}
          {loaded && sidebarOpen && (
            <>
              <div style={{ marginTop: 8, fontWeight: 600, fontSize: 13 }}>
                Project: <span title={projectName}>{projectName}</span>
              </div>
              <div style={{ marginTop: 10, maxHeight: "calc(100vh - 140px)", overflow: "auto" }}>
                <FormPanel
                  state={state}
                  updateBackground={(patch) => sandboxStore.updateBackground?.(patch)}
                  updateSection={(id, patch) => sandboxStore.updateSection?.(id, patch)}
                  registry={registry}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div ref={canvasWrapRef} style={{ position: "relative" }}>
        {!loaded ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            Upload a project JSON to start testing…
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              padding: 12,
            }}
          >
            <div
              style={{
                width: wrapperSize.w,
                height: wrapperSize.h,
                background: "#0b0b0b",
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                display: "grid",
                placeItems: "center",
              }}
            >
              {/* Use the real PreviewCanvas, inside a stable-sized wrapper */}
              <PreviewCanvas state={state} registry={registry} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Small helper for consistent buttons
function btn(expanded) {
  return {
    flex: 1,
    minWidth: expanded ? 0 : 28,
    padding: expanded ? "6px 10px" : "6px 0",
    borderRadius: 6,
    border: "1px solid #2a2a2a",
    background: "#1c1c1c",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 12,
  };
}
