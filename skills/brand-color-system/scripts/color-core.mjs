/**
 * brand-color-system — color-core.mjs
 * Zero-dependency color math: parsing, sRGB ↔ OKLab/OKLCH, sRGB gamut clamping,
 * WCAG 2.x contrast, APCA (W3 0.1.9 constants), color-vision-deficiency simulation.
 *
 * All colors are plain objects:
 *   rgb   {r, g, b, alpha?}   gamma-encoded sRGB, 0..1 (may be out of 0..1 before clamping)
 *   oklch {l, c, h}           l 0..1, c ≥ 0, h degrees 0..360
 *
 * Verified against culori 4.0.2 and apca-w3 0.1.9 by scripts/selftest.mjs (golden values).
 */

export const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// ---------- sRGB transfer ----------
export const srgbToLinear = (c) => {
  const a = Math.abs(c);
  return a <= 0.04045 ? c / 12.92 : Math.sign(c) * Math.pow((a + 0.055) / 1.055, 2.4);
};
export const linearToSrgb = (c) => {
  const a = Math.abs(c);
  return a <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * Math.pow(a, 1 / 2.4) - 0.055);
};

// ---------- OKLab (Björn Ottosson, 2020) ----------
export function rgbToOklab({ r, g, b }) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}
export function oklabToRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}
export function rgbToOklch(rgb) {
  const { L, a, b } = rgbToOklab(rgb);
  const c = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}
export function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  return oklabToRgb({ L: l, a: c * Math.cos(hr), b: c * Math.sin(hr) });
}

// ---------- gamut ----------
export const inGamut = ({ r, g, b }, eps = 1e-5) =>
  r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps;

/** Largest chroma at this lightness and hue that is still inside sRGB (binary search, L and H locked). */
export function maxChroma(l, h) {
  if (l <= 0 || l >= 1) return 0;
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToRgb({ l, c: mid, h }))) lo = mid; else hi = mid;
  }
  return lo;
}
/** Keep L and H, reduce C until the color fits sRGB. */
export function clampChroma({ l, c, h }) {
  const L = Math.min(1, Math.max(0, l));
  if (inGamut(oklchToRgb({ l: L, c, h }))) return { l: L, c, h };
  return { l: L, c: maxChroma(L, h), h };
}
const clip01 = (x) => Math.min(1, Math.max(0, x));
export const clipRgb = ({ r, g, b, alpha }) => ({ r: clip01(r), g: clip01(g), b: clip01(b), ...(alpha !== undefined ? { alpha } : {}) });

// ---------- hex / CSS ----------
const h2 = (x) => Math.round(clip01(x) * 255).toString(16).padStart(2, '0');
export const toHex = ({ r, g, b }) => `#${h2(r)}${h2(g)}${h2(b)}`;
export const oklchToHex = (lch) => toHex(oklchToRgb(clampChroma(lch)));
export const hexToOklch = (hex) => rgbToOklch(parseColor(hex));

const round = (x, d) => Number(x.toFixed(d));
/** CSS oklch() string that round-trips to the same 8-bit hex (falls back to more digits, then to the hex). */
export function cssOklch(hex) {
  const target = hex.toLowerCase();
  const { l, c, h } = hexToOklch(target);
  for (const d of [3, 4, 5]) {
    const lch = { l: round(l, d), c: round(c, d), h: c < 1e-4 ? 0 : round(h, Math.max(1, d - 2)) };
    if (toHex(oklchToRgb(lch)) === target) return `oklch(${lch.l} ${lch.c} ${lch.h})`;
  }
  return target;
}

const NAMED = { white: '#ffffff', black: '#000000', transparent: '#00000000' };
const num = (s, pctScale = 1) => (s.trim().endsWith('%') ? (parseFloat(s) / 100) * pctScale : parseFloat(s));

/** Parse #rgb #rgba #rrggbb #rrggbbaa, rgb()/rgba(), hsl(), oklch(), white/black/transparent. Returns rgb or null. */
export function parseColor(input) {
  if (input == null) return null;
  let s = String(input).trim().toLowerCase();
  if (NAMED[s]) s = NAMED[s];
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let x = m[1];
    if (x.length === 3 || x.length === 4) x = [...x].map((ch) => ch + ch).join('');
    if (x.length !== 6 && x.length !== 8) return null;
    const v = (i) => parseInt(x.slice(i, i + 2), 16) / 255;
    return x.length === 8 ? { r: v(0), g: v(2), b: v(4), alpha: v(6) } : { r: v(0), g: v(2), b: v(4) };
  }
  m = s.match(/^(rgba?|hsla?|oklch)\(\s*([^)]*)\)$/);
  if (!m) return null;
  const parts = m[2].replace(/\s*\/\s*/, ' / ').split(/[\s,]+/).filter(Boolean).map((p) => (p === 'none' ? '0' : p));
  const slash = parts.indexOf('/');
  let alphaStr = null;
  let ch = parts;
  if (slash >= 0) { alphaStr = parts[slash + 1]; ch = parts.slice(0, slash); }
  else if (parts.length === 4) { alphaStr = parts[3]; ch = parts.slice(0, 3); }
  if (ch.length !== 3 || ch.some((p) => Number.isNaN(parseFloat(p)))) return null;
  const alpha = alphaStr == null ? undefined : num(alphaStr);
  let rgb;
  if (m[1].startsWith('rgb')) rgb = { r: num(ch[0], 255) / 255, g: num(ch[1], 255) / 255, b: num(ch[2], 255) / 255 };
  else if (m[1].startsWith('hsl')) {
    const H = parseFloat(ch[0]), S = num(ch[1]), Lh = num(ch[2]);
    const sat = S > 1 ? S / 100 : S, lig = Lh > 1 ? Lh / 100 : Lh;
    const f = (n) => { const k = (n + H / 30) % 12; const a = sat * Math.min(lig, 1 - lig); return lig - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    rgb = { r: f(0), g: f(8), b: f(4) };
  } else rgb = oklchToRgb({ l: num(ch[0]), c: num(ch[1], 0.4), h: parseFloat(ch[2]) });
  return alpha === undefined ? rgb : { ...rgb, alpha };
}

/** Paint a (possibly translucent) color over an opaque background. */
export function composite(fg, bg) {
  const a = fg.alpha ?? 1;
  if (a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
}

// ---------- contrast ----------
/** WCAG 2.x relative luminance (colors are clipped to sRGB first, as a display would). */
export function luminance(rgb) {
  const { r, g, b } = clipRgb(rgb);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
export function contrast(a, b) {
  const y1 = luminance(a), y2 = luminance(b);
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
}
/** Truncate (never round up) so 4.497 is shown as 4.49, not 4.50. */
export const fmtRatio = (x) => (Math.floor(x * 100) / 100).toFixed(2);

/** APCA Lc (W3 0.1.9 constants). Positive = dark text on light bg, negative = light text on dark bg. */
export function apca(text, bg) {
  const Y = (c) => { const { r, g, b } = clipRgb(c); return 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4; };
  let t = Y(text), k = Y(bg);
  const blkThrs = 0.022, blkClmp = 1.414;
  t = t > blkThrs ? t : t + (blkThrs - t) ** blkClmp;
  k = k > blkThrs ? k : k + (blkThrs - k) ** blkClmp;
  if (Math.abs(k - t) < 0.0005) return 0;
  let out;
  if (k > t) { const s = (k ** 0.56 - t ** 0.57) * 1.14; out = s < 0.1 ? 0 : s - 0.027; }
  else { const s = (k ** 0.65 - t ** 0.62) * 1.14; out = s > -0.1 ? 0 : s + 0.027; }
  return out * 100;
}

// ---------- color-vision deficiency (Machado, Oliveira & Fernandes 2009, severity 1.0) ----------
// Applied in linear RGB. Achromatopsia = luminance only.
const CVD = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
};
export function simulateCvd(rgb, type) {
  const c = clipRgb(rgb);
  const r = srgbToLinear(c.r), g = srgbToLinear(c.g), b = srgbToLinear(c.b);
  if (type === 'achroma') { const y = linearToSrgb(0.2126 * r + 0.7152 * g + 0.0722 * b); return { r: y, g: y, b: y }; }
  const M = CVD[type];
  if (!M) throw new Error(`unknown CVD type ${type}`);
  return clipRgb({
    r: linearToSrgb(M[0] * r + M[1] * g + M[2] * b),
    g: linearToSrgb(M[3] * r + M[4] * g + M[5] * b),
    b: linearToSrgb(M[6] * r + M[7] * g + M[8] * b),
  });
}

// ---------- differences ----------
export function deltaEOK(a, b) {
  const p = rgbToOklab(a), q = rgbToOklab(b);
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}
export const hueDiff = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };
