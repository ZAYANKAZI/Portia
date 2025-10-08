// src/pages/PreviewPage.jsx
import React, { useEffect, useState } from "react";
import PreviewCanvas from "../components/PreviewCanvas";
import { exportToJPEG } from "../utils/exportUtils";

export default function PreviewPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    try {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
      if (!id) return;
      const raw = localStorage.getItem(`ssp_preview:${id}`);
      if (raw) {
        setData(JSON.parse(raw));
        // Optional cleanup to avoid storage growth:
        // localStorage.removeItem(`ssp_preview:${id}`);
      }
    } catch (e) {
      console.error("[preview] failed to load state:", e);
    }
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#111" }}>
        <div style={{ color: "#bbb", fontFamily: "system-ui" }}>
          No preview data found. Go back and click <b>Open Preview</b> again.
        </div>
      </div>
    );
  }

  const exportNow = (scale, name) => exportToJPEG("preview-live", name, scale);

  return (
    <div style={{ minHeight: "100vh", background: "#111", padding: 16, color: "#ddd", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ opacity: 0.8 }}>Preview</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => exportNow(1, "screen-1080p.jpg")}>Export 1080p</button>
          <button onClick={() => exportNow(2, "screen-4k.jpg")}>Export 4K</button>
          <button onClick={() => exportNow(3, "screen-6k.jpg")}>Export 6K</button>
        </div>
      </div>

      <div style={{ width: 1920, margin: "0 auto" }}>
        <PreviewCanvas data={data} captureId="preview-live" previewScale={1} />
      </div>
    </div>
  );
}
