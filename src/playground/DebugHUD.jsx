import React, { useEffect, useRef, useState } from "react";
import { EVENT } from "./types.js";

export default function DebugHUD({ logger, metrics, onScreenshot, onExport, sessionId }) {
  const [logs, setLogs] = useState(logger.all());
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLogs(logger.all());
    }, 500);
    return () => clearInterval(intervalRef.current);
  }, [logger]);

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        top: 12,
        width: 360,
        maxHeight: "80vh",
        overflow: "auto",
        padding: 12,
        border: "1px solid #ddd",
        background: "white",
        fontSize: 12,
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <strong>Playground HUD</strong> — <code>{sessionId}</code>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={onScreenshot}>Screenshot</button>
        <button onClick={onExport}>Export</button>
        <button onClick={() => logger.download()}>Download logs</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div>FPS: {metrics.fps.toFixed(0)}</div>
        <div>Zoom: {metrics.zoom?.toFixed?.(2) ?? "-"}</div>
        <div>Pan: {metrics.pan ? `${metrics.pan.x},${metrics.pan.y}` : "-"}</div>
      </div>

      <div>
        <div style={{ margin: "6px 0" }}><strong>Events</strong></div>
        {logs.slice(-200).reverse().map((e, i) => (
          <pre key={i} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {e.ts} • {e.type} {JSON.stringify(e, null, 0)}
          </pre>
        ))}
      </div>
    </div>
  );
}