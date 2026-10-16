/**
 * brand-logo-studio — bidi.mjs
 * Persian normalization and a small bidi splitter for short logo strings.
 *
 * Why: shaping a whole mixed string as RTL reverses digits and Latin words («کلاس IELTS ۱۲۳» would
 * come out with "STLEI" and "۳۲۱"). Each run must be shaped in its own direction and the runs placed
 * in visual order. This is a simplified Unicode bidi algorithm (one paragraph level, no embeddings),
 * verified against Chrome on mixed strings — see references/persian-wordmarks.md §3.
 */

/** Arabic → Persian letters and digits; keep ZWNJ; NFC. Returns { text, changes[] }. */
export function normalizePersian(input) {
  const changes = [];
  const map = { 'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ة': 'ه' };
  let out = '';
  for (const ch of String(input).normalize('NFC')) {
    const c = ch.codePointAt(0);
    if (map[ch]) { out += map[ch]; changes.push(`${ch} (U+${c.toString(16).toUpperCase()}) → ${map[ch]}`); }
    else if (c >= 0x0660 && c <= 0x0669) { const p = String.fromCodePoint(c - 0x0660 + 0x06f0); out += p; changes.push(`Arabic digit ${ch} → Persian ${p}`); }
    else out += ch;
  }
  if (/ (ها|های|تر|ترین)(?=\s|$)/.test(out) || /(^|\s)(ن?می) (?=[؀-ۿ])/.test(out)) changes.push('⚠ a space where a ZWNJ (نیم‌فاصله) is probably meant — check the spelling');
  return { text: out, changes };
}

const cls = (ch) => {
  const c = ch.codePointAt(0);
  if (c === 0x200c || c === 0x200d) return 'J'; // joiners stay inside their run
  if ((c >= 0x0610 && c <= 0x061a) || (c >= 0x064b && c <= 0x065f) || c === 0x0670) return 'NSM';
  if ((c >= 0x06f0 && c <= 0x06f9) || (c >= 0x30 && c <= 0x39) || (c >= 0x0660 && c <= 0x0669)) return 'EN';
  if ((c >= 0x0600 && c <= 0x06ff) || (c >= 0x0750 && c <= 0x077f) || (c >= 0xfb50 && c <= 0xfeff)) return 'R';
  if (/\p{L}/u.test(ch)) return 'L';
  return 'N';
};

/** Split into directional runs, returned in visual order (left to right). base: 'rtl' | 'ltr' | 'auto'. */
export function bidiRuns(text, base = 'auto') {
  const chars = [...text];
  if (base === 'auto') { const first = chars.map(cls).find((t) => t === 'R' || t === 'L'); base = first === 'L' ? 'ltr' : 'rtl'; }
  const types = chars.map(cls);
  for (let i = 0; i < types.length; i++) if (types[i] === 'NSM' || types[i] === 'J') types[i] = i ? types[i - 1] : base === 'rtl' ? 'R' : 'L';
  const strong = types.map((t) => (t === 'R' ? 'rtl' : t === 'L' || t === 'EN' ? 'ltr' : null));
  for (let i = 0; i < strong.length; i++) {
    if (strong[i]) continue;
    let a = i - 1; while (a >= 0 && !strong[a]) a--;
    let b = i + 1; while (b < strong.length && !strong[b]) b++;
    const L = a >= 0 ? strong[a] : base, R = b < strong.length ? strong[b] : base;
    strong[i] = L === R ? L : base;
  }
  const runs = [];
  chars.forEach((ch, i) => { const d = strong[i]; if (runs.length && runs.at(-1).dir === d) runs.at(-1).text += ch; else runs.push({ dir: d, text: ch }); });
  return { base, runs: base === 'rtl' ? runs.reverse() : runs };
}

/** True when the string contains Persian/Arabic letters. */
export const hasPersian = (s) => /[؀-ۿﭐ-﻿]/.test(s);
/** True when the string contains Latin letters (decides the Kart-e Bazargani note — legal-iran.md). */
export const hasLatin = (s) => /[A-Za-z]/.test(s);
