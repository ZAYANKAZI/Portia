
// ============================================================================
/**
 * Minimal helpers to ensure fonts are ready before any raster export.
 * Use `wrapExport(() => yourRenderAndDownload())`.
 */
import { ready } from "../lib/fonts";

export async function ensureFontsReady() {
  await ready();
}

/** Wrap any export routine to guarantee fonts are fully loaded. */
export async function wrapExport(run: () => Promise<void> | void) {
  await ensureFontsReady();
  await run();
}