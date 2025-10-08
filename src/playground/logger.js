// ======================================================================
// File: src/playground/logger.js
// ======================================================================
/**
 * NDJSON logger with in-memory ring buffer + download support.
 * Why: single source of truth for Playground diagnostics.
 */
export function createLogger({ sessionId, capacity = 5000 } = {}) {
  const buf = [];
  const push = (type, payload = {}) => {
    const entry = {
      ts: new Date().toISOString(),
      type,
      sessionId,
      ...payload,
    };
    buf.push(entry);
    if (buf.length > capacity) buf.shift();
    return entry;
  };
  const all = () => buf.slice();
  const clear = () => buf.splice(0, buf.length);
  const download = (filename = `logs-${sessionId}.ndjson`) => {
    const text = buf.map((e) => JSON.stringify(e)).join("\n");
    const blob = new Blob([text], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return { push, all, clear, download };
}
