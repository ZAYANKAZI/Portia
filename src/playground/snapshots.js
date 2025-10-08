// ======================================================================
// File: src/playground/snapshots.js
// ======================================================================
/**
 * Screenshot/export helpers. Uses html-to-image or your existing export utils if available.
 * IMPORTANT: no color/styles specified—uses your real components.
 */
// TODO(import): If you have a central export pipeline, import it here.
export async function captureScreenshot(node, scale = 1) {
  const { toPng } = await import("html-to-image"); // dev-only dependency
  return toPng(node, { pixelRatio: scale });
}
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
