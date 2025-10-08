import { ready } from '../components/lib/fonts';
export async function ensureFontsReady() { await ready(); }
export async function wrapExport(run: () => Promise<void> | void) { await ensureFontsReady(); await run(); }