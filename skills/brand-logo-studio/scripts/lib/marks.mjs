/**
 * brand-logo-studio — marks.mjs
 * The 8 icon recipes (100×100 grid, real cutouts so they survive one-color printing) and the lockup
 * builder that combines an icon with outlined Persian and Latin wordmarks.
 * Recipes and their limits: references/recipes.md. Lockup rules: references/bilingual-lockups.md.
 */
import { shapeText } from './shape.mjs';
import { transformPath, findDots, subpaths, pathBBox } from './path.mjs';
import { fontInfo } from './fonts.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
const rrect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const circle = (cx, cy, r, ccw = false) => `M${cx - r} ${cy}A${r} ${r} 0 1 ${ccw ? 0 : 1} ${cx + r} ${cy}A${r} ${r} 0 1 ${ccw ? 0 : 1} ${cx - r} ${cy}Z`;

/** Outline of two overlapping squares (an 8-point star), outer radius R. */
function star8(cx, cy, R) {
  const r = (R / Math.SQRT2) / Math.cos(Math.PI / 8), pts = [];
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, d = i % 2 ? r : R; pts.push(`${r2(cx + d * Math.cos(a))} ${r2(cy + d * Math.sin(a))}`); }
  return `M${pts.join('L')}Z`;
}

/** Thick polyline outline with miter joins and round caps drawn as cubic quarter-circles (no self-overlap). */
function thickLine(pts, w) {
  const h = w / 2, n = pts.length, L = [], R = [];
  const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
  for (let i = 0; i < n; i++) {
    let nx, ny, k = 1;
    if (i === 0) [nx, ny] = nrm(pts[0], pts[1]);
    else if (i === n - 1) [nx, ny] = nrm(pts[n - 2], pts[n - 1]);
    else { const a = nrm(pts[i - 1], pts[i]), b = nrm(pts[i], pts[i + 1]); nx = a[0] + b[0]; ny = a[1] + b[1]; const l = Math.hypot(nx, ny); nx /= l; ny /= l; k = 1 / (nx * a[0] + ny * a[1]); }
    L.push([pts[i][0] + nx * h * k, pts[i][1] + ny * h * k]); R.push([pts[i][0] - nx * h * k, pts[i][1] - ny * h * k]);
  }
  const P = (p) => `${r2(p[0])} ${r2(p[1])}`;
  const K = 0.5523, D = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const cap = (from, to, p, d) => { const nx = (from[0] - p[0]) / h, ny = (from[1] - p[1]) / h, T = [p[0] + d[0] * h, p[1] + d[1] * h];
    return `C${P([from[0] + d[0] * h * K, from[1] + d[1] * h * K])} ${P([T[0] + nx * h * K, T[1] + ny * h * K])} ${P(T)}C${P([T[0] - nx * h * K, T[1] - ny * h * K])} ${P([to[0] + d[0] * h * K, to[1] + d[1] * h * K])} ${P(to)}`; };
  return `M${P(L[0])}` + L.slice(1).map((p) => `L${P(p)}`).join('') + cap(L[n - 1], R[n - 1], pts[n - 1], D(pts[n - 2], pts[n - 1])) + R.slice(0, -1).reverse().map((p) => `L${P(p)}`).join('') + cap(R[0], L[0], pts[0], D(pts[1], pts[0])) + 'Z';
}

/** Paint for a role in a mode. mono-black/mono-white = one color; reversed = for dark backgrounds. */
export function paint(mode, c, colorKey, reversedKey) {
  if (mode === 'mono-black') return '#000000';
  if (mode === 'mono-white') return '#ffffff';
  return mode === 'reversed' ? c[reversedKey] : c[colorKey];
}

/** A glyph outline fitted into a box (for monogram knockouts). Static fonts only: variable fonts may overlap contours. */
async function glyphIn(letter, font, box) {
  const id = font.split(':')[0];
  if (fontInfo(id) && !fontInfo(id).static) throw new Error(`monogram knockouts need a static font (overlapping contours break even-odd cutouts) — use vazirmatn-black, vazirmatn-extrabold or a static TTF, not ${font}`);
  const g = await shapeText(letter, font, { size: 100 });
  if (!g.bbox) throw new Error(`no outline for "${letter}" in ${font}`);
  const s = Math.min(box.w / g.bbox.w, box.h / g.bbox.h);
  return transformPath(g.d, { sx: s, sy: s, tx: box.cx - (g.bbox.x0 + g.bbox.w / 2) * s, ty: box.cy - (g.bbox.y0 + g.bbox.h / 2) * s });
}

export const RECIPES = {
  R1_monogram: { name: 'Monogram in a rounded square', kind: 'container', letter: true, use: 'any short name; the first letter knocked out of a solid square',
    make: async (c, m, o) => {
      const g = await glyphIn(o.letter, o.letterFont, { cx: 50, cy: 52, w: 50, h: 52 });
      // accentDot: the letter's dot stays a real cutout (one-color print keeps the gap); color modes fill it with the accent
      const subs = subpaths(g), dots = o.accentDot && !m.startsWith('mono') ? findDots(g).map((i) => subs[i]).join('') : '';
      return `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'onDark')}" d="${rrect(10, 10, 80, 80, 22)} ${g}"/>${dots ? `<path fill="${paint(m, c, 'accent', 'accentOnDark')}" d="${dots}"/>` : ''}`;
    } },
  R2_rings: { name: 'Two linked rings', kind: 'symbol', use: 'partnership, payments, connection; two parties',
    make: async (c, m) => `<defs><mask id="cut-${m}"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="29.5" r="6.5" fill="#000"/></mask><mask id="cut2-${m}"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="70.5" r="6.5" fill="#000"/></mask></defs>` +
      `<path fill-rule="evenodd" fill="${paint(m, c, 'ink', 'onDark')}" mask="url(#cut2-${m})" d="${circle(38, 50, 28)} ${circle(38, 50, 20, true)}"/>` +
      `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'accentOnDark')}" mask="url(#cut-${m})" d="${circle(62, 50, 28)} ${circle(62, 50, 20, true)}"/>` },
  R3_book_bubble: { name: 'Open book + speech bubble', kind: 'symbol', use: 'language schools, tutoring, reading — "learn to speak"',
    make: async (c, m) => `<g fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path stroke="${paint(m, c, 'ink', 'onDark')}" d="M50 34C40 27 26 27 16 31V68C25 65 33 65 39 67L29 80L45 71C47 72 49 73 50 74"/><path stroke="${paint(m, c, 'primary', 'accentOnDark')}" d="M50 34C60 27 74 27 84 31V68C74 64 60 64 50 74"/><path stroke="${paint(m, c, 'ink', 'onDark')}" d="M50 34V74"/></g>` },
  R4_shield: { name: 'Shield with a check', kind: 'container', use: 'security, insurance, clinics, verification',
    make: async (c, m) => `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'onDark')}" d="M50 10L84 21V47C84 68 70 81 50 90C30 81 16 68 16 47V21Z ${thickLine([[34, 50], [45, 61], [67, 39]], 9)}"/>` },
  R5_taaq_arch: { name: 'Pointed arch (taaq) cut from a square', kind: 'container', use: 'architecture, hospitality, culture — only when the subject is related',
    make: async (c, m) => `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'onDark')}" d="${rrect(12, 12, 76, 76, 18)} M34 80V54C34 40 44 31 50 22C56 31 66 40 66 54V80Z"/>` },
  R6_arrow: { name: 'Arrow cut from a circle', kind: 'symbol', use: 'logistics, growth, fintech, "go"',
    make: async (c, m) => `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'onDark')}" d="M50 10C72.09 10 90 27.91 90 50C90 72.09 72.09 90 50 90C27.91 90 10 72.09 10 50C10 27.91 27.91 10 50 10ZM36 34H66V64H58V47.66L37.83 67.83L32.17 62.17L52.34 42H36V34Z"/>` },
  R7_cube: { name: 'Isometric cube', kind: 'symbol', use: 'software, building blocks, storage, logistics',
    make: async (c, m) => `<polygon points="50,10 82,28.5 50,47 18,28.5" fill="${paint(m, c, 'accent', 'onDark')}"/><polygon points="16,35 47,53 47,90 16,72" fill="${paint(m, c, 'primary', 'accentOnDark')}"/><polygon points="84,35 84,72 53,90 53,53" fill="${paint(m, c, 'ink', 'onDarkMuted')}"/>` },
  R8_shamsa: { name: 'Eight-point star (shamsa)', kind: 'symbol', use: 'crafts, heritage, hospitality — only when the subject is related, never as a generic "Iranian" sign',
    make: async (c, m) => `<path fill-rule="evenodd" fill="${paint(m, c, 'primary', 'onDark')}" d="${star8(50, 50, 40)} ${circle(50, 50, 15, true)}"/><circle cx="50" cy="50" r="7.5" fill="${paint(m, c, 'accent', 'accentOnDark')}"/>` },
};

/** Icon SVG body for a recipe and mode. opts: { letter, letterFont } for R1. */
export async function iconBody(id, colors, mode, opts = {}) {
  const r = RECIPES[id];
  if (!r) throw new Error(`unknown recipe ${id}. Recipes: ${Object.keys(RECIPES).join(', ')}`);
  if (r.letter && !opts.letter) throw new Error(`${id} needs a monogram letter (brief.monogram)`);
  return r.make(colors, mode, { ...opts, letterFont: opts.letterFont || 'vazirmatn-black' });
}

export const svgDoc = (vb, body, { title } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${title ? `<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>` : ''}${body}</svg>`;

/** Wordmark split into body + dot paths, so dots can carry the accent. */
async function wordmark(text, font, size, opts = {}) {
  const w = await shapeText(text, font, { size, base: opts.base || 'auto', tracking: opts.tracking || 0 });
  if (!opts.accentDots || opts.accentDots === 'none') return { ...w, bodyD: w.d, dotsD: '' };
  const subs = subpaths(w.d);
  const idx = findDots(w.d);
  let chosen = idx;
  if (opts.accentDots === 'first') { // the dot(s) of the first letter in reading order (right-most cluster in RTL)
    const withX = idx.map((i) => ({ i, x: pathBBox(subs[i]).x0 }));
    const maxX = Math.max(...withX.map((d) => d.x));
    chosen = withX.filter((d) => d.x >= maxX - size * 0.18).map((d) => d.i);
  }
  const set = new Set(chosen);
  return { ...w, bodyD: subs.filter((_, i) => !set.has(i)).join(''), dotsD: subs.filter((_, i) => set.has(i)).join('') };
}

/**
 * Build a lockup.
 * @param o { layout: 'h-rtl'|'h-ltr'|'stacked'|'fa-only'|'wordmark-fa'|'wordmark-en'|'icon',
 *            icon: recipe id, colors, mode, letter, letterFont, fa: {text, font}, en: {text, font, tracking},
 *            accentDots: 'none'|'first'|'all' }
 * @returns { svg, width, height, warnings }
 */
export async function lockup(o) {
  const { layout, colors: c, mode } = o;
  const warnings = [];
  const ink = paint(mode, c, 'ink', 'onDark');
  const dotPaint = paint(mode, c, 'accent', 'accentOnDark');
  const P = 112, L = 100; // Persian set at 1.12 × Latin — a starting value; check visually (bilingual-lockups.md §2)
  const parts = [];
  const needFa = ['h-rtl', 'h-ltr', 'stacked', 'fa-only', 'wordmark-fa'].includes(layout);
  const needEn = ['h-rtl', 'h-ltr', 'stacked', 'wordmark-en'].includes(layout);
  const needIcon = ['h-rtl', 'h-ltr', 'stacked', 'fa-only', 'icon'].includes(layout);
  const fa = needFa ? await wordmark(o.fa.text, o.fa.font, P, { accentDots: o.accentDots, base: 'rtl' }) : null;
  const en = needEn ? await wordmark(o.en.text, o.en.font, layout === 'stacked' ? 64 : L, { tracking: o.en.tracking || 0, base: 'ltr' }) : null;
  for (const w of [fa, en]) if (w) warnings.push(...w.warnings.filter((x) => !/→/.test(x)));
  const iconSvg = needIcon ? await iconBody(o.icon, c, mode, { letter: o.letter, letterFont: o.letterFont, accentDot: !!o.accentDots && o.accentDots !== 'none' }) : '';
  const text = (w, x, y) => `<path fill="${ink}" d="${transformPath(w.bodyD, { tx: x - w.bbox.x0, ty: y })}"/>` + (w.dotsD ? `<path fill="${dotPaint}" d="${transformPath(w.dotsD, { tx: x - w.bbox.x0, ty: y })}"/>` : '');
  const iconAt = (x, y, h) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(h / 100)})">${iconSvg}</g>`;

  if (layout === 'icon') return { svg: svgDoc('0 0 100 100', iconSvg), width: 100, height: 100, warnings };
  if (layout === 'wordmark-fa' || layout === 'wordmark-en') {
    const w = fa || en, pad = 0.08 * P;
    return { svg: svgDoc(`0 0 ${r2(w.bbox.w + 2 * pad)} ${r2(w.bbox.h + 2 * pad)}`, text(w, pad, pad - w.bbox.y0)), width: w.bbox.w + 2 * pad, height: w.bbox.h + 2 * pad, warnings };
  }
  if (layout === 'stacked') {
    const H = 1.6 * P, gap = 0.3 * P, pad = 0.15 * P;
    const enScale = en.bbox.w > fa.bbox.w ? fa.bbox.w / en.bbox.w : 1; // the Latin line is never wider than the Persian one
    const width = Math.max(H, fa.bbox.w, en.bbox.w * enScale) + 2 * pad;
    let y = pad;
    parts.push(iconAt((width - H) / 2, y, H)); y += H + gap - fa.bbox.y0;
    parts.push(text(fa, (width - fa.bbox.w) / 2, y)); y += fa.bbox.y1 + gap * 0.8;
    const enD = transformPath(en.bodyD, { sx: enScale, sy: enScale, tx: (width - en.bbox.w * enScale) / 2 - en.bbox.x0 * enScale, ty: y - en.bbox.y0 * enScale });
    parts.push(`<path fill="${ink}" d="${enD}"/>`); y += en.bbox.h * enScale + pad;
    return { svg: svgDoc(`0 0 ${r2(width)} ${r2(y)}`, parts.join('')), width, height: y, warnings };
  }
  // Horizontal layouts: all wordmarks share one baseline (Persian korsi on the Latin baseline — never align by box bottoms).
  // Visual order left→right: h-rtl = Latin, Persian, icon (Iran-first); h-ltr = icon, Latin, Persian (global); fa-only = Persian, icon.
  const words = layout === 'fa-only' ? [fa] : [en, fa];
  const top = Math.min(...words.map((w) => w.bbox.y0)), bottom = Math.max(...words.map((w) => w.bbox.y1));
  const H = (bottom - top) * 1.4, gapIcon = 0.28 * H, gapWords = 0.45 * L, pad = 0.1 * H;
  const baseline = pad + (H - (bottom - top)) / 2 - top;
  let x = pad;
  const placeWords = () => words.forEach((w, i) => { parts.push(text(w, x, baseline)); x += w.bbox.w + (i < words.length - 1 ? gapWords : 0); });
  if (layout === 'h-ltr') { parts.push(iconAt(x, pad, H)); x += H + gapIcon; placeWords(); }
  else { placeWords(); x += gapIcon; parts.push(iconAt(x, pad, H)); x += H; }
  x += pad;
  return { svg: svgDoc(`0 0 ${r2(x)} ${r2(H + 2 * pad)}`, parts.join('')), width: x, height: H + 2 * pad, warnings };
}
