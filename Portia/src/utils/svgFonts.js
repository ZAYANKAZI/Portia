// src/utils/svgFonts.js
function extToMime(url) {
  const u = url.split('?')[0].split('#')[0].toLowerCase();
  if (u.endsWith('.woff2')) return 'font/woff2';
  if (u.endsWith('.woff')) return 'font/woff';
  if (u.endsWith('.ttf')) return 'font/ttf';
  if (u.endsWith('.otf')) return 'font/otf';
  return 'application/octet-stream';
}
async function fetchAsDataURL(url) {
  const r = await fetch(url, { mode: 'cors' });
  if (!r.ok) throw new Error('fetch failed ' + url);
  const buf = await r.arrayBuffer();
  const mime = extToMime(url);
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000; let bin = '';
  for (let i=0;i<bytes.length;i+=chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i,i+chunk));
  return `data:${mime};base64,${btoa(bin)}`;
}
function resolveUrl(base, href){ try { return new URL(href, base).toString(); } catch { return href; } }
async function inlineFontSrcUrls(cssText, baseHref){
  const urlRe = /url\(([^)]+)\)/g; const tasks=[]; const rep=new Map();
  cssText.replace(urlRe, (m,g1)=>{ let u=g1.trim().replace(/^['"]|['"]$/g,''); if(u.startsWith('data:')) return m; const abs=resolveUrl(baseHref||location.href,u); tasks.push((async()=>{ try{ const data=await fetchAsDataURL(abs); rep.set(m,`url('${data}')`);}catch{}})()); return m; });
  if (tasks.length) await Promise.allSettled(tasks);
  let out = cssText; for (const [from,to] of rep.entries()) out = out.split(from).join(to); return out;
}
export async function buildSVGFontCSS(){
  let combined = '';
  // Google Fonts links
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l=>l.href).filter(h=>/fonts\.googleapis\.com/i.test(h||''));
  for (const href of links){ try{ const r=await fetch(href,{mode:'cors'}); if(!r.ok) continue; let css=await r.text(); css=await inlineFontSrcUrls(css, href); combined += `\n/* GOOGLE: ${href} */\n`+css+"\n"; }catch{} }
  // same-origin @font-face
  for (const sheet of Array.from(document.styleSheets)){
    const href = sheet.href; const sameOrigin = !href || href.startsWith(location.origin); if(!sameOrigin) continue; let rules; try{ rules=sheet.cssRules; }catch{ continue; } if(!rules) continue; let buf=''; for(const rule of Array.from(rules)){ if(rule.type===CSSRule.FONT_FACE_RULE) buf += `\n${rule.cssText}`; }
    if (buf){ buf = await inlineFontSrcUrls(buf, href||location.href); combined += `\n/* LOCAL: ${href||'inline'} */\n`+buf+"\n"; }
  }
  return combined;
}
