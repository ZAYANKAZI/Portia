// src/svg/MenuCardSVG.jsx
export default function MenuCardSVG({ section }) {
  const {
    w = 820, h = 620, radius = 18,
    padX = 28, padY = 22,
    contentTopPad = 0,
    cardBg = '#ffffff',
    cardBgImage, cardBgImage1, cardBgImage2,
    cardBg1Alpha = 1, cardBg2Alpha = 1,
    header = {},
    titleFont = 'Poppins',
    bodyFont = 'Inter',
    nameColor = '#111', nameSize = 24,
    descColor = '#444', descSize = 18,
    allergenColor = '#2aa43a', allergenSize = 14,
    items = [],
  } = section;

  const headerH = Math.max(60, header.reservedHeight ?? 100);
  const headerFill = header?.props?.fill || '#12202f';
  const headerText = header?.props?.label || header?.props?.text || 'Menu';
  const headerTextColor = header?.props?.textColor || '#fff';

  const bgImgs = [
    cardBgImage || cardBgImage1 ? { href: (cardBgImage || cardBgImage1), alpha: cardBg1Alpha } : null,
    cardBgImage2 ? { href: cardBgImage2, alpha: cardBg2Alpha } : null,
  ].filter(Boolean);

  const lines = items || [];

  return `
  <g>
    <defs>
      <clipPath id="cardClip"><rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" /></clipPath>
    </defs>
    <g clip-path="url(#cardClip)">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${cardBg}" />
      ${bgImgs.map((im, i) =>
        `<image href="${im.href}" x="0" y="0" width="${w}" height="${h}" opacity="${im.alpha ?? 1}" preserveAspectRatio="xMidYMid ${section.cardBgFit === 'contain' ? 'meet' : 'slice'}" />`
      ).join('\n')}
    </g>

    <rect x="0" y="0" width="${w}" height="${headerH}" rx="${Math.min(radius, headerH/2)}" fill="${headerFill}" />
    <text x="${padX}" y="${headerH/2}" font-family="${titleFont}" font-weight="700" font-size="${Math.min(44, headerH * 0.55)}" fill="${headerTextColor}" dominant-baseline="middle">
      ${escapeXML(headerText)}
    </text>

    ${lines.map((it, idx) => {
      const y = headerH + padY + contentTopPad + idx * (nameSize + descSize + 10);
      const price = (it.price ?? '').toString();
      const allergens = (it.allergens ?? '').toString();
      return `
        <text x="${padX}" y="${y}" font-family="${bodyFont}" font-weight="700" font-size="${nameSize}" fill="${nameColor}">${escapeXML(it.name || 'Item')}</text>
        ${allergens ? `<text x="${padX + 110}" y="${y - (nameSize*0.25)}" font-family="${bodyFont}" font-size="${allergenSize}" fill="${allergenColor}">${escapeXML(allergens)}</text>` : ''}
        ${it.desc ? `<text x="${padX}" y="${y + descSize + 6}" font-family="${bodyFont}" font-size="${descSize}" fill="${descColor}">${escapeXML(it.desc)}</text>` : ''}
        ${price ? `<text x="${w - padX}" y="${y}" text-anchor="end" font-family="${bodyFont}" font-weight="700" font-size="${nameSize}" fill="${nameColor}">${escapeXML(price)}</text>` : ''}
      `;
    }).join('\n')}
  </g>
  `;
}
function escapeXML(s=''){ return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
