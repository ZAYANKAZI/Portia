// src/components/ExportProjectModal.jsx
import React, { useMemo, useState } from 'react';
import { listProjects, exportProjectJson, downloadJson } from '../utils/projectStore';

export default function ExportProjectModal({ isOpen, onClose }) {
  const projects = useMemo(() => listProjects(), [isOpen]);
  const [pick, setPick] = useState(projects?.[0]?.id || null);

  if (!isOpen) return null;

  const onExport = async () => {
    try {
      const obj = await exportProjectJson(pick);
      const name = (obj?.meta?.name || 'project').replace(/[^a-z0-9\-_ ]/gi, '_');
      downloadJson(obj, `${name}.json`);
      onClose?.();
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={onClose}>
      <div className="w-[520px] rounded-xl bg-white shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-2">Export project as JSON</div>
        {projects.length === 0 ? (
          <div className="text-sm text-gray-600">No projects found.</div>
        ) : (
          <>
            <label className="text-sm">Choose a project</label>
            <select
              className="w-full border rounded px-2 py-1 mt-1"
              value={pick || ''}
              onChange={(e) => setPick(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {new Date(p.updatedAt).toLocaleString()}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-1 rounded border" onClick={onClose}>Cancel</button>
              <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={onExport} disabled={!pick}>
                Export JSON
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
