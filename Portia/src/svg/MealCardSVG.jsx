// src/svg/MealCardSVG.jsx
export default function MealCardSVG({ section }) {
  const {
    w = 520, h = 720, radius = 22,
    padX = 24, padY = 22,
    cardBg = '#fff',
    cardBgImage, cardBgImage1, cardBgImage2,
    cardBg1Alpha = 1, cardBg2Alpha = 1,
    titleFont = 'Poppins', bodyFont = 'Inter',
    title1 = 'CHICKEN BURGER', title1Size = 44, title1Color = '#257453',
    title2 = 'MEAL', title2Size = 34, title2Color = '#1e1e1e',
    title3 = '(With Cheese)', title3Size = 22, title3Color = '#b01c1c',
    bodyLines = ['(Breaded)'], bodySize = 22, bodyColor = '#1e1e1e',
    currency = '€', priceInt = '11', priceDec = '00',
    priceTextColor = '#fff', priceFlagColor = '#1f8a4c',
    priceFlagW = 200, priceFlagH = 84, priceFlagRadius = 18,
    priceFlagOffsetX = 0, priceFlagOffsetY = 0,
  } = section;

  const bgImgs = [
    cardBgImage || cardBgImage1 ? { href: (cardBgImage || cardBgImage1), alpha: cardBg1Alpha } : null,
    cardBgImage2 ? { href: cardBgImage2, alpha: cardBg2Alpha } : null,
  ].filter(Boolean);

  const titleTop = padY + 8;
  const bodyTop = titleTop + title1Size + title2Size + title3Size + 28;

  const priceX = w - padX - priceFlagW/2 + (priceFlagOffsetX||0);
  const priceY = padY + priceFlagH/2 + (priceFlagOffsetY||0);

  return `
  <g>
    <defs>
      <clipPath id="mealCardClip"><rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" /></clipPath>
    </defs>
    <g clip-path="url(#mealCardClip)">
      <rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="${cardBg}" />
      ${bgImgs.map((im) =>
        `<image href="${im.href}" x="0" y="0" width="${w}" height="${h}" opacity="${im.alpha ?? 1}" preserveAspectRatio="xMidYMid ${section.cardBgFit === 'contain' ? 'meet' : 'slice'}" />`
      ).join('\n')}
    </g>

    <text x="${padX}" y="${titleTop}" font-family="${titleFont}" font-size="${title1Size}" font-weight="800" fill="${title1Color}" dominant-baseline="hanging">${escapeXML(title1)}</text>
    <text x="${padX}" y="${titleTop + title1Size + 6}" font-family="${titleFont}" font-size="${title2Size}" font-weight="700" fill="${title2Color}" dominant-baseline="hanging">${escapeXML(title2)}</text>
    <text x="${padX}" y="${titleTop + title1Size + title2Size + 12}" font-family="${titleFont}" font-size="${title3Size}" font-weight="600" fill="${title3Color}" dominant-baseline="hanging">${escapeXML(title3)}</text>

    ${bodyLines.map((t, i) =>
      `<text x="${padX}" y="${bodyTop + i*(bodySize+8)}" font-family="${bodyFont}" font-size="${bodySize}" fill="${bodyColor}" dominant-baseline="hanging">${escapeXML(t)}</text>`
    ).join('\n')}

    <g transform="translate(${priceX - priceFlagW/2}, ${priceY - priceFlagH/2})">
      <rect x="0" y="0" width="${priceFlagW}" height="${priceFlagH}" rx="${priceFlagRadius}" fill="${priceFlagColor}"/>
      <text x="${priceFlagW*0.18}" y="${priceFlagH*0.5}" font-family="${titleFont}" font-size="${priceFlagH*0.42}" font-weight="800" fill="${priceTextColor}" dominant-baseline="middle">${escapeXML(currency)}</text>
      <text x="${priceFlagW*0.35}" y="${priceFlagH*0.5}" font-family="${titleFont}" font-size="${priceFlagH*0.54}" font-weight="800" fill="${priceTextColor}" dominant-baseline="middle">${escapeXML(priceInt)}</text>
      <text x="${priceFlagW*0.78}" y="${priceFlagH*0.5}" font-family="${titleFont}" font-size="${priceFlagH*0.38}" font-weight="800" fill="${priceTextColor}" dominant-baseline="middle">${escapeXML(priceDec)}</text>
    </g>
  </g>
  `;
}
function escapeXML(s=''){ return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
