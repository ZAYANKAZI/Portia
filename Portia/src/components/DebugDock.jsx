// File: src/components/DebugDock.jsx
import React, { useEffect, useMemo, useState } from 'react';
import FlowLogger from '../utils/FlowLogger';

const TYPES = [
  'inline.open','inline.close','inline.commit',
  'home.onEditSection','home.setByPath','home.state.after','home.state.diff',
  'window.error','window.unhandledrejection','snapshot','log.download'
];

export default function DebugDock({ open, onClose }) {
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(x => x + 1), 400);
    return () => clearInterval(id);
  }, []);

  const entries = useMemo(() => {
    const all = FlowLogger.entries();
    if (!filter.trim()) return all;
    const f = filter.toLowerCase();
    return all.filter(e =>
      e.type?.toLowerCase().includes(f) ||
      JSON.stringify(e.data).toLowerCase().includes(f) ||
      JSON.stringify(e.meta).toLowerCase().includes(f)
    );
  }, [tick, filter, open]);

  if (!open) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[99999] w-[520px] max-h-[60vh] rounded-lg bg-[#121212] border border-gray-700 shadow-xl flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <strong className="text-sm text-white">Debug Dock</strong>
        <span className="text-xs text-gray-400">({FlowLogger.count()} events)</span>
        <input
          value={filter}
          onChange={e=>setFilter(e.target.value)}
          placeholder="filter…"
          className="ml-2 flex-1 bg-[#1c1c1c] text-gray-200 text-xs px-2 py-1 rounded border border-gray-700"
        />
        <label className="text-xs text-gray-400 flex items-center gap-1">
          <input type="checkbox" checked={autoScroll} onChange={e=>setAutoScroll(e.target.checked)} />
          auto
        </label>
        <button className="text-xs px-2 py-1 rounded bg-gray-700 text-white" onClick={()=>FlowLogger.download()}>Download</button>
        <button className="text-xs px-2 py-1 rounded bg-gray-700 text-white" onClick={()=>FlowLogger.clear()}>Clear</button>
        <button className="text-xs px-2 py-1 rounded bg-red-700 text-white" onClick={onClose}>Close</button>
      </div>
      <div
        className="flex-1 overflow-auto text-[11px] leading-[1.15rem] p-2 text-gray-200"
        ref={(el) => {
          if (el && autoScroll) el.scrollTop = el.scrollHeight;
        }}
      >
        {entries.map((e, i) => (
          <div key={i} className="mb-2">
            <div className="text-gray-400">
              <span className="text-gray-500">{new Date(e.t).toLocaleTimeString()}</span>
              {' · '}
              <span className="text-blue-400">{e.type}</span>
            </div>
            <pre className="bg-[#181818] border border-gray-800 rounded p-2 overflow-auto">{JSON.stringify(e.data, null, 2)}</pre>
            {e.meta && Object.keys(e.meta).length > 0 && (
              <pre className="bg-[#141414] border border-gray-800 rounded p-2 overflow-auto mt-1 text-gray-400">{JSON.stringify(e.meta, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
