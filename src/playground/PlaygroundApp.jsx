// File: src/playground/PlaygroundApp.jsx  (PATCHED IMPORT PATHS)
import React, { useEffect, useMemo, useRef, useState } from "react";
import LandingPicker from "./LandingPicker.jsx";
import DebugHUD from "./DebugHUD.jsx";
import { createLogger } from "./logger.js";
import { EVENT } from "./types.js";
import { makeSessionId } from "./useSessionId.js";
import { captureScreenshot, downloadDataUrl } from "./snapshots.js";
import { FLAGS } from "./featureFlags.js";

// ---- FIXED PATHS (match your repo) ----
import FormPanel from "../components/FormPanel.jsx";               // ← was ../FormPanel.jsx
import PreviewCanvas from "../components/PreviewCanvas.jsx";       // adjust if different
import * as projectStore from "../utils/projectStore.js";          // adjust if your store path differs
import { registry } from "../components/templates/registry.js";    // adjust if your registry path differs
// --------------------------------------

// Fixtures (ensure they exist under /playground/fixtures)
import baseline from "./baseline.json";
import stress from "./stress.json";
import legacy from "./legacy.json";

export default function PlaygroundApp() {
  const [sessionId] = useState(() => makeSessionId());
  const logger = useMemo(() => createLogger({ sessionId }), [sessionId]);

  const [loaded, setLoaded] = useState(false);
  const [projectName, setProjectName] = useState("");
  const canvasRef = useRef(null);

  const [metrics, setMetrics] = useState({ fps: 0, zoom: 1, pan: { x: 0, y: 0 } });

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setMetrics((m) => ({ ...m, fps: frames }));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    logger.push(EVENT.APP_START, {
      userAgent: navigator.userAgent,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      flags: FLAGS,
    });
  }, [logger]);

  useEffect(() => {
    if (!projectStore.setState || !projectStore.getState) return;
    const origSetState = projectStore.setState;
    projectStore.setState = (updater, reason) => {
      const before = projectStore.getState?.();
      const result = origSetState(updater, reason);
      const after = projectStore.getState?.();
      logger.push("store.patch", {
        reason: reason || "unknown",
        beforeHash: hashJSON(before),
        afterHash: hashJSON(after),
      });
      return result;
    };
    return () => {
      projectStore.setState = origSetState;
    };
  }, [logger]);

  const onOpen = ({ source, project, name }) => {
    const migrated = projectStore.migrate ? projectStore.migrate(project) : project;
    if (migrated !== project) {
      logger.push(EVENT.MIGRATE_RUN, {
        from: project.schemaVersion ?? "legacy",
        to: migrated.schemaVersion ?? "unknown",
      });
    }
    projectStore.hydrate ? projectStore.hydrate(migrated) : projectStore.load?.(migrated);
    setProjectName(name || source);
    setLoaded(true);

    try {
      const recent = JSON.parse(localStorage.getItem("pg.recent") || "[]");
      recent.unshift({ name: name || source, ts: Date.now(), project: migrated });
      localStorage.setItem("pg.recent", JSON.stringify(recent.slice(0, 8)));
    } catch {}
  };

  const onScreenshot = async () => {
    const node = canvasRef.current;
    if (!node) return;
    const dataUrl = await captureScreenshot(node, 2);
    downloadDataUrl(dataUrl, `${sessionId}-preview-2x.png`);
    logger.push("artifact.screenshot", { scale: 2, bytes: dataUrl.length });
  };

  const onExport = async () => {
    try {
      logger.push(EVENT.EXPORT_START, {});
      await onScreenshot(); // replace with real export if available
      logger.push(EVENT.EXPORT_SUCCESS, {});
    } catch (e) {
      logger.push(EVENT.EXPORT_FAIL, { message: String(e) });
      alert("Export failed. See logs.");
    }
  };

  const handleViewport = (v) => setMetrics((m) => ({ ...m, ...v }));

  if (!loaded) {
    const fixtures = [
      { name: "Baseline", data: baseline },
      { name: "Stress (Long/RTL)", data: stress },
      { name: "Legacy (migrate)", data: legacy },
    ];
    return <LandingPicker fixtures={fixtures} onOpen={onOpen} logger={logger} />;
  }

  const state = projectStore.getState ? projectStore.getState() : projectStore.state;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      <div style={{ borderRight: "1px solid #eee", overflow: "auto" }}>
        <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <strong>Project:</strong> {projectName}
        </div>
        <FormPanel
          state={state}
          updateBackground={(patch) => {
            logger.push(EVENT.BG_CHANGE, { patch });
            projectStore.updateBackground?.(patch);
          }}
          updateSection={(id, patch) => {
            logger.push(EVENT.PANEL_CHANGE, { id, patch });
            projectStore.updateSection?.(id, patch);
          }}
          registry={registry}
        />
      </div>

      <div style={{ position: "relative" }}>
        <div ref={canvasRef}>
          <PreviewCanvas
            state={state}
            registry={registry}
            onViewportChange={handleViewport}
            onInlineOpen={(e) => logger.push(EVENT.INLINE_OPEN, e)}
            onInlineCommit={(e) => logger.push(EVENT.INLINE_COMMIT, e)}
            onInlineCancel={(e) => logger.push(EVENT.INLINE_CANCEL, e)}
            onCardAdd={(e) => logger.push(EVENT.CARD_ADD, e)}
            onCardRemove={(e) => logger.push(EVENT.CARD_REMOVE, e)}
            onCardMove={(e) => logger.push(EVENT.CARD_MOVE, e)}
            onCardResize={(e) => logger.push(EVENT.CARD_RESIZE, e)}
          />
        </div>

        <DebugHUD
          sessionId={sessionId}
          logger={logger}
          metrics={metrics}
          onScreenshot={onScreenshot}
          onExport={onExport}
        />
      </div>
    </div>
  );
}

function hashJSON(obj) {
  try {
    const s = JSON.stringify(obj);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(16);
  } catch {
    return "0";
  }
}
