// src/utils/stickerSVG.js
export function stickerToSVG(sticker){
  const {
    x=0, y=0, w=100, h=100,
    rotate=0, flipH=false, flipV=false,
    type='image', src, text='', fontFamily='Inter', fontWeight=600, fontSize=24, fill='#000'
  } = sticker || {};
  const cx = x + w/2; const cy = y + h/2; const sx = flipH?-1:1; const sy = flipV?-1:1;
  if (type === 'image' && src){
    return `
<g transform="translate(${cx},${cy}) rotate(${rotate}) scale(${sx},${sy}) translate(${-w/2},${-h/2})">
  <image href="${src}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />
</g>`;
  }
  const esc = (s='')=> String(s).replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  return `
<g transform="translate(${cx},${cy}) rotate(${rotate}) scale(${sx},${sy}) translate(${-w/2},${-h/2})">
  <text x="${w/2}" y="${h/2}" text-anchor="middle" dominant-baseline="middle" font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${fontSize}" fill="${fill}">${esc(text)}</text>
</g>`;
}
