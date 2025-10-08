// ======================================================================
// File: src/playground/LandingPicker.jsx
// ======================================================================
import React, { useEffect, useRef, useState } from "react";
import { EVENT } from "./types.js";

export default function LandingPicker({ fixtures = [], onOpen, logger }) {
  const fileRef = useRef(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("pg.recent") || "[]");
      setRecent(Array.isArray(r) ? r : []);
    } catch {
      setRecent([]);
    }
  }, []);

  const openFixture = async (fx) => {
    logger.push(EVENT.PROJECT_LOAD, { source: "fixture", name: fx.name });
    onOpen({ source: "fixture", project: fx.data, name: fx.name });
  };

  const openUpload = async (file) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      logger.push(EVENT.PROJECT_LOAD, { source: "upload", name: file.name });
      onOpen({ source: "upload", project: json, name: file.name });
    } catch (e) {
      logger.push(EVENT.ERROR, { where: "LandingPicker.upload", message: String(e) });
      alert("Invalid JSON file.");
    }
  };

  const openRecent = (r) => {
    logger.push(EVENT.PROJECT_LOAD, { source: "recent", name: r.name });
    onOpen({ source: "recent", project: r.project, name: r.name });
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "40px auto" }}>
      <h1>Playground</h1>
      <p>Open a project to start testing new cards/features.</p>

      <section style={{ marginTop: 24 }}>
        <h3>Fixtures</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {fixtures.map((fx) => (
            <button key={fx.name} onClick={() => openFixture(fx)}>
              {fx.name}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Recent</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {recent.length === 0 && <span>None yet</span>}
          {recent.map((r) => (
            <button key={r.name + r.ts} onClick={() => openRecent(r)}>
              {r.name}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Upload JSON</h3>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={(e) => e.target.files?.[0] && openUpload(e.target.files[0])}
        />
      </section>
    </div>
  );
}