/**
 * brand-logo-studio — letters.mjs
 * Persian letters in context: names, how many dots each form should show, and a split of a shaped word into
 * per-letter glyph groups (HarfBuzz clusters) in reading order. Used by the proof sheet and the accent dot.
 */
import { findDots } from './path.mjs';

/** letter → [Persian name, dots in the isolated form]. ی is form-dependent (see expectedMarks). */
export const NAMES = { 'ا': ['الف', 0], 'آ': ['آ', 0], 'ب': ['به', 1], 'پ': ['په', 3], 'ت': ['ته', 2], 'ث': ['ثه', 3], 'ج': ['جیم', 1], 'چ': ['چه', 3], 'ح': ['حه', 0], 'خ': ['خه', 1], 'د': ['دال', 0], 'ذ': ['ذال', 1], 'ر': ['ره', 0], 'ز': ['زه', 1], 'ژ': ['ژه', 3], 'س': ['سین', 0], 'ش': ['شین', 3], 'ص': ['صاد', 0], 'ض': ['ضاد', 1], 'ط': ['طا', 0], 'ظ': ['ظا', 1], 'ع': ['عین', 0], 'غ': ['غین', 1], 'ف': ['فه', 1], 'ق': ['قاف', 2], 'ک': ['کاف', 0], 'گ': ['گاف', 0], 'ل': ['لام', 0], 'م': ['میم', 0], 'ن': ['نون', 1], 'و': ['واو', 0], 'ه': ['هه', 0], 'ی': ['یه', 0], 'ئ': ['یه همزه', null], 'ء': ['همزه', null] };

/** Letters that join on both sides; all other letters join only to the letter before them. */
export const DUAL = new Set([...'بپتثجچحخسشصضطظعغفقکگلمنهیئ']);

/** A separate mark counts as a dot if it is under 45% of its letter's main shape (a joined ی's two dots can be 37%). */
export const DOT_SHARE = 0.45;

/**
 * Separate marks expected for one letter in its form: { min, max, dots, note }.
 * Two or three dots may be drawn as one shape, so 1..n is accepted; گ's second stroke may be a separate shape.
 */
export function expectedMarks(ch, joinsNext) {
  if (ch === 'ی') return joinsNext ? { min: 1, max: 2, dots: 2 } : { min: 0, max: 0, dots: 0 };
  if (ch === 'گ') return { min: 0, max: 1, dots: 0, note: 'second stroke may be drawn separately' };
  const v = NAMES[ch]?.[1];
  if (v == null) return null;
  return { min: v > 1 ? 1 : v, max: v, dots: v };
}

/** Split a shapeText() result into letters in reading order: [{ seg[], glyphs, d, next, joinsNext } | { zwnj }]. */
export function lettersInContext(word) {
  const logical = word.base === 'rtl' ? [...word.runs].reverse() : word.runs;
  const runStart = new Map(); let off = 0;
  for (const r of logical) { runStart.set(word.runs.indexOf(r), off); off += [...r.text].length; }
  const groups = new Map();
  for (const g of word.glyphs) { const li = runStart.get(g.run) + g.cluster; if (!groups.has(li)) groups.set(li, []); groups.get(li).push(g); }
  const starts = [...groups.keys()].sort((a, b) => a - b), chars = [...word.text], out = [];
  for (let k = 0; k < starts.length; k++) {
    const from = starts[k], to = k + 1 < starts.length ? starts[k + 1] : chars.length, raw = chars.slice(from, to);
    const seg = raw.filter((ch) => ch !== ' ' && ch !== '‌');
    if (seg.length) {
      const next = chars[from + raw.lastIndexOf(seg.at(-1)) + 1];
      const joinsNext = DUAL.has(seg.at(-1)) && next != null && /[ء-ۿ]/.test(next);
      out.push({ seg, glyphs: groups.get(from), d: groups.get(from).map((g) => g.d).join(''), next, joinsNext });
    }
    if (raw.includes('‌')) out.push({ seg: ['‌'], zwnj: true });
  }
  return out;
}

/** Indices (into the letter's own subpaths) of its dots. */
export const letterDots = (d) => findDots(d, DOT_SHARE);
