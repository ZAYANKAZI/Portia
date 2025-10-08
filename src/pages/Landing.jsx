import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  initProjectStore, listProjects, createProject, duplicateProject,
  importProjectJson, exportProjectJson, downloadJson,
} from '../utils/projectStore';
import * as fonts from '../components/lib/fonts';

const AUTOSAVE_KEY = 'ssp_autosave';

function Modal({ children, onClose, maxWidth = 'max-w-lg', title }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className={`w-full ${maxWidth} mx-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl text-white shadow-2xl`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="px-2 py-1 text-xs rounded-lg border border-white/25 bg-white/10 hover:bg-white/20" onClick={onClose}>Close</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const fontInputRef = useRef(null);

  const [list, setList] = useState([]);
  const [force, setForce] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newName, setNewName] = useState('New project');
  const [startFrom, setStartFrom] = useState('blank');
  const [exportPick, setExportPick] = useState('');
  const [folderConnected, setFolderConnected] = useState(false);

  useEffect(() => {
    (async () => {
      await initProjectStore();
      const rows = await listProjects();
      setList(rows);
      fonts.injectCssLink();
      fonts.ensureManifestLoaded();
    })();
  }, [force]);

  const openEditor = (id) => navigate(`/editor?pid=${encodeURIComponent(id)}`);

  const createNew = async () => {
    try {
      const name = (newName || 'Untitled Project').trim();
      let rec;
      if (startFrom === 'blank') {
        rec = await createProject(name, { screens: [{ id: 'screen-1', name: 'Screen 1', background: '', sections: [] }], activeScreenId: 'screen-1' });
      } else if (startFrom === '__autosave__') {
        const raw = localStorage.getItem(AUTOSAVE_KEY);
        const data = raw ? JSON.parse(raw) : { screens: [{ id: 'screen-1', name: 'Screen 1', background: '', sections: [] }], activeScreenId: 'screen-1' };
        rec = await createProject(name, data);
      } else {
        rec = await duplicateProject(startFrom, name);
      }
      setNewOpen(false);
      setForce((n) => n + 1);
      openEditor(rec.id);
    } catch (e) {
      alert(`Create failed: ${e?.message || e}`);
    }
  };

  const onImportClick = () => fileInputRef.current?.click();
  const onImportJson = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      const rec = await importProjectJson(json);
      setForce((n) => n + 1);
      openEditor(rec.id);
    } catch (err) {
      alert(`Import failed: ${err?.message || String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  // --- Fonts: 2-step flow ---
  const connectFolder = async () => {
    try {
      await fonts.connectProjectFolder(); // must be called in this click
      setFolderConnected(true);
      alert('Project folder connected. You can now add fonts.');
    } catch (err) {
      alert(`Connect failed: ${err?.message || String(err)}`);
    }
  };
  const onAddFontClick = () => {
    if (!fonts.hasProjectRoot()) {
      alert('Connect your project folder first.');
      return;
    }
    fontInputRef.current?.click();
  };
  const onAddFontFiles = async (e) => {
    const files = e.target.files;
    try {
      await fonts.addFonts(files); // no directory picker here
      alert('Font(s) added to public/fonts. They are now available in pickers.');
    } catch (err) {
      alert(`Add Font failed: ${err?.message || String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  const doExport = async () => {
    try {
      const obj = await exportProjectJson(exportPick);
      const safe = (obj?.meta?.name || 'project').replace(/[^a-z0-9\-_ ]/gi, '_');
      downloadJson(obj, `${safe}.json`);
      setExportOpen(false);
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  return (
    <div className="relative min-h-[70vh] grid place-items-center px-4">
      <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Screen Promotion</h1>
          <p className="text-white/90 mt-2">Start a new project or open an existing one.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <button onClick={() => setPickerOpen(true)} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 text-center hover:bg-white/15 transition text-white">
            <div className="text-lg font-semibold">Open Project</div>
            <div className="text-sm text-white/80 mt-1">Choose from saved projects.</div>
          </button>

          <button onClick={() => setNewOpen(true)} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 text-center hover:bg-white/15 transition text-white">
            <div className="text-lg font-semibold">New Project</div>
            <div className="text-sm text-white/80 mt-1">Create blank or duplicate.</div>
          </button>

          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 text-center text-white">
            <div className="text-lg font-semibold mb-2">Import / Export</div>
            <div className="flex gap-2 justify-center">
              <button onClick={onImportClick} className="px-3 py-1.5 rounded border border-white/30 bg-white/10 hover:bg-white/20">Import JSON</button>
              <button onClick={() => { setExportPick(list.find((x) => x.id && x.id !== '__autosave__')?.id || ''); setExportOpen(true); }} className="px-3 py-1.5 rounded border border-white/30 bg-white/10 hover:bg-white/20">Export JSON</button>
            </div>
            <input ref={fileInputRef} className="hidden" type="file" accept="application/json,.json" onChange={onImportJson} />

            {/* Fonts */}
            <div className="mt-4">
              <div className="text-lg font-semibold mb-2">Fonts</div>
              <div className="flex gap-2 justify-center">
                <button onClick={connectFolder} className="px-3 py-1.5 rounded border border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30">
                  {folderConnected ? 'Reconnect Folder' : 'Connect Project Folder'}
                </button>
                <button onClick={onAddFontClick} className="px-3 py-1.5 rounded border border-white/30 bg-white/10 hover:bg-white/20">
                  Add Font
                </button>
              </div>
              <input ref={fontInputRef} className="hidden" type="file" accept=".ttf,.otf,.woff,.woff2" multiple onChange={onAddFontFiles} />
              <div className="text-xs text-white/70 mt-2">
                {fonts.hasProjectRoot() ? 'Folder connected ✓' : 'Folder not connected'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md overflow-hidden">
          {list.filter((x) => x.id !== '__autosave__').length === 0 ? (
            <div className="text-center text-white text-sm py-6">No projects found on this device.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {list.filter((x) => x.id !== '__autosave__').map((p) => (
                <li key={p.id} className="py-3 px-4 flex items-center text-white">
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-xs text-white/70">{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ''}</span>
                  <button className="ml-auto px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openEditor(p.id)}>Open</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pickerOpen && (
        <Modal onClose={() => setPickerOpen(false)} maxWidth="max-w-xl" title="Open Project">
          <ul className="rounded-xl overflow-hidden border border-white/20">
            {list.map((p) => (
              <li key={p.id} className="border-b last:border-b-0 border-white/10">
                <button className="w-full py-3 px-4 text-center hover:bg-white/10 transition" onClick={() => { setPickerOpen(false); openEditor(p.id); }}>
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {newOpen && (
        <Modal onClose={() => setNewOpen(false)} title="Create / Duplicate Project">
          <div className="grid grid-cols-12 gap-3 items-center">
            <label className="col-span-3 text-sm">Project Name</label>
            <input className="col-span-9 rounded-md px-3 py-2 bg-white/90 text-gray-900 border border-white/40" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New project" />
            <label className="col-span-3 text-sm">Start From</label>
            <select className="col-span-9 rounded-md px-3 py-2 bg-white/90 text-gray-900 border border-white/40" value={startFrom} onChange={(e) => setStartFrom(e.target.value)}>
              <option value="blank">Blank</option>
              {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="px-3 py-1.5 rounded border border-white/30 bg-white/10 hover:bg-white/20" onClick={() => setNewOpen(false)}>Cancel</button>
            <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createNew}>Create</button>
          </div>
        </Modal>
      )}

      {exportOpen && (
        <Modal onClose={() => setExportOpen(false)} title="Export project as JSON">
          <select className="w-full rounded-md px-3 py-2 bg-white/90 text-gray-900 border border-white/40" value={exportPick} onChange={(e) => setExportPick(e.target.value)}>
            {list.filter((x) => x.id !== '__autosave__').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="mt-5 flex justify-end gap-2">
            <button className="px-3 py-1.5 rounded border border-white/30 bg-white/10 hover:bg-white/20" onClick={() => setExportOpen(false)}>Cancel</button>
            <button className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white" onClick={doExport} disabled={!exportPick}>Export JSON</button>
          </div>
        </Modal>
      )}
    </div>
  );
}