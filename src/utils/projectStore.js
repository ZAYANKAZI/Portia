// src/utils/projectStore.js
// -----------------------------------------------------------------------------
// Unified, single-source-of-truth project store for both Landing and Editor.
//
// What this provides:
// - IndexedDB DB: `ssp_unified_v1`
// - ObjectStore: `projects` with keyPath `id`
// - Each record: { id, name, updatedAt, data }
// - Helper API used by Landing.jsx + Home.jsx
// - One-time migration from legacy storage (localStorage stubs + `ssp-db` by name)
// -----------------------------------------------------------------------------

const DB_NAME = 'ssp_unified_v1';
const STORE = 'projects';
const LEGACY_DB = 'ssp-db'; // old DB that used the project NAME as the key
const LEGACY_STORE = 'projects';
const LEGACY_STUB_PREFIX = 'ssp_project:'; // localStorage stubs by name
const MIGRATION_FLAG = 'ssp_unified_migrated_v1';

// ------------------------- IDB helpers -------------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('updatedAt', 'updatedAt');
        os.createIndex('name', 'name');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const rq = st.get(id);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}

async function idbPut(record) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function idbDel(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function idbGetAll() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE).index('updatedAt');
    const results = [];
    st.openCursor(null, 'prev').onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) { results.push(cur.value); cur.continue(); } else { res(results); }
    };
    tx.onerror = () => rej(tx.error);
  });
}

async function idbFindByName(name) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const idx = tx.objectStore(STORE).index('name');
    const req = idx.getAll(IDBKeyRange.only(name));
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

// ------------------------- Legacy migration -------------------------
function openLegacyDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LEGACY_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LEGACY_STORE)) db.createObjectStore(LEGACY_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function legacyGetByName(name) {
  try {
    const db = await openLegacyDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(LEGACY_STORE, 'readonly');
      const rq = tx.objectStore(LEGACY_STORE).get(name);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => rej(rq.error);
    });
  } catch { return null; }
}

async function migrateLegacyIfNeeded() {
  if (localStorage.getItem(MIGRATION_FLAG)) return;
  try {
    // Collect candidate names from localStorage stubs
    const names = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_STUB_PREFIX)) names.add(k.slice(LEGACY_STUB_PREFIX.length));
    }
    // Also try pulling all keys from legacy IDB by name if possible (no easy list → rely on stubs)
    for (const name of names) {
      // Skip if unified already has a record with same name
      const existing = await idbFindByName(name);
      if (existing && existing.length) continue;

      // Try legacy IDB first
      let payload = await legacyGetByName(name);
      // If not there, the entire JSON might be in the stub itself
      if (!payload) {
        try {
          const raw = localStorage.getItem(LEGACY_STUB_PREFIX + name);
          if (raw) {
            const stub = JSON.parse(raw);
            if (stub && typeof stub === 'object' && Array.isArray(stub.sections)) payload = stub;
          }
        } catch {}
      }
      if (!payload) continue;

      const id = crypto.randomUUID();
      await idbPut({ id, name, updatedAt: Date.now(), data: payload });
    }
  } finally {
    localStorage.setItem(MIGRATION_FLAG, '1');
  }
}

// ------------------------- Public API -------------------------
export async function initProjectStore() {
  await migrateLegacyIfNeeded();
}

export async function listProjects() {
  const rows = await idbGetAll();
  return rows.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
}

export async function getProject(id) {
  const row = await idbGet(id);
  return row ? { id: row.id, name: row.name, data: row.data, updatedAt: row.updatedAt } : null;
}

export async function createProject(name, data = { background: '', sections: [] }) {
  const id = crypto.randomUUID();
  const rec = { id, name: name || 'Untitled Project', updatedAt: Date.now(), data };
  await idbPut(rec);
  return rec;
}

export async function saveProject(id, name, data) {
  if (!id) {
    const rec = await createProject(name, data);
    return rec;
  }
  const row = await idbGet(id);
  const rec = { id, name: name || row?.name || 'Untitled Project', data, updatedAt: Date.now() };
  await idbPut(rec);
  return rec;
}

export async function updateProjectMeta(id, patch = {}) {
  const row = await idbGet(id);
  if (!row) return null;
  const rec = { ...row, ...patch, updatedAt: Date.now() };
  await idbPut(rec);
  return rec;
}

export async function deleteProject(id) {
  await idbDel(id);
}

export async function duplicateProject(id, newName) {
  const row = await idbGet(id);
  if (!row) return null;
  const copy = await createProject(newName || `${row.name} Copy`, JSON.parse(JSON.stringify(row.data)));
  return copy;
}

// Export/import helpers
export async function exportProjectJson(id) {
  const row = await idbGet(id);
  if (!row) throw new Error('Project not found');
  return { __type: 'ssp_project', version: 3, meta: { id: row.id, name: row.name, updatedAt: row.updatedAt }, data: row.data };
}

export async function importProjectJson(obj) {
  if (obj?.__type === 'ssp_project' && obj?.data) {
    const name = obj.meta?.name || 'Imported Project';
    return await createProject(name, obj.data);
  }
  if (obj && typeof obj === 'object' && Array.isArray(obj.sections)) {
    const name = obj.meta?.name || obj.projectName || 'Imported Project';
    return await createProject(name, obj);
  }
  throw new Error('Invalid project JSON');
}

export function downloadJson(obj, filename = 'project.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  a.remove();
}
