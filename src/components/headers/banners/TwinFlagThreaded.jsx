import React from "react";

/**
 * Twin-Flag (Threaded) — single thread (concave chevrons on BOTH sides)
 * - Filled ribbon body with chevrons on both sides
 * - ONE inner “thread” with small apex gap
 *
 * props:
 *   fill        : ribbon color (#E13A2F)
 *   trim        : thread color (#C9D34B)
 *   threadWidth : stroke width of the thread
 *   offset      : inset of the thread from the outer edge
 *   apexGap     : small break around the middle apex
 *   notchDepth  : how far the chevron bites in from each side (px)
 *
 * NOTE:
 *   Radius is passed from HeaderBanner as the `radius` prop (independent from plate).
 *   We clip with a LEFT-ONLY rounded rectangle so the right chevrons remain sharp.
 */

const defaults = () => ({
  fill: "#E13A2F",
  trim: "#C9D34B",
  threadWidth: 5,
  offset: 10,
  apexGap: 8,
  notchDepth: 80,
});

// Build a path that only rounds the LEFT corners
function leftOnlyRoundedRectPath(w, h, r) {
  const rr = Math.max(0, Math.min(r || 0, Math.min(w, h) / 2));
  // M r,0 H w V h H r A r,r 0 0 1 0,h-r V r A r,r 0 0 1 r,0 Z
  return `M ${rr} 0 H ${w} V ${h} H ${rr} A ${rr} ${rr} 0 0 1 0 ${h - rr} V ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
}

// ---------- RENDERER ----------
function TwinFlagThreaded({ width, height, radius = 0, props = {} }) {
  const W = Math.max(120, Number(width || 600));
  const H = Math.max(60, Number(height || 110));
  const mid = H / 2;

  const {
    fill = "#E13A2F",
    trim = "#C9D34B",
    threadWidth = 5,
    offset = 10,
    apexGap = 8,
    notchDepth = Math.round(W * 0.12),
  } = props;

  // clamp + normalize
  const nd = Math.max(8, Math.min(W * 0.45, Number(notchDepth)));
  const off = Math.max(6, Math.min(Math.min(nd - 2, mid - 2), Number(offset)));
  const gap = Math.max(0, Math.min(mid - off - 2, Number(apexGap)));
  const tW = Math.max(1, Number(threadWidth));

  // outer ribbon polygon (using true notch vertices)
  const outerPath = `M0,0 L${W},0 L${W - nd},${mid} L${W},${H} L0,${H} L${nd},${mid} Z`;

  // helpers
  const lineFrom = (p1, p2) => {
    let a = p1.y - p2.y,
      b = p2.x - p1.x,
      c = p1.x * p2.y - p2.x * p1.y;
    const L = Math.hypot(a, b) || 1;
    return { a: a / L, b: b / L, c: c / L };
  };
  const evalLine = (L, p) => L.a * p.x + L.b * p.y + L.c;
  const offsetLine = (L, dist, insidePoint) => {
    const s = Math.sign(evalLine(L, insidePoint)) || 1; // move toward interior
    return { a: L.a, b: L.b, c: L.c - s * dist };
  };
  const xAtY = (L, y) => {
    const a = L.a || 1e-9;
    return -(L.b * y + L.c) / a;
  };

  const center = { x: W / 2, y: mid };

  // Offset the actual edges: top, bottom, and both chevron diagonals
  const L_t  = offsetLine(lineFrom({ x: 0, y: 0 },        { x: W,      y: 0   }), off, center);
  const L_b  = offsetLine(lineFrom({ x: W, y: H },        { x: 0,      y: H   }), off, center);
  const L_lu = offsetLine(lineFrom({ x: 0, y: 0 },        { x: nd,     y: mid }), off, center);
  const L_ld = offsetLine(lineFrom({ x: 0, y: H },        { x: nd,     y: mid }), off, center);
  const L_ru = offsetLine(lineFrom({ x: W, y: 0 },        { x: W - nd, y: mid }), off, center);
  const L_rd = offsetLine(lineFrom({ x: W - nd, y: mid }, { x: W,      y: H   }), off, center);

  const yTop = off, yBot = H - off;
  const LT = { x: xAtY(L_lu, yTop), y: yTop };
  const RT = { x: xAtY(L_ru, yTop), y: yTop };
  const RB = { x: xAtY(L_rd, yBot), y: yBot };
  const LB = { x: xAtY(L_ld, yBot), y: yBot };

  const yUp = mid - gap / 2;
  const yDn = mid + gap / 2;
  const Lu = { x: xAtY(L_lu, yUp), y: yUp };
  const Ld = { x: xAtY(L_ld, yDn), y: yDn };
  const Ru = { x: xAtY(L_ru, yUp), y: yUp };
  const Rd = { x: xAtY(L_rd, yDn), y: yDn };

  // left-only rounded clip, so right chevrons remain crisp
  const clipId = React.useId();
  const clipPathD = leftOnlyRoundedRectPath(W, H, radius);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clipPathD} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* ribbon body */}
        <path d={outerPath} fill={fill} />

        {/* single thread with uniform offset */}
        <path d={`M ${LT.x},${LT.y} H ${RT.x}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
        <path d={`M ${RB.x},${RB.y} H ${LB.x}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
        <path d={`M ${RT.x},${RT.y} L ${Ru.x},${Ru.y}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
        <path d={`M ${Rd.x},${Rd.y} L ${RB.x},${RB.y}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
        <path d={`M ${LT.x},${LT.y} L ${Lu.x},${Lu.y}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
        <path d={`M ${Ld.x},${Ld.y} L ${LB.x},${LB.y}`} fill="none" stroke={trim} strokeWidth={tW} strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------- STYLE PANEL (shows in HeaderPanel) ----------
function Panel({ value, onChange }) {
  const v = { ...defaults(), ...(value || {}) };

  const set = (k, map = (x) => x) => (e) => onChange({ ...v, [k]: map(e.target.value) });
  const toNum = (min, max) => (x) => {
    const n = Number(x);
    if (Number.isNaN(n)) return min ?? 0;
    const clamped = max != null ? Math.max(min ?? -Infinity, Math.min(max, n)) : Math.max(min ?? -Infinity, n);
    return clamped;
  };

  return (
    <div className="grid grid-cols-2 gap-2 items-center">
      <label className="text-sm text-gray-600">Fill</label>
      <input type="color" value={v.fill} onChange={set("fill")} />

      <label className="text-sm text-gray-600">Thread Colour</label>
      <input type="color" value={v.trim} onChange={set("trim")} />

      <label className="text-sm text-gray-600">Thread Width</label>
      <input
        type="number"
        className="border rounded px-2"
        min={1}
        max={16}
        value={v.threadWidth}
        onChange={set("threadWidth", toNum(1, 16))}
      />

      <label className="text-sm text-gray-600">Thread Offset</label>
      <input
        type="number"
        className="border rounded px-2"
        min={4}
        value={v.offset}
        onChange={set("offset", toNum(4))}
      />

      <label className="text-sm text-gray-600">Apex Gap</label>
      <input
        type="number"
        className="border rounded px-2"
        min={0}
        max={40}
        value={v.apexGap}
        onChange={set("apexGap", toNum(0, 40))}
      />

      <label className="text-sm text-gray-600">Notch Depth</label>
      <input
        type="number"
        className="border rounded px-2"
        min={8}
        value={v.notchDepth}
        onChange={set("notchDepth", toNum(8))}
      />
    </div>
  );
}

// single default export (module shape expected by headerRegistry)
export default { Render: TwinFlagThreaded, Panel, defaults };
