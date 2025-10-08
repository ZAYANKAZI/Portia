// src/svg/PizzaCardSVG.jsx
export default function PizzaCardSVG({ section }) {
  const {
    w = 980, h = 1020, radius = 26,
    padX = 28, padY = 22,
    contentTopPad = 8,
    cardBg = '#ffffff',
    cardBgImage, cardBgImage1, cardBgImage2,
    cardBg1Alpha = 1, cardBg2Alpha = 1,
    header = {},
    headerFont = 'Poppins',
    headerTitleSize = 0,
    colCount = 3,
    colLabels = ['10"', '12"', '16"'],
    colHeaderSize = 16,
    bodyFont = 'Inter',
    nameColor = '#c63b2f', nameSize = 30,
    descColor = '#333', descSize = 20,
    allergenColor = '#2aa43a', allergenSize = 16, allergenRaise = -8,
    priceFont = 'Inter', priceColor = '#1f2937', priceSize = 22,
    items = [],
    foodImage,
  } = section;

  const headerH = Math.max(80, header.reservedHeight ?? 120);
  const headerFill = header?.props?.fill || '#1f8a4c';
  const headerText = header?.props?.label || header?.props?.text || 'PIZZA';
  const headerTextColor = header?.props?.textColor || '#fff';
  const titleSize = headerTitleSize || Math.min(64, headerH * 0.6);

  const bgImgs = [
    cardBgImage || cardBgImage1 ? { href: (cardBgImage || cardBgImage1), alpha: cardBg1Alpha } : null,
    cardBgImage2 ? { href: cardBgImage2, alpha: cardBg2Alpha } : null,
  ].filter(Boolean);

  const gridLeft = padX;
  const gridTop = headerH + padY + contentTopPad;
  const colW = (w - padX*2) / Math.max(1, colCount);

  return `
  <g>
    <defs>
      <clipPath id="pizzaCardClip"><rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" /></clipPath>
    </defs>
    <g clip-path="url(#pizzaCardClip)">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${cardBg}" />
      ${bgImgs.map((im) =>
        `<image href="${im.href}" x="0" y="0" width="${w}" height="${h}" opacity="${im.alpha ?? 1}" preserveAspectRatio="xMidYMid ${section.cardBgFit === 'contain' ? 'meet' : 'slice'}" />`
      ).join('\n')}
    </g>

    <rect x="0" y="0" width="${w}" height="${headerH}" rx="${Math.min(radius, headerH/2)}" fill="${headerFill}" />
    <text x="${w/2}" y="${headerH/2}" text-anchor="middle" font-family="${headerFont}" font-size="${titleSize}" font-weight="900" fill="${headerTextColor}" dominant-baseline="middle">
      ${escapeXML(headerText)}
    </text>

    ${colLabels.slice(0, colCount).map((label, i) => {
      const cx = gridLeft + colW*(i+0.5);
      return `<text x="${cx}" y="${gridTop - 10}" text-anchor="middle" font-family="${headerFont}" font-size="${colHeaderSize}" font-weight="700" fill="${headerTextColor}">${escapeXML(label)}</text>`;
    }).join('\n')}

    ${items.map((it, idx) => {
      const rowY = gridTop + idx * (nameSize + Math.max(descSize, 18) + 14);
      const leftX = padX;

      const prices = Array.isArray(it.prices) ? it.prices : (it.price ? [it.price] : []);
      const priceCells = prices.slice(0, colCount).map((p, i) => {
        const cx = gridLeft + colW*(i+0.5);
        return `<text x="${cx}" y="${rowY}" text-anchor="middle" font-family="${priceFont}" font-size="${priceSize}" font-weight="800" fill="${priceColor}">${escapeXML(String(p))}</text>`;
      }).join('\n');

      const allergens = (it.allergens ?? '').toString();
      const allergenText = allergens
        ? `<text x="${leftX + 110}" y="${rowY + (allergenRaise||0)}" font-family="${bodyFont}" font-size="${allergenSize}" fill="${allergenColor}">${escapeXML(allergens)}</text>`
        : '';

      const desc = it.desc
        ? `<text x="${leftX}" y="${rowY + descSize + 6}" font-family="${bodyFont}" font-size="${descSize}" fill="${descColor}">${escapeXML(it.desc)}</text>`
        : '';

      return `
        <text x="${leftX}" y="${rowY}" font-family="${bodyFont}" font-size="${nameSize}" font-weight="800" fill="${nameColor}">${escapeXML(it.name || '')}</text>
        ${allergenText}
        ${desc}
        ${priceCells}
      `;
    }).join('\n')}

    ${foodImage ? `<image href="${foodImage}" x="${w*0.15}" y="${h*0.45}" width="${w*0.7}" height="${h*0.4}" preserveAspectRatio="xMidYMid meet" />` : ''}
  </g>
  `;
}
function escapeXML(s=''){ return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
