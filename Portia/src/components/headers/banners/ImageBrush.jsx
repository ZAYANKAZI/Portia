// src/components/headers/banners/ImageBrush.jsx
import React from "react";
import { fileToDataURL } from "../../../utils/fileUtils";

/**
 * ImageBrush — single-image banner with Lab recolor to a Target Color.
 * - ONE image (img)
 * - Target color (hex): remaps brush hue/chroma toward this color
 * - Strength (0–100%): blend amount of recolor vs original
 * - White protect (88–99%): preserve near-white paper/highlights
 * - Finish: natural | glossy | matte (with strength)
 * - Vibrance, Depth (S-curve), Clarity (micro-contrast), Warm/Cool bias
 * - TitleShiftX: move title left/right (applied by HeaderBanner)
 */
const defaults = () => ({
  img: "",

  targetColor: "#FE8F8D",
  strength: 100,      // %
  whiteProtect: 94,   // %
  finish: "glossy",   // "none" | "glossy" | "matte"
  finishStrength: 65, // %

  vibrance: 45,       // %
  depth: 30,          // %
  clarity: 25,        // %
  warm: 0,            // -50 .. +50

  titleShiftX: 0,
});

function Render({ width, height, radius, props = {} }) {
  const p = { ...defaults(), ...props };
  const [url, setUrl] = React.useState("");
  const workRef = React.useRef({ im: null, orig: null, w: 0, h: 0 });

  // --- load image once ---
  React.useEffect(() => {
    if (!p.img) { setUrl(""); return; }
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      const w = im.naturalWidth || im.width;
      const h = im.naturalHeight || im.height;
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      cx.drawImage(im, 0, 0, w, h);
      const orig = cx.getImageData(0, 0, w, h);
      workRef.current = { im, orig, w, h };
      // first render with current controls
      setUrl(recolorToDataURL(orig, p));
    };
    im.src = p.img;
  }, [p.img]);

  // --- recompute on param change ---
  React.useEffect(() => {
    const { orig } = workRef.current;
    if (!orig) return;
    setUrl(recolorToDataURL(orig, p));
  }, [
    p.targetColor, p.strength, p.whiteProtect,
    p.finish, p.finishStrength,
    p.vibrance, p.depth, p.clarity, p.warm
  ]);

  return (
    <div
      style={{
        width, height, position: "relative", overflow: "hidden",
        borderTopLeftRadius: radius, borderTopRightRadius: radius,
      }}
    >
      {url ? (
        <img
          src={url}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      ) : null}
    </div>
  );
}

function Panel({ value = {}, onChange }) {
  const v = { ...defaults(), ...value };
  const set = (patch) => onChange?.({ ...v, ...patch });
  const setNum = (key, { min = -Infinity, max = Infinity } = {}) => (e) => {
    const n = Number(e.target.value);
    set({ [key]: Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0)) });
  };
  const pickImage = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataURL(f);
    set({ img: dataUrl });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 items-center">
        <label className="text-sm text-gray-600">Header Image</label>
        <input type="file" accept="image/*" onChange={pickImage} />
      </div>

      <div className="grid grid-cols-2 gap-2 items-center">
        <label className="text-sm text-gray-600">Target Color</label>
        <input type="color" value={v.targetColor} onChange={(e) => set({ targetColor: e.target.value })} />

        <label className="text-sm text-gray-600">Strength (%)</label>
        <input type="number" className="border rounded px-2" min={0} max={100} value={v.strength} onChange={setNum("strength", { min: 0, max: 100 })} />

        <label className="text-sm text-gray-600">White Protect (%)</label>
        <input type="number" className="border rounded px-2" min={88} max={99} value={v.whiteProtect} onChange={setNum("whiteProtect", { min: 88, max: 99 })} />

        <label className="text-sm text-gray-600">Finish</label>
        <select className="border rounded px-2" value={v.finish} onChange={(e) => set({ finish: e.target.value })}>
          <option value="none">Natural</option>
          <option value="glossy">Glossy</option>
          <option value="matte">Matte</option>
        </select>

        <label className="text-sm text-gray-600">Finish Strength (%)</label>
        <input type="number" className="border rounded px-2" min={0} max={100} value={v.finishStrength} onChange={setNum("finishStrength", { min: 0, max: 100 })} />

        <label className="text-sm text-gray-600">Vibrance (%)</label>
        <input type="number" className="border rounded px-2" min={0} max={100} value={v.vibrance} onChange={setNum("vibrance", { min: 0, max: 100 })} />

        <label className="text-sm text-gray-600">Depth (%)</label>
        <input type="number" className="border rounded px-2" min={0} max={100} value={v.depth} onChange={setNum("depth", { min: 0, max: 100 })} />

        <label className="text-sm text-gray-600">Clarity (%)</label>
        <input type="number" className="border rounded px-2" min={0} max={100} value={v.clarity} onChange={setNum("clarity", { min: 0, max: 100 })} />

        <label className="text-sm text-gray-600">Warm / Cool</label>
        <input type="number" className="border rounded px-2" min={-50} max={50} value={v.warm} onChange={setNum("warm", { min: -50, max: 50 })} />

        <label className="text-sm text-gray-600">Title Offset X (px)</label>
        <input type="number" className="border rounded px-2" min={-400} max={400} value={v.titleShiftX} onChange={setNum("titleShiftX", { min: -400, max: 400 })} />
      </div>
    </div>
  );
}

export default { Render, Panel, defaults };

/* -------------------- Recolor engine (Lab) -------------------- */
function recolorToDataURL(orig, p) {
  const { width: W, height: H, data: src } = orig;

  const targetLab = hexToLab(p.targetColor);
  const tHue = Math.atan2(targetLab.b, targetLab.a);
  const tChroma = Math.hypot(targetLab.a, targetLab.b);

  // sample dominant hue/chroma from image
  let sumL = 0, sumX = 0, sumY = 0, sumC = 0, n = 0;
  const step = Math.max(1, Math.floor(Math.sqrt((src.length / 4) / 50000)));
  for (let i = 0; i < src.length; i += 4 * step) {
    if (src[i + 3] < 8) continue;
    const lab = rgb2lab(src[i] / 255, src[i + 1] / 255, src[i + 2] / 255);
    const C = Math.hypot(lab.a, lab.b);
    if (lab.L > 96 && C < 8) continue; // protect near white
    if (C < 5) continue;               // ignore very gray
    sumL += lab.L; sumC += C; n++;
    const h = Math.atan2(lab.b, lab.a);
    sumX += Math.cos(h); sumY += Math.sin(h);
  }
  const domL = n ? (sumL / n) : 50;
  const domC = n ? (sumC / n) : 20;
  const domHue = Math.atan2(sumY, sumX);

  // mapping params
  let dH = tHue - domHue;
  // warm/cool bias: ±12°
  dH += (Number(p.warm) / 50) * (12 * Math.PI / 180);
  const cScale = (tChroma > 1e-3 && domC > 1e-3) ? Math.pow(tChroma / domC, 0.9) : 1;

  const whiteCut = Number(p.whiteProtect);
  const kBlend = Number(p.strength) / 100;

  const fin = p.finish;
  const fAmt = Number(p.finishStrength) / 100;
  const vibAmt = Number(p.vibrance) / 100;
  const depthAmt = Number(p.depth) / 100;
  const clarAmt = Number(p.clarity) / 100;

  const cosH = Math.cos(dH), sinH = Math.sin(dH);

  const Larr = new Float32Array(W * H);
  const Aarr = new Float32Array(W * H);
  const Barr = new Float32Array(W * H);

  const pastel = clamp(targetLab.L / 100, 0, 1);

  for (let pidx = 0, i = 0; pidx < Larr.length; pidx++, i += 4) {
    const a8 = src[i + 3];
    if (a8 === 0) { Larr[pidx] = Aarr[pidx] = Barr[pidx] = 0; continue; }

    const lab = rgb2lab(src[i] / 255, src[i + 1] / 255, src[i + 2] / 255);
    const C0 = Math.hypot(lab.a, lab.b);

    // paper protect
    if (lab.L >= whiteCut && C0 < 12) {
      Larr[pidx] = lab.L; Aarr[pidx] = lab.a; Barr[pidx] = lab.b; continue;
    }

    // hue rotate + chroma scale toward target
    let a = lab.a * cosH - lab.b * sinH;
    let b2 = lab.a * sinH + lab.b * cosH;
    if (cScale !== 1) { a *= cScale; b2 *= cScale; }

    // lift toward target lightness a bit (rolled off near whites)
    const lift = Math.max(0, targetLab.L - domL);
    let L = clamp(lab.L + 0.85 * lift * (1 - smoothstep(whiteCut - 8, 100, lab.L)), 0, 100);

    // Finish
    if (fin === "glossy" && fAmt > 0) {
      const bright = smoothstep(0.60, 0.98, L / 100);
      const x = (pidx % W) / (W - 1);
      const dir = Math.pow(smoothstep(0.58, 1.00, x), 1.1);
      const sheen = clamp((bright * 0.85 + dir * 0.35) * fAmt, 0, 1);
      L = clamp(L + 28 * sheen, 0, 100);
      const Cnow = Math.hypot(a, b2);
      const Cboost = Cnow * (1 + 0.55 * sheen) * (1 + 0.50 * sheen * pastel) + 6 * sheen;
      const h = Math.atan2(b2, a);
      a = Cboost * Math.cos(h); b2 = Cboost * Math.sin(h);
    } else if (fin === "matte" && fAmt > 0) {
      const Ln = L / 100;
      const liftDn = Ln + 0.18 * fAmt * (1 - Ln);
      const rollHi = liftDn - 0.14 * fAmt * Math.max(0, liftDn - 0.75);
      L = clamp(rollHi * 100, 0, 100);
      a *= (1 - 0.35 * fAmt); b2 *= (1 - 0.35 * fAmt);
    }

    // Vibrance (push chroma in mid-tones)
    if (vibAmt > 0) {
      const Ln = L / 100;
      const mid = smoothstep(0.12, 0.88, Ln) * (1 - smoothstep(0.65, 0.97, Ln));
      const extra = 0.6 * pastel;
      const mult = 1 + (vibAmt * (0.7 + extra)) * mid;
      const C = Math.hypot(a, b2);
      const h = Math.atan2(b2, a);
      const Cnew = C * mult;
      a = Cnew * Math.cos(h); b2 = Cnew * Math.sin(h);
    }

    Larr[pidx] = L; Aarr[pidx] = a; Barr[pidx] = b2;
  }

  // Depth S-curve on L*
  if (depthAmt > 0) {
    for (let pidx = 0; pidx < Larr.length; pidx++) {
      const L = Larr[pidx] / 100, t = L - 0.5;
      const out = L + depthAmt * (t - t * t * t);
      Larr[pidx] = clamp(out * 100, 0, 100);
    }
  }

  // Clarity: small high-pass on L*
  if (clarAmt > 0) {
    const r = 2, tmp = new Float32Array(W * H), blur = new Float32Array(W * H);
    // horizontal blur
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) {
        let sum = 0, count = 0;
        for (let k = -r; k <= r; k++) {
          const xx = Math.min(W - 1, Math.max(0, x + k));
          sum += Larr[row + xx]; count++;
        }
        tmp[row + x] = sum / count;
      }
    }
    // vertical blur
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let sum = 0, count = 0;
        for (let k = -r; k <= r; k++) {
          const yy = Math.min(H - 1, Math.max(0, y + k));
          sum += tmp[yy * W + x]; count++;
        }
        blur[y * W + x] = sum / count;
      }
    }
    // high-pass add
    const amt = 0.9 * clarAmt;
    for (let pidx = 0; pidx < Larr.length; pidx++) {
      const hp = Larr[pidx] - blur[pidx];
      Larr[pidx] = clamp(Larr[pidx] + amt * hp, 0, 100);
    }
  }

  // To sRGB + Strength blend
  const out = new ImageData(W, H);
  const dst = out.data;
  for (let pidx = 0, i = 0; pidx < Larr.length; pidx++, i += 4) {
    const rgbNew = lab2rgb(Larr[pidx], Aarr[pidx], Barr[pidx]);
    const r0 = src[i] / 255, g0 = src[i + 1] / 255, b0 = src[i + 2] / 255;
    const k = kBlend;
    dst[i] = Math.round(255 * (r0 + (rgbNew.r - r0) * k));
    dst[i + 1] = Math.round(255 * (g0 + (rgbNew.g - g0) * k));
    dst[i + 2] = Math.round(255 * (b0 + (rgbNew.b - b0) * k));
    dst[i + 3] = src[i + 3];
  }

  // encode
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  cv.getContext("2d").putImageData(out, 0, 0);
  return cv.toDataURL("image/png");
}

/* ---- color math: sRGB D65 <-> Lab ---- */
function srgbToLinear(u){ return (u<=0.04045)? u/12.92 : Math.pow((u+0.055)/1.055, 2.4); }
function linearToSrgb(u){ return (u<=0.0031308)? 12.92*u : 1.055*Math.pow(u,1/2.4)-0.055; }
function rgb2lab(r,g,b){
  r=srgbToLinear(r); g=srgbToLinear(g); b=srgbToLinear(b);
  const X=r*0.4124564 + g*0.3575761 + b*0.1804375;
  const Y=r*0.2126729 + g*0.7151522 + b*0.0721750;
  const Z=r*0.0193339 + g*0.1191920 + b*0.9503041;
  const xr=X/0.95047, yr=Y/1.00000, zr=Z/1.08883;
  const f=t=>(t>0.008856)? Math.cbrt(t) : (7.787*t + 16/116);
  const fx=f(xr), fy=f(yr), fz=f(zr);
  return { L:116*fy-16, a:500*(fx-fy), b:200*(fy-fz) };
}
function lab2rgb(L,a,b){
  const fy=(L+16)/116, fx=fy + a/500, fz=fy - b/200;
  const fInv=t=>{ const t3=t*t*t; return (t3>0.008856)? t3 : (t - 16/116)/7.787; };
  const xr=fInv(fx), yr=fInv(fy), zr=fInv(fz);
  let rl= 3.2404542*xr -1.5371385*yr -0.4985314*zr;
  let gl=-0.9692660*xr +1.8760108*yr +0.0415560*zr;
  let bl= 0.0556434*xr -0.2040259*yr +1.0572252*zr;
  rl=linearToSrgb(rl); gl=linearToSrgb(gl); bl=linearToSrgb(bl);
  return { r:clamp(rl,0,1), g:clamp(gl,0,1), b:clamp(bl,0,1) };
}
function hexToLab(hex){
  const parts = hex.replace('#','').match(/.{1,2}/g) || ['00','00','00'];
  return rgb2lab(parseInt(parts[0],16)/255, parseInt(parts[1],16)/255, parseInt(parts[2],16)/255);
}
function clamp(x,min,max){ return Math.max(min, Math.min(max, x)); }
function smoothstep(e0,e1,x){ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
