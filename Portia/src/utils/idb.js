// src/utils/idb.js
// Lightweight IndexedDB helper (no external deps)
// DB: 'ssp_db' with stores: 'kv' (arbitrary key/value) and 'projects'

const DB_NAME = 'ssp_db';
const DB_VERSION = 1;
const STORES = ['kv', 'projects'];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const res = fn(store);
    tx.oncomplete = () => resolve(res);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGet(store, key) {
  return withStore(store, 'readonly', (s) => new Promise((resolve, reject) => {
    const req = s.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  }));
}

export async function idbSet(store, key, value) {
  return withStore(store, 'readwrite', (s) => new Promise((resolve, reject) => {
    const req = s.put(value, key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function idbDel(store, key) {
  return withStore(store, 'readwrite', (s) => new Promise((resolve, reject) => {
    const req = s.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  }));
}

export async function idbKeys(store) {
  return withStore(store, 'readonly', (s) => new Promise((resolve, reject) => {
    const req = s.getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}
