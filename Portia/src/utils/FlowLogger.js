// File: src/utils/FlowLogger.js
// Tiny in-app logger with download capability. No external deps.

let _entries = [];
let _enabled = true;
let _max = 5000;

const nowISO = () => new Date().toISOString();

const FlowLogger = {
  enable(v = true) { _enabled = v; },
  setMax(n = 5000) { _max = n; },
  clear() { _entries = []; },
  count() { return _entries.length; },
  entries() { return _entries.slice(); },

  log(type, data = {}, meta = {}) {
    if (!_enabled) return;
    const entry = {
      t: nowISO(),
      type,
      data,
      meta,
    };
    _entries.push(entry);
    if (_entries.length > _max) _entries.splice(0, _entries.length - _max);
  },

  group(type, data = {}, meta = {}) {
    // semantic alias for log; kept for readability
    this.log(type, data, { ...meta, group: true });
  },

  snapshot(label, payload) {
    this.log('snapshot', { label, payload });
  },

  attachGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (e) => {
      this.log('window.error', { message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error?.stack });
    });
    window.addEventListener('unhandledrejection', (e) => {
      this.log('window.unhandledrejection', { reason: String(e.reason) });
    });
  },

  download(filename = `flowlog-${Date.now()}.json`) {
    try {
      const pretty = JSON.stringify(_entries, null, 2);
      const blob = new Blob([pretty], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2500);
      this.log('log.download', { filename, size: pretty.length });
    } catch (err) {
      this.log('log.download.error', { error: String(err) });
    }
  }
};

export default FlowLogger;
