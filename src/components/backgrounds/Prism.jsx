// src/components/backgrounds/Prism.jsx
import { useEffect, useRef } from 'react';
import { Renderer, Triangle, Program, Mesh } from 'ogl';
import './Prism.css';

export default function Prism({
  className = '',
  height = 3.5,
  baseWidth = 5.5,
  animationType = 'rotate',
  glow = 0.50,
  offset = { x: 0, y: -3.0 },
  noise = 0.0,
  scale = 3.00,          // zoomed out
  hueShift = 0,
  colorFrequency = 1,
  hoverStrength = 2,
  inertia = 0.24,
  bloom = 1,
  suspendWhenOffscreen = false,
  timeScale = 0.5,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const H  = Math.max(0.001, height);
    const BW = Math.max(0.001, baseWidth);
    const BASE_HALF = BW * 0.5;
    const GLOW  = Math.max(0.0, glow);
    const NOISE = Math.max(0.0, noise);
    const offX  = offset?.x ?? 0;
    const offY  = offset?.y ?? 0;
    const SCALE = Math.max(0.001, scale);
    const HUE   = hueShift || 0;
    const CFREQ = Math.max(0.0, colorFrequency || 1);
    const BLOOM = Math.max(0.0, bloom || 1);
    const TS    = Math.max(0, timeScale || 1);
    const HOVSTR= Math.max(0, hoverStrength || 1);
    const INERT = Math.max(0, Math.min(1, inertia || 0.12));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const renderer = new Renderer({ dpr, alpha: true, antialias: false, premultipliedAlpha: true });
    const gl = renderer.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 0);

    Object.assign(gl.canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      pointerEvents: 'none',
    });
    container.appendChild(gl.canvas);

    const vertex = /* glsl */`
      attribute vec2 position;
      void main(){ gl_Position = vec4(position, 0.0, 1.0); }
    `;

    const fragment = /* glsl */`
      precision highp float;
      uniform vec2  iResolution;
      uniform float iTime;
      uniform float uHeight, uBaseHalf, uGlow, uNoise, uScale, uHueShift, uColorFreq, uBloom, uTimeScale;
      uniform mat3  uRot;
      uniform int   uUseBaseWobble;
      uniform vec2  uOffsetPx;
      uniform float uCenterShift, uInvBaseHalf, uInvHeight, uMinAxis, uPxScale;

      vec4 tanh4(vec4 x){ vec4 e2x = exp(2.0*x); return (e2x - 1.0) / (e2x + 1.0); }
      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453123); }

      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }
      float sdPyramidUpInv(vec3 p){
        float o = sdOctaAnisoInv(p);
        float h = -p.y;
        return max(o, h);
      }

      mat3 hueRotation(float a){
        float c=cos(a), s=sin(a);
        mat3 W = mat3(0.299,0.587,0.114, 0.299,0.587,0.114, 0.299,0.587,0.114);
        mat3 U = mat3(0.701,-0.587,-0.114, -0.299,0.413,-0.114, -0.300,-0.588,0.886);
        mat3 V = mat3(0.168,-0.331,0.500, 0.328,0.035,-0.500, -0.497,0.296,0.201);
        return W + U*c + V*s;
      }

      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5*iResolution.xy - uOffsetPx) * uPxScale;

        float z = 5.0, d = 0.0;
        vec3 p; vec4 o = vec4(0.0);

        float cf = uColorFreq;
        mat2 wob = mat2(1.0);
        if(uUseBaseWobble==1){
          float t = iTime * uTimeScale;
          float c0 = cos(t + 0.0), c1 = cos(t + 33.0), c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS=90;
        for(int i=0;i<STEPS;i++){
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p; q.y += uCenterShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * cf + vec4(0.0,1.0,2.0,3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        vec3 col = o.rgb;
        if (uNoise > 0.0) col += (rand(gl_FragCoord.xy + vec2(iTime)) - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        if(abs(uHueShift) > 0.0001){ col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0); }

        float a = clamp(max(max(col.r, col.g), col.b), 0.0, 1.0);
        gl_FragColor = vec4(col, a);
      }
    `;

    const geometry = new Triangle(gl);
    const iRes = new Float32Array(2);
    const offPx = new Float32Array(2);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: iRes },
        iTime: { value: 0 },
        uHeight: { value: H },
        uBaseHalf: { value: BASE_HALF },
        uUseBaseWobble: { value: 1 },
        uRot: { value: new Float32Array([1,0,0, 0,1,0, 0,0,1]) },
        uGlow: { value: GLOW },
        uOffsetPx: { value: offPx },
        uNoise: { value: NOISE },
        uScale: { value: SCALE },
        uHueShift: { value: HUE },
        uColorFreq: { value: CFREQ },
        uBloom: { value: BLOOM },
        uCenterShift: { value: H * 0.25 },
        uInvBaseHalf: { value: 1 / BASE_HALF },
        uInvHeight: { value: 1 / H },
        uMinAxis: { value: Math.min(BASE_HALF, H) },
        uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
        uTimeScale: { value: TS },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      iRes[0] = gl.drawingBufferWidth;
      iRes[1] = gl.drawingBufferHeight;
      const dprNow = Math.min(2, window.devicePixelRatio || 1);
      offPx[0] = offX * dprNow;
      offPx[1] = offY * dprNow;
      program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const rotBuf = new Float32Array(9);
    const setMat3 = (yawY, pitchX, rollZ, out) => {
      const cy=Math.cos(yawY),sy=Math.sin(yawY);
      const cx=Math.cos(pitchX),sx=Math.sin(pitchX);
      const cz=Math.cos(rollZ),sz=Math.sin(rollZ);
      const r00=cy*cz + sy*sx*sz, r01=-cy*sz + sy*sx*cz, r02=sy*cx;
      const r10=cx*sz,           r11=cx*cz,             r12=-sx;
      const r20=-sy*cz + cy*sx*sz, r21=sy*sz + cy*sx*cz, r22=cy*cx;
      out[0]=r00; out[1]=r10; out[2]=r20;
      out[3]=r01; out[4]=r11; out[5]=r21;
      out[6]=r02; out[7]=r12; out[8]=r22;
      return out;
    };

    let raf = 0;
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const stop  = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

    const rnd=Math.random;
    const wX=(0.3 + rnd()*0.6), wY=(0.2 + rnd()*0.7), wZ=(0.1 + rnd()*0.5);
    const phX=rnd()*Math.PI*2, phZ=rnd()*Math.PI*2;

    let yaw=0,pitch=0,roll=0, targetYaw=0,targetPitch=0;
    const lerp=(a,b,t)=>a+(b-a)*t;

    const pointer={x:0,y:0,inside:true};
    const onMove=(e)=>{
      const ww=Math.max(1,window.innerWidth), wh=Math.max(1,window.innerHeight);
      const nx=(e.clientX-ww*0.5)/(ww*0.5), ny=(e.clientY-wh*0.5)/(wh*0.5);
      pointer.x=Math.max(-1,Math.min(1,nx)); pointer.y=Math.max(-1,Math.min(1,ny)); pointer.inside=true;
    };
    const onLeave=()=>{ pointer.inside=false; };
    const onBlur =()=>{ pointer.inside=false; };

    let ptrHandler=null;
    if (animationType==='hover'){
      ptrHandler=(e)=>{ onMove(e); start(); };
      window.addEventListener('pointermove', ptrHandler, { passive:true });
      window.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onBlur);
      program.uniforms.uUseBaseWobble.value = 0;
    } else if (animationType==='3drotate'){
      program.uniforms.uUseBaseWobble.value = 0;
    } else {
      program.uniforms.uUseBaseWobble.value = 1;
    }

    const t0 = performance.now();
    const loop = (t)=>{
      gl.clear(gl.COLOR_BUFFER_BIT);
      const time = (t - t0) * 0.001;
      program.uniforms.iTime.value = time;

      if (animationType==='hover'){
        const maxPitch=0.6*HOVSTR, maxYaw=0.6*HOVSTR;
        targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
        targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
        yaw=lerp(yaw,targetYaw,INERT); pitch=lerp(pitch,targetPitch,INERT); roll=lerp(roll,0,0.1);
        program.uniforms.uRot.value = setMat3(yaw,pitch,roll,rotBuf);
      } else if (animationType==='3drotate'){
        const ts=time*TS; yaw=ts*wY; pitch=Math.sin(ts*wX+phX)*0.6; roll=Math.sin(ts*wZ+phZ)*0.5;
        program.uniforms.uRot.value = setMat3(yaw,pitch,roll,rotBuf);
      } else { rotBuf.set([1,0,0, 0,1,0, 0,0,1]); program.uniforms.uRot.value = rotBuf; }

      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };

    if (suspendWhenOffscreen){
      const io=new IntersectionObserver((entries)=>{ entries.some(e=>e.isIntersecting) ? start() : stop(); });
      io.observe(container); start(); container.__prismIO=io;
    } else { start(); }

    return () => {
      stop();
      if (suspendWhenOffscreen) { const io = container.__prismIO; if (io) io.disconnect(); delete container.__prismIO; }
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (gl.canvas.parentElement===container) container.removeChild(gl.canvas);
    };
  }, [
    height, baseWidth, animationType, glow, noise, offset?.x, offset?.y,
    scale, hueShift, colorFrequency, timeScale, hoverStrength, inertia, bloom, suspendWhenOffscreen
  ]);

  return <div className={`prism-container ${className}`} ref={containerRef} />;
}
