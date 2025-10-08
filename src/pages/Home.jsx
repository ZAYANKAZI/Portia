// File: src/pages/Home.jsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PreviewCanvas from '../components/PreviewCanvas';
import FormPanel from '../components/FormPanel';
import InlineEditLayer from '../components/InlineEditLayer';
import DebugDock from '../components/DebugDock';
import { toJpeg } from 'html-to-image';
import {
  exportToJPEG, exportExactSVG, exportExactPNG, exportSVG, exportSVGtoPNG,
} from '../utils/exportUtils';
import {
  initProjectStore, getProject, saveProject as saveProjectUnified,
  updateProjectMeta, deleteProject as deleteProjectUnified,
} from '../utils/projectStore';
import '../styles/form-dark.css';
import FlowLogger from '../utils/FlowLogger';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function Toast({ msg, onDone, ms = 1800 }) {
  useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t); }, [onDone, ms]);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
      <div className="px-4 py-2 rounded-md bg-black/80 text-white shadow">{msg}</div>
    </div>
  );
}

function Modal({ title, onClose, children, actions }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl text-gray-900">
        <div className="flex items-center mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="ml-auto px-2 py-1 text-sm rounded border" onClick={onClose}>✕</button>
        </div>
        <div className="mb-4">{children}</div>
        <div className="flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
}

const CUSTOM_FONTS = ['BernierDistressed', 'Alien-Encounters'];
const GOOGLE_FONTS = ['Poppins','Montserrat','Inter','Roboto','Lato','Oswald','Playfair Display'];
const GOOGLE_SET = new Set(GOOGLE_FONTS);
const FONT_OPTIONS = [...CUSTOM_FONTS, ...GOOGLE_FONTS];

function loadGoogleFont(name){
  if(!name) return;
  const fam = name.split(',')[0].trim();
  if(!GOOGLE_SET.has(fam)) return;
  const id = `gf-${fam.replace(/\s+/g,'-')}`;
  if(document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id; link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam)}:wght@400;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

function setByPath(obj, path, value) {
  if (!path) return;
  const tokens = [];
  String(path).replace(/[^.[\]]+|\[(\d+)\]/g, (m, idx) => tokens.push(idx !== undefined ? Number(idx) : m));
  let cur = obj;
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const seg = tokens[i];
    const nextIsIndex = typeof tokens[i + 1] === 'number';
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return;
      if (cur[seg] == null) cur[seg] = nextIsIndex ? [] : {};
      cur = cur[seg];
    } else {
      if (cur[seg] == null) cur[seg] = nextIsIndex ? [] : {};
      cur = cur[seg];
    }
  }
  const last = tokens[tokens.length - 1];
  if (typeof last === 'number') {
    if (!Array.isArray(cur)) return;
    cur[last] = value;
  } else {
    cur[last] = value;
  }
}

function normalizePath(section, rawPath) {
  if (!rawPath) return rawPath;
  const hasItems = Array.isArray(section.items);
  const hasProducts = Array.isArray(section.products);
  const p = String(rawPath);
  const prefer = hasItems ? 'items' : (hasProducts ? 'products' : 'items');
  const other  = prefer === 'items' ? 'products' : 'items';
  if (!section[prefer]) section[prefer] = [];
  if (p.startsWith(prefer + '.') || p.startsWith(prefer + '[')) return p;
  if (p.startsWith(other + '.') || p.startsWith(other + '[')) return p.replace(new RegExp('^' + other), prefer);
  return p;
}

export default function Home(){
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('pid');

  const [showGrid, setShowGrid] = useState(true);
  const [inlineEnabled, setInlineEnabled] = useState(true);
  const [debugOpen, setDebugOpen] = useState(false);

  const [entry, setEntry] = useState(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [data, setData] = useState({
    screens: [{ id:'screen-1', name:'Screen 1', background:'#000', sections:[] }],
    activeScreenId: 'screen-1',
  });
  const [dirty, setDirty] = useState(false);

  // NEW: track if user has interacted, so beforeunload prompt is allowed
  const [hadUserGesture, setHadUserGesture] = useState(false);

  const [revMap, setRevMap] = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingName, setPendingName] = useState('Untitled Project');
  const [toast, setToast] = useState('');

  const previewWinRef = useRef(null);
  const debounceRef = useRef();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formZoom, setFormZoom] = useState(1);
  const [uiScale, setUiScale] = useState(1);
  const BASE_SIDEBAR = 440;
  const sidebarWidth = sidebarOpen ? Math.round(BASE_SIDEBAR * clamp(uiScale, 0.9, 1.2)) : 48;

  const [leftPan, setLeftPan] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);

  useEffect(() => {
    FlowLogger.enable(true);
    FlowLogger.attachGlobalErrorHandlers();
    (async () => {
      await initProjectStore();
      if (pid) {
        const row = await getProject(pid);
        if (row) {
          setEntry({ id: row.id, name: row.name });
          setProjectName(row.name);
          setPendingName(row.name);
          setData(row.data || data);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { const t=setTimeout(()=> setDirty(true), 100); return ()=>clearTimeout(t); }, [data]);

  // NEW: record first real user gesture to satisfy Chrome 'beforeunload' policy
  useEffect(() => {
    const mark = () => setHadUserGesture(true);
    const opts = { once: true, passive: true };
    window.addEventListener('pointerdown', mark, opts);
    window.addEventListener('touchstart', mark, opts);
    window.addEventListener('wheel', mark, opts);
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('pointerdown', mark, opts);
      window.removeEventListener('touchstart', mark, opts);
      window.removeEventListener('wheel', mark, opts);
      window.removeEventListener('keydown', mark, { once: true });
    };
  }, []);

  // UPDATED: only show beforeunload prompt after user interacted + only on top window
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      if (!hadUserGesture) return;           // avoids the Chrome/Edge intervention warning
      if (window.top !== window.self) return; // avoid if running inside an iframe/preview
      e.preventDefault();
      e.returnValue = ''; // required for the prompt to appear
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, hadUserGesture]);

  useEffect(() => {
    const calc = () => {
      const h = window.innerHeight || 900;
      const s = clamp(h / 1000, 0.85, 1.15);
      setUiScale(+s.toFixed(3));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const renderCapture = async () => {
    const node = document.getElementById('preview-capture');
    if (!node) throw new Error('#preview-capture not found');
    const wrap = document.getElementById('preview-zoom-wrap');
    const prevZoom = wrap?.style?.zoom;
    if (wrap) wrap.style.zoom = '1';
    try {
      if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
      return await toJpeg(node, { quality: 0.95, pixelRatio: 1, cacheBust: true, style: { transform: 'none', transformOrigin: 'top left' } });
    } finally { if (wrap) wrap.style.zoom = prevZoom || ''; }
  };

  const withNeutralizedZoom = async (fn) => {
    const wrap = document.getElementById('preview-zoom-wrap');
    const prevZoom = wrap?.style?.zoom;
    if (wrap) wrap.style.zoom = '1';
    try { await fn(); } finally { if (wrap) wrap.style.zoom = prevZoom || ''; }
  };

  const previewWinRefUpdate = async () => {
    const w = previewWinRef.current; if (!w || w.closed) return;
    try {
      const dataUrl = await renderCapture();
      if (!w.closed) w.document.body.innerHTML = `<img src="${dataUrl}" alt="preview"/>`;
    } catch {}
  };

  const openPreviewWindow = async () => {
    let w = previewWinRef.current;
    if (!w || w.closed) {
      w = window.open('about:blank','screenPreview');
      if (!w) return alert('Please allow popups for this site.');
      w.document.write('<html><body style="margin:0;background:#111;display:grid;place-items:center"><div style="color:#bbb">Rendering…</div></body></html>');
      previewWinRef.current = w;
    }
    await previewWinRefUpdate();
  };

  useEffect(() => {
    const w = previewWinRef.current; if(!w || w.closed) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(previewWinRefUpdate, 250);
    return () => clearTimeout(debounceRef.current);
  }, [data]);

  const saveProject = async () => {
    try {
      const saved = await saveProjectUnified(entry?.id, projectName, data);
      setEntry({ id: saved.id, name: saved.name });
      setProjectName(saved.name);
      setDirty(false);
      setToast('Project saved');
    } catch { setToast('Save failed'); }
  };

  const renameProject = async () => {
    try {
      const rec = await updateProjectMeta(entry.id, { name: (pendingName||'Untitled Project').trim() });
      setEntry({ id: rec.id, name: rec.name });
      setProjectName(rec.name);
      setShowRenameModal(false);
      setToast('Project renamed');
    } catch { setToast('Rename failed'); }
  };

  const deleteProject = async () => {
    try { await deleteProjectUnified(entry?.id); setShowDeleteModal(false); navigate('/'); }
    catch { setToast('Delete failed'); }
  };

  const activeScreen = data.screens.find(s => s.id === data.activeScreenId) || data.screens[0];
  const activeIndex = data.screens.findIndex(s => s.id === (activeScreen?.id));

  const onEditSection = (id, key, val) => {
    setData(prev => {
      const next = { ...prev, screens: prev.screens.map(sc => {
        if (sc.id !== prev.activeScreenId) return sc;
        return {
          ...sc,
          sections: sc.sections.map(sec => {
            if (sec.id !== id) return sec;
            const normPath = normalizePath(sec, key);
            const clone = { ...sec };
            setByPath(clone, normPath, val);
            return clone;
          })
        };
      })};
      return next;
    });
    setRevMap(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  useEffect(() => {
    const el = document.getElementById('preview-zoom-wrap');
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setCanvasZoom(z => clamp(+(z * factor).toFixed(3), 0.25, 3));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const fitWidth = () => {
    const wrap = document.getElementById('preview-zoom-wrap');
    const node = document.getElementById('preview-capture');
    if (!wrap || !node) return;
    const pad = 40;
    const scale = (wrap.clientWidth - pad) / node.offsetWidth;
    setCanvasZoom(clamp(+scale.toFixed(3), 0.1, 5));
  };

  const fitScreen = () => {
    const wrap = document.getElementById('preview-zoom-wrap');
    const node = document.getElementById('preview-capture');
    if (!wrap || !node) return;
    const pad = 40;
    const sx = (wrap.clientWidth - pad) / node.offsetWidth;
    const sy = (wrap.clientHeight - pad) / node.offsetHeight;
    const scale = Math.min(sx, sy);
    setCanvasZoom(clamp(+scale.toFixed(3), 0.1, 5));
  };

  const effectiveFormZoom = formZoom * uiScale;

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <div className="transition-all duration-200 bg-[#252526] border-r border-gray-700 flex flex-col min-h-0 h-full" style={{ width: sidebarWidth }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-600">
          {sidebarOpen ? '✕' : '☰'}
        </button>
        {sidebarOpen && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700" style={{ fontSize: `${uiScale*100}%` }}>
              <button onClick={() => setFormZoom(z => Math.max(0.75, z - 0.1))} className="px-2 py-1 bg-gray-800 text-gray-200 rounded">−</button>
              <input type="range" min="0.75" max="1.6" step="0.05" value={formZoom} onChange={(e)=>setFormZoom(parseFloat(e.target.value))}/>
              <button onClick={() => setFormZoom(z => Math.min(1.6, z + 0.1))} className="px-2 py-1 bg-gray-800 text-gray-200 rounded">＋</button>
              <button onClick={()=>setFormZoom(1)} className="ml-2 px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded">100%</button>
            </div>
            <div className="form-scroll flex-1 min-h-0 overflow-y-scroll overflow-x-auto p-3" style={{ fontSize: `${effectiveFormZoom * 100}%` }}>
              <div className="ui-dark">
                <FormPanel
                  data={data}
                  setData={setData}
                  fontOptions={[...FONT_OPTIONS]}
                  loadGoogleFont={loadGoogleFont}
                  revMap={revMap}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0" style={{ fontSize: `${uiScale*100}%` }}>
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-[#252526] text-gray-200">
          <h1 className="text-lg font-bold flex-1 truncate">{projectName}</h1>
          <button className="px-2 py-1 rounded border bg-gray-700 text-white" onClick={saveProject}>💾 Save</button>
          <button className="px-2 py-1 rounded border bg-gray-700 text-white" onClick={()=>setShowRenameModal(true)}>✎ Rename</button>
          <button className="px-2 py-1 rounded border bg-gray-700 text-white" onClick={()=>setShowDeleteModal(true)}>🗑 Delete</button>
          <button className="px-2 py-1 rounded border bg-gray-700 text-white" onClick={()=> (dirty ? setShowExitModal(true) : navigate('/'))}>⟵ Back</button>
        </div>

        {/* Tools row */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
          <button onClick={() => setLeftPan(v => !v)} className={`px-2 py-1 text-xs rounded ${leftPan ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>🖐 Hand</button>
          <button onClick={() => setShowGrid(v => !v)} className={`px-2 py-1 text-xs rounded ${showGrid ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Grid</button>
          <button onClick={() => setInlineEnabled(v => !v)} className={`px-2 py-1 text-xs rounded ${inlineEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Inline</button>
          <button onClick={() => setDebugOpen(v => !v)} className={`px-2 py-1 text-xs rounded ${debugOpen ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Debug</button>

          {/* Canvas Zoom */}
          <div className="ml-6 flex items-center gap-2">
            <span className="text-xs text-gray-400">Canvas</span>
            <button onClick={() => setCanvasZoom(z => clamp(+(z - 0.1).toFixed(2), 0.25, 3))} className="px-2 py-1 text-xs rounded bg-gray-700">−</button>
            <input type="range" min="0.25" max="3" step="0.05" value={canvasZoom} onChange={(e)=>setCanvasZoom(parseFloat(e.target.value))}/>
            <button onClick={() => setCanvasZoom(z => clamp(+(z + 0.1).toFixed(2), 0.25, 3))} className="px-2 py-1 text-xs rounded bg-gray-700">＋</button>
            <button onClick={() => setCanvasZoom(1)} className="px-2 py-1 text-xs rounded bg-gray-700">100%</button>
            <button onClick={fitWidth} className="ml-2 px-2 py-1 text-xs rounded bg-gray-700">Fit Width</button>
            <button onClick={fitScreen} className="px-2 py-1 text-xs rounded bg-gray-700">Fit Screen</button>
          </div>

          <div className="ml-auto">
            <button onClick={openPreviewWindow} className="px-3 py-1.5 rounded-md border bg-gray-700 text-white">Open Preview</button>
          </div>
        </div>

        {/* Export toolbar */}
        <div className="px-4 py-3 bg-[#1f1f1f] border-b border-gray-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => withNeutralizedZoom(() => exportToJPEG('preview-capture','screen-1080p.jpg',1))}
            className="px-3 py-1.5 rounded-md text-white bg-green-600"
          >
            Export Preview (JPG)
          </button>
          <button
            onClick={() => withNeutralizedZoom(() => exportExactPNG('preview-capture','screen-ultra.png',6))}
            className="px-3 py-1.5 rounded-md text-white bg-indigo-700"
          >
            Export Ultra-PNG (Exact 6×)
          </button>
          <button
            onClick={() => withNeutralizedZoom(() => exportExactSVG('preview-capture','screen-exact.svg'))}
            className="px-3 py-1.5 rounded-md text-white bg-purple-600"
          >
            Export SVG (Exact)
          </button>
          <button
            onClick={() => withNeutralizedZoom(() => exportSVG({ screens: data.screens, activeIndex }, 'screen.svg'))}
            className="px-3 py-1.5 rounded-md text-white bg-amber-600"
          >
            Export SVG (Vector)
          </button>
          <button
            onClick={() => withNeutralizedZoom(() => exportSVGtoPNG({ screens: data.screens, activeIndex }, 6, 'screen-ultra-vector.png', 'preview-capture'))}
            className="px-3 py-1.5 rounded-md text-white bg-rose-700"
          >
            Export PNG (Vector 6×)
          </button>
        </div>

        {/* Working Area */}
        <div className="flex-1 min-w-0 min-h-0">
          <div
            id="preview-zoom-wrap"
            style={{ width: '100%', height: '100%', overflow: 'auto', display: 'grid', placeItems: 'center', zoom: canvasZoom }}
          >
            <PreviewCanvas
              data={activeScreen}
              showGrid={showGrid}
              captureId="preview-capture"
              leftDragPan={leftPan}
              onDragSection={(id,x,y) => setData(prev => ({
                ...prev,
                screens: prev.screens.map(sc =>
                  sc.id !== prev.activeScreenId ? sc : {
                    ...sc,
                    sections: sc.sections.map(s => s.id === id ? { ...s, x, y } : s)
                  }
                )
              }))}
              onDragSticker={(sid,tid,x,y)=> setData(prev=>({
                ...prev,
                screens: prev.screens.map(sc => sc.id!==prev.activeScreenId ? sc : {
                  ...sc,
                  sections: sc.sections.map(s => s.id!==sid ? s : {
                    ...s,
                    stickers: (s.stickers||[]).map(st => st.id===tid ? { ...st, x, y } : st)
                  })
                })
              }))}
              onResizeSticker={(sid,tid,w,h)=> setData(prev=>({
                ...prev,
                screens: prev.screens.map(sc => sc.id!==prev.activeScreenId ? sc : {
                  ...sc,
                  sections: sc.sections.map(s => s.id!==sid ? s : {
                    ...s,
                    stickers: (s.stickers||[]).map(st => st.id===tid ? { ...st, w, h } : st)
                  })
                })
              }))}
              onRotateSticker={(sid,tid,rotate)=> setData(prev=>({
                ...prev,
                screens: prev.screens.map(sc => sc.id!==prev.activeScreenId ? sc : {
                  ...sc,
                  sections: sc.sections.map(s => s.id!==sid ? s : {
                    ...s,
                    stickers: (s.stickers||[]).map(st => st.id===tid ? { ...st, rotate } : st)
                  })
                })
              }))}
              onMovePriceFlag={(sectionId,offX,offY)=> setData(prev=>({
                ...prev,
                screens: prev.screens.map(sc => sc.id!==prev.activeScreenId ? sc : {
                  ...sc,
                  sections: sc.sections.map(s => s.id===sectionId ? { ...s, priceFlagOffsetX: offX, priceFlagOffsetY: offY } : s)
                })
              }))}
              onEditSection={(sid, path, value) => onEditSection(sid, path, value)}
            />

            <InlineEditLayer
              enabled={inlineEnabled}
              captureId="preview-capture"
              screen={activeScreen}
              onCommit={(sid, path, value) => onEditSection(sid, path, value)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRenameModal && (
        <Modal
          title="Rename Project"
          onClose={()=>setShowRenameModal(false)}
          actions={<><button onClick={()=>setShowRenameModal(false)}>Cancel</button><button onClick={renameProject} className="bg-blue-600 text-white px-3 py-1 rounded">Rename</button></>}
        >
          <input type="text" className="border rounded w-full px-2 py-1" value={pendingName} onChange={(e)=>setPendingName(e.target.value)} />
        </Modal>
      )}
      {showDeleteModal && (
        <Modal
          title="Delete Project?"
          onClose={()=>setShowDeleteModal(false)}
          actions={<><button onClick={()=>setShowDeleteModal(false)}>Cancel</button><button onClick={deleteProject} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button></>}
        >
          This will permanently remove the project.
        </Modal>
      )}
      {showExitModal && (
        <Modal
          title="Leave Editor?"
          onClose={()=>setShowExitModal(false)}
          actions={<><button onClick={()=>{ setShowExitModal(false); navigate('/'); }}>Discard</button><button onClick={()=>{ saveProject(); navigate('/'); }} className="bg-blue-600 text-white px-3 py-1 rounded">Save & Exit</button></>}
        >
          You have unsaved changes.
        </Modal>
      )}
      {toast && <Toast msg={toast} onDone={()=>setToast('')} />}

      <DebugDock open={debugOpen} onClose={()=>setDebugOpen(false)} />
    </div>
  );
}
