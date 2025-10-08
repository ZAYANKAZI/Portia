export function makeSessionId() {
  const t = new Date().toISOString().replace(/[:.]/g, "");
  const r = Math.random().toString(36).slice(2, 8);
  return `pg-${t}-${r}`;
}