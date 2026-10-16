/**
 * brand-color-system — palette-engine.mjs
 * Pure palette logic (no file I/O): brand-anchored 11-stop scales, semantic light/dark tokens chosen
 * by contrast search, status hues with brand-collision guard, competitor-distance and CVD notes.
 * Used by generate-palette.mjs (CLI) and selftest.mjs. Algorithm: references/palette-algorithm.md.
 */
import {
  STOPS, parseColor, toHex, hexToOklch, oklchToHex, clampChroma, contrast, apca, simulateCvd, deltaEOK, hueDiff, fmtRatio,
} from './color-core.mjs';
import { PAIRS, targetFor, wcagFloor, FA_HOUSE_TEXT } from './token-pairs.mjs';

// Per-hue lightness, relative chroma and hue drift, measured from Tailwind CSS 4.3.3 theme.css (MIT) on 2026-10-15.
// Row: [hue at stop 500, L per stop 50..950, chroma ÷ family max, hue offset from stop 500 (degrees)].
const CURVES = [
  [16.4, [0.969, 0.941, 0.892, 0.81, 0.712, 0.645, 0.586, 0.514, 0.455, 0.41, 0.271], [0.06, 0.12, 0.23, 0.46, 0.77, 0.97, 1, 0.88, 0.74, 0.63, 0.42], [-4, -4, -6, -5, -3, 0, 1, 0, -3, -6, -4]],
  [25.3, [0.971, 0.936, 0.885, 0.808, 0.704, 0.637, 0.577, 0.505, 0.444, 0.396, 0.258], [0.05, 0.13, 0.25, 0.47, 0.78, 0.97, 1, 0.87, 0.72, 0.58, 0.38], [-8, -8, -7, -6, -3, 0, 2, 2, 2, 0, 1]],
  [47.6, [0.98, 0.954, 0.901, 0.837, 0.75, 0.705, 0.646, 0.553, 0.47, 0.408, 0.266], [0.07, 0.17, 0.34, 0.58, 0.82, 0.96, 1, 0.88, 0.71, 0.55, 0.36], [26, 28, 23, 19, 8, 0, -6, -9, -10, -9, -11]],
  [70.1, [0.987, 0.962, 0.924, 0.879, 0.828, 0.769, 0.666, 0.555, 0.473, 0.414, 0.279], [0.12, 0.31, 0.63, 0.89, 1, 0.99, 0.95, 0.86, 0.72, 0.59, 0.41], [25, 26, 26, 22, 14, 0, -12, -21, -24, -24, -24]],
  [86.0, [0.987, 0.973, 0.945, 0.905, 0.852, 0.795, 0.681, 0.554, 0.476, 0.421, 0.286], [0.13, 0.36, 0.65, 0.91, 1, 0.92, 0.81, 0.68, 0.57, 0.48, 0.33], [16, 17, 15, 12, 6, 0, -10, -20, -24, -28, -32]],
  [130.8, [0.986, 0.967, 0.938, 0.897, 0.841, 0.768, 0.648, 0.532, 0.453, 0.405, 0.274], [0.13, 0.28, 0.53, 0.82, 1, 0.98, 0.84, 0.66, 0.52, 0.42, 0.3], [-10, -9, -7, -4, -2, 0, 1, 1, 0, 0, 1]],
  [149.6, [0.982, 0.962, 0.925, 0.871, 0.792, 0.723, 0.627, 0.527, 0.448, 0.393, 0.266], [0.08, 0.2, 0.38, 0.68, 0.95, 1, 0.89, 0.7, 0.54, 0.43, 0.3], [6, 7, 6, 5, 2, 0, 0, 0, 2, 3, 3]],
  [162.5, [0.979, 0.95, 0.905, 0.845, 0.765, 0.696, 0.596, 0.508, 0.432, 0.378, 0.262], [0.12, 0.29, 0.53, 0.81, 1, 0.96, 0.82, 0.67, 0.54, 0.44, 0.29], [4, 1, 2, 2, 1, 0, 1, 3, 4, 6, 10]],
  [182.5, [0.984, 0.953, 0.91, 0.855, 0.777, 0.704, 0.6, 0.511, 0.437, 0.386, 0.277], [0.09, 0.34, 0.63, 0.91, 1, 0.92, 0.78, 0.63, 0.51, 0.41, 0.3], [-2, -2, -2, -1, -1, 0, 2, 4, 6, 6, 10]],
  [215.2, [0.984, 0.956, 0.917, 0.865, 0.789, 0.715, 0.609, 0.52, 0.45, 0.398, 0.302], [0.12, 0.29, 0.52, 0.82, 1, 0.93, 0.82, 0.68, 0.55, 0.45, 0.36], [-14, -12, -10, -8, -4, 0, 7, 8, 9, 12, 14]],
  [237.3, [0.977, 0.951, 0.901, 0.828, 0.746, 0.685, 0.588, 0.5, 0.443, 0.391, 0.293], [0.08, 0.15, 0.34, 0.66, 0.95, 1, 0.93, 0.79, 0.65, 0.53, 0.39], [-1, 0, -6, -7, -5, 0, 5, 5, 3, 4, 6]],
  [259.8, [0.97, 0.932, 0.882, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282], [0.06, 0.13, 0.24, 0.43, 0.67, 0.87, 1, 0.99, 0.81, 0.6, 0.37], [-5, -4, -6, -8, -5, 0, 3, 5, 6, 6, 8]],
  [277.1, [0.962, 0.93, 0.87, 0.785, 0.673, 0.585, 0.511, 0.457, 0.398, 0.359, 0.257], [0.07, 0.13, 0.25, 0.44, 0.69, 0.89, 1, 0.92, 0.74, 0.55, 0.34], [-5, -4, -3, -2, 0, 0, 0, 0, 0, 2, 4]],
  [292.7, [0.969, 0.943, 0.894, 0.811, 0.702, 0.606, 0.541, 0.491, 0.432, 0.38, 0.283], [0.06, 0.1, 0.2, 0.4, 0.65, 0.89, 1, 0.96, 0.83, 0.67, 0.5], [1, 2, 1, 1, 1, 0, 0, 0, 0, 1, -2]],
  [303.9, [0.977, 0.946, 0.902, 0.827, 0.714, 0.627, 0.558, 0.496, 0.438, 0.381, 0.291], [0.05, 0.11, 0.22, 0.41, 0.7, 0.92, 1, 0.92, 0.76, 0.61, 0.52], [4, 3, 3, 2, 2, 0, -2, -2, 0, 1, -1]],
  [322.1, [0.977, 0.952, 0.903, 0.833, 0.74, 0.667, 0.591, 0.518, 0.452, 0.401, 0.293], [0.06, 0.13, 0.26, 0.49, 0.81, 1, 0.99, 0.86, 0.72, 0.58, 0.46], [-2, -3, -3, -1, 0, 0, 1, 2, 2, 3, 4]],
  [354.3, [0.971, 0.948, 0.899, 0.823, 0.718, 0.656, 0.592, 0.525, 0.459, 0.408, 0.284], [0.06, 0.11, 0.24, 0.48, 0.81, 0.97, 1, 0.9, 0.75, 0.61, 0.44], [-11, -12, -11, -8, -5, 0, 6, 10, 10, 8, 10]],
];
// Neutrals: Tailwind gray lightness; chroma shape of Tailwind 4.2+ mist/taupe (tinted grays).
const NEUTRAL_L = [0.985, 0.967, 0.928, 0.872, 0.707, 0.551, 0.446, 0.373, 0.278, 0.21, 0.13];
const NEUTRAL_C = [0.1, 0.12, 0.25, 0.35, 0.67, 1, 0.85, 0.75, 0.55, 0.4, 0.2];

/** Starting points when the user has no brand color. Documented in references/industry-feel-lookup.md. */
export const FEELS = {
  trust: { h: 255, c: 0.15, l: 0.48, harmony: 'complementary', label: 'trustworthy, serious (navy / cobalt)' },
  calm: { h: 182, c: 0.1, l: 0.55, harmony: 'analogous', label: 'calm, caring (teal / sage)' },
  playful: { h: 35, c: 0.19, l: 0.64, harmony: 'split', label: 'playful, energetic (coral / orange)' },
  premium: { h: 330, c: 0.08, l: 0.36, accentH: 85, label: 'premium, restrained (deep plum + gold)' },
  tech: { h: 277, c: 0.2, l: 0.52, harmony: 'analogous', label: 'modern, technical (indigo / violet)' },
  heritage: { h: 205, c: 0.12, l: 0.55, accentH: 88, label: 'heritage, Iranian (feroozeh turquoise + saffron)' },
  minimal: { h: 260, c: 0.02, l: 0.25, accentH: 255, label: 'minimal, neutral (near-black + blue)' },
};
export const FEEL_ALIASES = { trustworthy: 'trust', serious: 'trust', fintech: 'trust', caring: 'calm', health: 'calm', fun: 'playful', friendly: 'playful', kids: 'playful', energetic: 'playful', luxury: 'premium', modern: 'tech', saas: 'tech', traditional: 'heritage', iranian: 'heritage', neutral: 'minimal' };
const HARMONY = { analogous: 35, complementary: 180, split: 150 };

/**
 * Accent policy per industry (used when there is no --accent and no --harmony).
 * warm = saffron-gold; restrained = quiet low-chroma analogous; gold = soft gold; others = harmony offsets.
 * Documented in references/industry-feel-lookup.md §2.
 */
export const INDUSTRIES = {
  education: { accent: 'warm', label: 'education and course sites' },
  kids: { accent: 'warm', label: 'children\'s products and learning apps' },
  food: { accent: 'warm', label: 'food, cafés and restaurants' },
  consumer: { accent: 'warm', label: 'friendly consumer apps' },
  travel: { accent: 'warm', label: 'travel and tourism' },
  finance: { accent: 'restrained', label: 'banking, payments and insurance' },
  government: { accent: 'restrained', label: 'government and civic services' },
  health: { accent: 'restrained', label: 'health and clinics' },
  legal: { accent: 'restrained', label: 'legal and professional services' },
  saas: { accent: 'analogous', label: 'SaaS and developer tools' },
  ecommerce: { accent: 'complementary', label: 'shops and marketplaces' },
  luxury: { accent: 'gold', label: 'luxury and hospitality' },
  culture: { accent: 'warm', label: 'culture, crafts and heritage' },
};
export const INDUSTRY_ALIASES = {
  school: 'education', courses: 'education', language: 'education', edtech: 'education', university: 'education',
  children: 'kids', toys: 'kids', restaurant: 'food', cafe: 'food', fintech: 'finance', bank: 'finance', insurance: 'finance',
  civic: 'government', medical: 'health', clinic: 'health', wellness: 'health', tech: 'saas', devtools: 'saas', ai: 'saas',
  shop: 'ecommerce', marketplace: 'ecommerce', hotel: 'luxury', fashion: 'luxury', jewellery: 'luxury', jewelry: 'luxury',
  heritage: 'culture', crafts: 'culture', tourism: 'travel',
};
const WARM_ACCENT_H = 88; // saffron-gold
const GOLD_ACCENT_H = 85;
/** A derived accent keeps at least this many degrees from error red and success green. */
export const ACCENT_STATUS_GAP = 45;

/**
 * First hue in `candidates` that is ≥ ACCENT_STATUS_GAP from danger/success and ≥ 25° from the brand hue;
 * otherwise the nearest such hue to the first candidate.
 */
function safeAccentHue(candidates, brandH) {
  const norm = (h) => ((h % 360) + 360) % 360;
  const ok = (h) => hueDiff(h, STATUS.danger.h) >= ACCENT_STATUS_GAP && hueDiff(h, STATUS.success.h) >= ACCENT_STATUS_GAP && (brandH == null || hueDiff(h, brandH) >= 25);
  const list = candidates.map(norm);
  for (let i = 0; i < list.length; i++) if (ok(list[i])) return { h: list[i], moved: i > 0, from: list[0] };
  for (let d = 1; d <= 180; d++) for (const h of [list[0] + d, list[0] - d]) if (ok(norm(h))) return { h: norm(h), moved: true, from: list[0] };
  return { h: list[0], moved: false, from: list[0] };
}

// Status hue windows (default first). The guard keeps them away from brand/accent hues.
const STATUS = {
  success: { h: 150, lo: 135, hi: 172, c: 0.17 },
  warning: { h: 70, lo: 52, hi: 88, c: 0.17 },
  danger: { h: 27, lo: 12, hi: 38, c: 0.22 },
  info: { h: 250, lo: 215, hi: 268, c: 0.16 },
};

const WHITE = '#ffffff';
const ratio = (a, b) => contrast(parseColor(a), parseColor(b));
const lerp = (a, b, t) => a + (b - a) * t;
const range = (a, b) => { const out = []; if (a <= b) for (let i = a; i <= b; i++) out.push(i); else for (let i = a; i >= b; i--) out.push(i); return out; };

function curvesForHue(h) {
  const hh = ((h % 360) + 360) % 360;
  const i = CURVES.findIndex((row) => row[0] > hh);
  const hiRow = CURVES[i === -1 ? 0 : i];
  const loRow = CURVES[i === -1 ? CURVES.length - 1 : (i - 1 + CURVES.length) % CURVES.length];
  let span = hiRow[0] - loRow[0]; if (span <= 0) span += 360;
  let d = hh - loRow[0]; if (d < 0) d += 360;
  const t = d / span;
  const mix = (col) => loRow[col].map((v, j) => lerp(v, hiRow[col][j], t));
  return { L: mix(1), C: mix(2), dH: mix(3) };
}

/**
 * 11-stop scale. With `anchor` (an exact hex), the stop nearest in lightness holds that exact hex,
 * neighbouring lightness values shift smoothly toward it, and peak chroma comes from the anchor itself
 * (no minimum chroma — muted brands stay muted).
 */
export function buildScale({ h, cPeak = 0.15, anchor = null, anchorStop = null, neutral = false }) {
  const base = neutral ? { L: NEUTRAL_L, C: NEUTRAL_C, dH: NEUTRAL_L.map(() => 0) } : curvesForHue(anchor ? anchor.lch.h : h);
  let L = [...base.L];
  let k = -1;
  const hue0 = anchor ? anchor.lch.h : h;
  let peak = cPeak;
  if (anchor) {
    k = anchorStop != null ? STOPS.indexOf(Number(anchorStop)) : L.reduce((best, l, i) => (Math.abs(l - anchor.lch.l) < Math.abs(L[best] - anchor.lch.l) ? i : best), 0);
    if (k < 0) throw new Error(`--anchor-stop must be one of ${STOPS.join(', ')}`);
    const delta = anchor.lch.l - L[k];
    L = L.map((l, i) => l + delta * (i <= k ? (k === 0 ? 1 : i / k) : (10 - i) / (10 - k)));
    peak = anchor.lch.c < 0.02 ? anchor.lch.c : Math.min(0.37, anchor.lch.c / Math.max(base.C[k], 0.05));
  }
  const ref = k >= 0 ? base.dH[k] : base.dH[5];
  return STOPS.map((stop, i) => {
    if (i === k) return { stop, hex: anchor.hex, lch: anchor.lch, anchored: true };
    const hex = oklchToHex(clampChroma({ l: L[i], c: peak * base.C[i], h: (hue0 + base.dH[i] - ref + 360) % 360 }));
    return { stop, hex, lch: hexToOklch(hex), anchored: false };
  });
}

const normHex = (input) => {
  const c = parseColor(input);
  if (!c || (c.alpha !== undefined && c.alpha < 1)) return null;
  return toHex(c);
};

function pickStatusHue(name, avoid) {
  const s = STATUS[name];
  const score = (h) => (avoid.length ? Math.min(...avoid.map((a) => hueDiff(h, a))) : 180);
  if (score(s.h) >= 25) return { h: s.h, gap: score(s.h), moved: false };
  let best = s.h;
  for (let h = s.lo; h <= s.hi; h++) if (score(h) > score(best) || (score(h) === score(best) && Math.abs(h - s.h) < Math.abs(best - s.h))) best = h;
  return { h: best, gap: score(best), moved: best !== s.h };
}

/** First index in `order` whose color passes every [otherHex, min] contrast test. */
function firstPassing(scale, order, tests) {
  for (const i of order) if (i >= 0 && i < scale.length && tests.every(([other, min]) => ratio(scale[i].hex, other) >= min)) return i;
  return -1;
}

/** Most readable foreground for a fill: white or one of the given dark colors. */
function bestFg(fillHex, darks) {
  return [WHITE, ...darks].map((hex) => ({ hex, r: ratio(hex, fillHex) })).sort((a, b) => b.r - a.r)[0];
}

/** A button fill must stand out from a white card: some contrast or clear color (yellow on white is fine, white is not). */
const visibleOnWhite = (s) => ratio(s.hex, WHITE) >= 1.4 || s.lch.c >= 0.08;

/** Hover shade: away from the label color (white label → darker fill); label must still pass and the fill stay visible. */
function hoverIndex(scale, i, fg, min, needVisible = true) {
  const pref = fg === WHITE ? [i + 1, i - 1, i + 2] : [i - 1, i + 1, i - 2];
  for (const j of pref) if (j >= 0 && j < scale.length && ratio(fg, scale[j].hex) >= min && (!needVisible || visibleOnWhite(scale[j]))) return j;
  return i;
}

/**
 * Build the full palette.
 * opts: { brand, accent, feel, industry, hue, chroma, lightness, harmony, neutral, onPrimary, lang, competitors, anchorStop, name }
 */
export function buildPalette(opts = {}) {
  const fa = opts.lang === 'fa' || opts.lang === 'both';
  const T = fa ? FA_HOUSE_TEXT : 4.5;
  const TL = 4.5; // button labels: ≥ 14px semibold by the component spec → WCAG floor, also for Persian
  const need = '4.5:1 (WCAG AA)';
  const decisions = [];
  const warnings = [];

  // 1. Seed
  const feelKey = opts.feel ? (FEELS[opts.feel] ? opts.feel : FEEL_ALIASES[opts.feel]) : null;
  if (opts.feel && !feelKey) throw new Error(`Unknown --feel "${opts.feel}". Use one of: ${Object.keys(FEELS).join(', ')}`);
  const feel = feelKey ? FEELS[feelKey] : null;
  let brandHex;
  let fromUser = false;
  if (opts.brand) {
    brandHex = normHex(opts.brand);
    if (!brandHex) throw new Error(`--brand "${opts.brand}" is not an opaque color (use a hex like #0f766e).`);
    fromUser = true;
  } else if (opts.hue != null || feel) {
    const lch = { l: opts.lightness ?? feel?.l ?? 0.55, c: opts.chroma ?? feel?.c ?? 0.14, h: opts.hue ?? feel.h };
    brandHex = oklchToHex(lch);
    decisions.push(`No brand color was given, so the starting color ${brandHex} comes from ${feel ? `the "${feelKey}" feel (${feel.label})` : `hue ${lch.h}°`}. Replace it with a real brand color when you have one.`);
  } else throw new Error(`Give a brand color (--brand "#0f766e"), a --feel (${Object.keys(FEELS).join(', ')}), or a --hue.`);
  const brandLch = hexToOklch(brandHex);
  const chromatic = brandLch.c >= 0.04;

  // 2. Scales
  const primary = buildScale({ anchor: { hex: brandHex, lch: brandLch }, anchorStop: opts.anchorStop });
  const k = primary.findIndex((s) => s.anchored);
  if (fromUser) decisions.push(`Your exact brand color ${brandHex} is kept unchanged as brand-${STOPS[k]}; the other 10 shades are built around it (same hue family, Tailwind-like lightness steps).`);
  if (!chromatic) warnings.push(`The brand color ${brandHex} is almost gray (chroma ${brandLch.c.toFixed(3)}). Gray buttons can look disabled — the accent color carries highlights; consider a colored accent for key actions.`);

  const nMode = opts.neutral || 'tinted';
  const warm = brandLch.h < 110 || brandLch.h > 330;
  const nPeak = nMode === 'pure' ? 0 : nMode === 'warm' ? 0.014 : nMode === 'cool' ? 0.02 : chromatic ? (warm ? 0.012 : 0.018) : Math.min(0.012, brandLch.c);
  const nHue = nMode === 'warm' ? 60 : nMode === 'cool' ? 250 : brandLch.h;
  const neutral = buildScale({ h: nHue, cPeak: nPeak, neutral: true });
  decisions.push(nMode === 'pure' || nPeak < 0.002 ? 'Grays are pure (no tint).' : `Grays carry a faint ${nMode === 'tinted' ? 'tint of the brand hue' : `${nMode} tint`} (chroma ≤ ${nPeak.toFixed(3)}) so the page feels related to the brand without looking colored.`);

  let accent;
  let accentAnchored = false;
  if (opts.accent) {
    const aHex = normHex(opts.accent);
    if (!aHex) throw new Error(`--accent "${opts.accent}" is not an opaque color.`);
    accent = buildScale({ anchor: { hex: aHex, lch: hexToOklch(aHex) } });
    accentAnchored = true;
    decisions.push(`Your accent color ${aHex} is kept exactly as accent-${STOPS[accent.findIndex((s) => s.anchored)]}.`);
    const near = [STATUS.danger, STATUS.success].filter((s) => hueDiff(accent[5].lch.h, s.h) < ACCENT_STATUS_GAP && accent[5].lch.c >= 0.04);
    if (near.length) warnings.push(`Your accent ${aHex} is close in hue to the ${near.map((s) => (s === STATUS.danger ? 'error red' : 'success green')).join(' and ')} status color, so badges in it may be read as messages. Keep it away from alerts, or pick an accent ≥ ${ACCENT_STATUS_GAP}° away.`);
  } else {
    // Precedence: --harmony flag > --industry policy > the feel's accent > complementary.
    const industryKey = opts.industry ? (INDUSTRIES[opts.industry] ? opts.industry : INDUSTRY_ALIASES[opts.industry]) : null;
    if (opts.industry && !industryKey) throw new Error(`Unknown --industry "${opts.industry}". Use one of: ${Object.keys(INDUSTRIES).join(', ')}`);
    const policy = opts.harmony ? opts.harmony : industryKey ? INDUSTRIES[industryKey].accent : feel?.accentH != null ? 'fixed' : feel?.harmony || 'complementary';
    if (policy === 'none') accent = primary;
    else {
      const baseH = chromatic ? brandLch.h : 255;
      let pref;
      let why;
      let cPeak = Math.min(0.2, Math.max(0.12, brandLch.c / 0.9));
      if (policy === 'warm') {
        // Saffron-gold: warm and friendly, far from error red and success green (and lets "warning" move to orange).
        pref = hueDiff(WARM_ACCENT_H, baseH) >= 30 ? WARM_ACCENT_H : baseH + 180;
        why = pref === WARM_ACCENT_H ? `a warm saffron-gold, because ${INDUSTRIES[industryKey]?.label || 'this kind of site'} work best with a warm, friendly accent` : 'complementary, because your brand is already warm-yellow';
      } else if (policy === 'restrained') {
        pref = baseH + 35;
        cPeak = 0.07;
        why = `a quiet analogous tone (low chroma), because ${INDUSTRIES[industryKey]?.label || 'this kind of site'} should look restrained`;
      } else if (policy === 'gold') {
        pref = GOLD_ACCENT_H;
        cPeak = 0.1;
        why = 'a soft gold, for a premium feel';
      } else if (policy === 'fixed') {
        pref = feel.accentH;
        why = 'set by the feel';
      } else {
        pref = baseH + (HARMONY[policy] ?? 180);
        why = opts.harmony ? `${policy} (your choice)` : industryKey ? `${policy}, the usual choice for ${INDUSTRIES[industryKey].label}` : policy;
      }
      // Fallback order when the preferred hue sits too close to a status color: saffron-gold, then the two split hues.
      const pick = safeAccentHue([pref, WARM_ACCENT_H, baseH + 150, baseH + 210], chromatic ? brandLch.h : null);
      accent = buildScale({ h: pick.h, cPeak });
      const text = pick.moved
        ? `Accent hue ${Math.round(pick.h)}°${Math.round(pick.h) === WARM_ACCENT_H ? ' (saffron-gold)' : ''}: the ${why} hue would be ${Math.round(pick.from)}°, within ${ACCENT_STATUS_GAP}° of error red or success green, so badges could be mistaken for messages`
        : `Accent hue ${Math.round(pick.h)}°: ${why}`;
      decisions.push(`${text}. Use it for at most ~10% of the screen: badges, highlights, illustrations — never as a second button color.`);
    }
  }

  const avoid = [];
  if (chromatic) avoid.push(brandLch.h);
  if (accent !== primary && accent[5].lch.c >= 0.04) avoid.push(accent[5].lch.h);
  const status = {};
  for (const name of Object.keys(STATUS)) {
    const pick = pickStatusHue(name, avoid);
    status[name] = buildScale({ h: pick.h, cPeak: STATUS[name].c });
    if (pick.moved) decisions.push(`"${name}" hue moved from ${STATUS[name].h}° to ${pick.h}° to stay distinct from the brand/accent hue.`);
    if (pick.gap < 20) warnings.push(`"${name}" (${pick.h}°) is close in hue to your brand/accent. Users will tell them apart by icon, text and shade — always show the ${name} icon and word, never color alone.`);
  }

  // 3. Light tokens
  const n = neutral;
  const darksFor = (scale) => [scale[10].hex, n[10].hex];
  const L = { bg: n[0].hex, surface: WHITE, 'surface-subtle': n[1].hex, border: n[2].hex };
  const D = { bg: n[10].hex, surface: n[9].hex, 'surface-subtle': n[8].hex, border: n[8].hex };
  L['border-strong'] = n[firstPassing(n, range(4, 9), [[L.surface, 3], [L.bg, 3]])].hex;
  L.text = n[9].hex;
  L.muted = n[firstPassing(n, range(5, 9), [[L.bg, T], [L.surface, T], [L['surface-subtle'], T]])].hex;

  const brandFill = primary[k].hex;
  const whiteOnBrand = ratio(WHITE, brandFill);
  const darkOnBrand = darksFor(primary).map((hex) => ({ hex, r: ratio(hex, brandFill) })).sort((a, b) => b.r - a.r)[0];
  let mode = opts.onPrimary || 'auto';
  const brandVisible = visibleOnWhite(primary[k]);
  if (mode === 'auto') mode = whiteOnBrand >= TL && brandVisible ? 'white' : darkOnBrand.r >= TL && brandLch.l >= 0.65 ? 'dark' : 'white';
  let iPrimary = -1;
  let fg = WHITE;
  if (mode === 'dark') {
    iPrimary = [...range(k, 0), ...range(k + 1, 10)].find((i) => visibleOnWhite(primary[i]) && Math.max(...darksFor(primary).map((d) => ratio(d, primary[i].hex))) >= TL) ?? -1;
    if (iPrimary < 0) { mode = 'white'; decisions.push('Dark text could not reach the target on any brand shade, so buttons fall back to white text.'); }
    else fg = bestFg(primary[iPrimary].hex, darksFor(primary)).hex;
  }
  if (mode === 'white') {
    iPrimary = range(k, 10).find((i) => visibleOnWhite(primary[i]) && ratio(WHITE, primary[i].hex) >= TL) ?? -1;
    if (iPrimary < 0) iPrimary = 10;
    fg = WHITE;
  }
  L.primary = primary[iPrimary].hex;
  L['primary-fg'] = fg;
  const fgWord = fg === WHITE ? 'white' : 'dark';
  if (iPrimary === k) {
    decisions.push(`Buttons use the exact brand color with ${fgWord} text (${fmtRatio(ratio(fg, L.primary))}:1, needs ${need}).`);
  } else {
    const why = !brandVisible ? 'Your exact brand color is too close to white to show as a button on a white card'
      : fg === WHITE ? `White text on your exact brand color is only ${fmtRatio(whiteOnBrand)}:1 (needs ${need})`
        : `Dark text on your exact brand color is only ${fmtRatio(darkOnBrand.r)}:1 (needs ${need})`;
    const alt = brandVisible && fg === WHITE && darkOnBrand.r >= TL
      ? ` Alternative: keep the exact brand color with dark text ${darkOnBrand.hex} (${fmtRatio(darkOnBrand.r)}:1) — run again with --on-primary dark.` : '';
    decisions.push(`${why}. So buttons use the ${iPrimary > k ? 'darker' : 'lighter'} shade brand-${STOPS[iPrimary]} ${L.primary} with ${fgWord} text (${fmtRatio(ratio(fg, L.primary))}:1). Your exact brand color ${brandFill} stays in --brand for the logo, illustrations, large headings and decorative accents.${alt}`);
  }
  L['primary-hover'] = primary[hoverIndex(primary, iPrimary, fg, TL)].hex;
  L['primary-subtle'] = primary[0].hex;
  L['primary-ink'] = primary[firstPassing(primary, range(Math.min(k, iPrimary), 10), [[L.bg, T], [L.surface, T], [L['primary-subtle'], T]])].hex;
  if (L['primary-ink'] !== L.primary) decisions.push(`For brand-colored text and links on light backgrounds use text-primary-ink (${L['primary-ink']}), not text-primary — it is the first brand shade that is readable as text.`);
  L.brand = brandFill;
  L.focus = L['primary-ink'];

  const pickAccent = (startIdx, dark) => {
    const order = dark ? range(startIdx, 0) : [...range(startIdx, 0), ...range(startIdx + 1, 10)];
    for (const i of order) {
      const f = bestFg(accent[i].hex, darksFor(accent));
      if (f.r >= T && (!dark || ratio(accent[i].hex, D.bg) >= 3)) return { i, fg: f.hex };
    }
    return { i: startIdx, fg: bestFg(accent[startIdx].hex, darksFor(accent)).hex };
  };
  const accentStart = accentAnchored ? accent.findIndex((s) => s.anchored) : 5;
  const aL = pickAccent(accentStart, false);
  L.accent = accent[aL.i].hex;
  L['accent-fg'] = aL.fg;

  for (const name of Object.keys(STATUS)) {
    const s = status[name];
    L[`${name}-subtle`] = s[0].hex;
    L[name] = s[firstPassing(s, range(5, 10), [[L.surface, T], [L.bg, T], [L[`${name}-subtle`], T]])].hex;
  }

  // 4. Dark tokens
  D['border-strong'] = n[firstPassing(n, range(6, 0), [[D.surface, 3], [D.bg, 3]])].hex;
  D.text = n[1].hex;
  D.muted = n[firstPassing(n, range(4, 0), [[D.bg, T], [D.surface, T], [D['surface-subtle'], T]])].hex;
  let dPrim = -1;
  let dFg = WHITE;
  for (const i of range(Math.max(k, 3), 1)) {
    const f = bestFg(primary[i].hex, darksFor(primary));
    if (f.r >= TL && ratio(primary[i].hex, D.bg) >= 3) { dPrim = i; dFg = f.hex; break; }
  }
  if (dPrim < 0) { dPrim = 3; dFg = bestFg(primary[3].hex, darksFor(primary)).hex; }
  let dPrimaryHex = primary[dPrim].hex;
  let softened = false;
  if (dPrim !== k && primary[dPrim].lch.c > 0.18) {
    const soft = oklchToHex({ ...primary[dPrim].lch, c: primary[dPrim].lch.c * 0.85 });
    if (ratio(dFg, soft) >= TL && ratio(soft, D.bg) >= 3) { dPrimaryHex = soft; softened = true; }
  }
  D.primary = dPrimaryHex;
  D['primary-fg'] = dFg;
  if (dPrim === k) decisions.push('Dark mode keeps the exact brand color for buttons.');
  else decisions.push(`Dark mode buttons use the ${dPrim < k ? 'lighter' : 'darker'} shade brand-${STOPS[dPrim]}${softened ? ' with 15% less chroma (so it does not glow)' : ''} ${dPrimaryHex} with ${dFg === WHITE ? 'white' : 'dark'} text (${fmtRatio(ratio(dFg, dPrimaryHex))}:1), so the button stands out from the dark page (≥ 3:1) and its label stays readable.`);
  D['primary-hover'] = primary[hoverIndex(primary, dPrim, dFg, TL, false)].hex;
  D['primary-subtle'] = primary[10].hex;
  D['primary-ink'] = primary[Math.max(0, firstPassing(primary, range(5, 0), [[D.bg, T], [D.surface, T], [D['primary-subtle'], T]]))].hex;
  D.brand = brandFill;
  D.focus = D['primary-ink'];
  const aD = pickAccent(Math.min(aL.i, 4), true);
  D.accent = accent[aD.i].hex;
  D['accent-fg'] = aD.fg;
  for (const name of Object.keys(STATUS)) {
    const s = status[name];
    D[`${name}-subtle`] = s[10].hex;
    D[name] = s[Math.max(0, firstPassing(s, range(4, 0), [[D.surface, T], [D.bg, T], [D[`${name}-subtle`], T]]))].hex;
  }

  // 5. Contrast matrix (every pair, both modes)
  const matrix = [];
  for (const [modeName, tok] of [['light', L], ['dark', D]]) {
    for (const [f, b, kind] of PAIRS) {
      const r = ratio(tok[f], tok[b]);
      const target = targetFor(kind, fa);
      matrix.push({ mode: modeName, fg: f, bg: b, kind, fgHex: tok[f], bgHex: tok[b], ratio: r, apca: apca(parseColor(tok[f]), parseColor(tok[b])), target, wcag: wcagFloor(kind), pass: r >= target });
    }
    for (const b of ['bg', 'surface']) {
      const r = ratio(tok.brand, tok[b]);
      matrix.push({ mode: modeName, fg: 'brand', bg: b, kind: 'decor', fgHex: tok.brand, bgHex: tok[b], ratio: r, apca: apca(parseColor(tok.brand), parseColor(tok[b])), target: 3, wcag: 3, pass: true, note: r >= 3 ? 'ok for large text (≥ 24px) and graphics' : 'decoration only (below 3:1)' });
    }
  }
  const failures = matrix.filter((m) => !m.pass);
  if (ratio(brandFill, D.bg) < 3) warnings.push(`In dark mode your exact brand color ${brandFill} is only ${fmtRatio(ratio(brandFill, D.bg))}:1 against the dark page, so a logo or heading in it would nearly disappear. Use a light (reversed) logo in dark mode — brand-logo-studio exports one — and text-primary-ink (${D['primary-ink']}) for brand-colored text.`);
  if (ratio(brandFill, L.surface) < 3) warnings.push(`Your exact brand color ${brandFill} is only ${fmtRatio(ratio(brandFill, L.surface))}:1 on white: fine for large shapes and illustrations, too light for a logo wordmark or text on light backgrounds — use a darker logo version there.`);

  // 6. Competitors
  const competitors = [];
  for (const comp of opts.competitors || []) {
    const hex = normHex(comp.hex);
    if (!hex) continue;
    const c = hexToOklch(hex);
    if (!chromatic || c.c < 0.04) continue;
    const dH = hueDiff(brandLch.h, c.h), dL = Math.abs(brandLch.l - c.l), dC = Math.abs(brandLch.c - c.c);
    if (dH < 25 && dL <= 0.12 && dC <= 0.08) {
      competitors.push({ ...comp, hex, dH, dL, dC });
      warnings.push(`Your brand ${brandHex} is close to ${comp.name} ${hex}${comp.category ? ` (${comp.category})` : ''}: hue ${dH.toFixed(0)}° apart, lightness ${dL.toFixed(2)}, chroma ${dC.toFixed(2)}. Fine in a different category; in the same category shift the hue ≥ 25° or change lightness clearly.${comp.evidence ? ` [data: ${comp.evidence}, checked ${comp.checked || '?'} — verify]` : ''}`);
    }
  }

  // 7. Color-vision check (light tokens)
  const cvd = [];
  for (const [a, b] of [['success', 'danger'], ['warning', 'danger'], ['success', 'warning'], ['primary', 'danger'], ['primary', 'success'], ['info', 'primary']]) {
    for (const type of ['protan', 'deutan', 'tritan', 'achroma']) {
      const d = deltaEOK(simulateCvd(parseColor(L[a]), type), simulateCvd(parseColor(L[b]), type));
      if (d < 0.05) cvd.push({ a, b, type, deltaE: d });
    }
  }

  return {
    meta: { name: opts.name || 'Brand', lang: opts.lang || 'en', target: T, fa, generated: new Date().toISOString().slice(0, 10) },
    brand: { hex: brandHex, oklch: brandLch, stop: STOPS[k], fromUser },
    scales: { brand: primary, accent, base: neutral, ...status },
    tokens: { light: L, dark: D },
    matrix, failures, competitors, cvd, decisions, warnings,
  };
}

/** Parse the competitor table in references/iran-brand-colors.md (rows whose 3rd column holds a hex). */
export function parseBrandTable(md) {
  const rows = [];
  for (const line of md.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 7) continue;
    const hex = (cells[3].match(/#[0-9a-fA-F]{6}\b/) || [])[0];
    if (!hex) continue;
    rows.push({ name: cells[1], category: cells[2], hex: hex.toLowerCase(), evidence: cells[4].split('(')[0].trim(), checked: cells[5] });
  }
  return rows;
}
