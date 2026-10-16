#!/usr/bin/env node
/**
 * brand-logo-studio — proof-sheet.mjs
 *
 *   node proof-sheet.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--out brand-kit/proof]
 *
 * A large visual proof for a human to confirm every letter and dot of a Persian wordmark:
 *   1. the outlined wordmark, very large;  2. the same text rendered by Chrome (if installed);
 *   3. every character on its own, with its Persian name, codepoint, and detected/expected dot count.
 * Automatic checks cannot replace this look: dots, joins and ZWNJ breaks are confirmed by eye.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shapeText } from './lib/shape.mjs';
import { render } from './lib/vendor.mjs';
import { transformPath, findDots } from './lib/path.mjs';
import { outDir, decodePng } from './lib/util.mjs';
import { compareWithChrome } from './shaping-check.mjs';

const NAMES = { 'ا': ['الف', 0], 'آ': ['آ', 0], 'ب': ['به', 1], 'پ': ['په', 3], 'ت': ['ته', 2], 'ث': ['ثه', 3], 'ج': ['جیم', 1], 'چ': ['چه', 3], 'ح': ['حه', 0], 'خ': ['خه', 1], 'د': ['دال', 0], 'ذ': ['ذال', 1], 'ر': ['ره', 0], 'ز': ['زه', 1], 'ژ': ['ژه', 3], 'س': ['سین', 0], 'ش': ['شین', 3], 'ص': ['صاد', 0], 'ض': ['ضاد', 1], 'ط': ['طا', 0], 'ظ': ['ظا', 1], 'ع': ['عین', 0], 'غ': ['غین', 1], 'ف': ['فه', 1], 'ق': ['قاف', 2], 'ک': ['کاف', 0], 'گ': ['گاف', 0], 'ل': ['لام', 0], 'م': ['میم', 0], 'ن': ['نون', 1], 'و': ['واو', 0], 'ه': ['هه', 0], 'ی': ['یه', 0], 'ئ': ['یه همزه', 0], 'ء': ['همزه', 0], '‌': ['نیم‌فاصله', null] };

async function label(text, font, size, x, y, color = '#111827', anchor = 'start') {
  const r = await shapeText(text, font, { size });
  const dx = anchor === 'middle' ? -r.width / 2 : anchor === 'end' ? -r.width : 0;
  return `<path fill="${color}" d="${transformPath(r.d, { tx: x + dx, ty: y })}"/>`;
}

export async function proofSheet(text, font, outFile) {
  const W = 2400, parts = [];
  let y = 70;
  parts.push(await label(`Proof sheet — ${font} — confirm every letter, dot and join by eye`, 'inter:600', 34, 60, y));
  y += 40;
  const big = await shapeText(text, font, { size: 300 });
  const scale = Math.min(1, (W - 160) / big.bbox.w);
  const bigH = big.bbox.h * scale;
  parts.push(`<rect x="40" y="${y}" width="${W - 80}" height="${bigH + 80}" fill="#ffffff"/><path fill="#111827" d="${transformPath(big.d, { sx: scale, sy: scale, tx: (W - big.bbox.w * scale) / 2 - big.bbox.x0 * scale, ty: y + 40 - big.bbox.y0 * scale })}"/>`);
  y += bigH + 110;
  parts.push(await label('Outline (HarfBuzz, used in the logo)', 'inter:500', 26, 60, y));
  y += 30;
  const cmp = await compareWithChrome(text, font, 200);
  if (cmp.chromePng) {
    const img = decodePng(cmp.chromePng);
    const s = Math.min(1, (W - 160) / img.width), h = img.height * s;
    parts.push(`<rect x="40" y="${y}" width="${W - 80}" height="${h + 20}" fill="#ffffff"/><image x="${(W - img.width * s) / 2}" y="${y + 10}" width="${img.width * s}" height="${h}" href="data:image/png;base64,${cmp.chromePng.toString('base64')}"/>`);
    y += h + 60;
    parts.push(await label(`Same text rendered by ${path.basename(cmp.browser)} — ink overlap ${(cmp.score * 100).toFixed(1)}% (${cmp.status})`, 'inter:500', 26, 60, y));
  } else parts.push(await label(`Browser reference skipped: ${cmp.reason}`, 'inter:500', 26, 60, (y += 40)));
  y += 60;
  const chars = [...big.text].filter((ch) => ch !== ' ');
  const cell = 210, perRow = Math.floor((W - 80) / cell), checks = [];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], col = i % perRow, row = Math.floor(i / perRow);
    const cx = W - 40 - (col + 0.5) * cell, top = y + row * 300; // right to left, in reading order
    const [name, expected] = NAMES[ch] || [ch, null];
    parts.push(`<rect x="${cx - cell / 2 + 6}" y="${top}" width="${cell - 12}" height="280" rx="10" fill="#ffffff"/>`);
    let detected = null;
    if (ch !== '‌') {
      const g = await shapeText(ch, font, { size: 130 });
      if (g.bbox) { detected = findDots(g.d).length; parts.push(`<path fill="#111827" d="${transformPath(g.d, { tx: cx - (g.bbox.x0 + g.bbox.w / 2), ty: top + 30 - g.bbox.y0 + (150 - g.bbox.h) / 2 })}"/>`); }
    } else parts.push(await label('ZWNJ', 'inter:700', 40, cx, top + 120, '#6b7280', 'middle'));
    parts.push(await label(name, 'vazirmatn-bold', 30, cx, top + 222, '#111827', 'middle'));
    parts.push(await label(`U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`, 'inter:500', 22, cx, top + 256, '#4b5563', 'middle'));
    if (expected != null && detected != null) {
      const ok = detected === expected || (expected > 1 && detected >= 1 && detected < expected); // some fonts draw 2–3 dots as one shape
      checks.push({ ch, name, expected, detected, ok });
      parts.push(await label(`${detected}/${expected}`, 'inter:700', 22, cx + cell / 2 - 22, top + 30, ok ? '#15803d' : '#b91c1c', 'end'));
    }
  }
  y += Math.ceil(chars.length / perRow) * 300 + 40;
  parts.push(await label('Each box: the letter alone · its Persian name · codepoint · dots found / dots expected (top corner). Some fonts draw two or three dots as one shape.', 'inter:400', 22, 60, y));
  y += 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}"><rect width="100%" height="100%" fill="#eef0f3"/>${parts.join('')}</svg>`;
  const png = await render(svg, { width: W });
  fs.writeFileSync(outFile, png.png);
  return { file: outFile, checks, chrome: { status: cmp.status, score: cmp.score, reason: cmp.reason } };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
  const text = get('text');
  if (!text) { console.log('Usage: node proof-sheet.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--out brand-kit/proof]'); process.exit(2); }
  const dir = outDir(get('out'), 'brand-kit/proof');
  const res = await proofSheet(text, get('font', 'vazirmatn-black'), path.join(dir, 'proof-wordmark.png'));
  console.log(`wrote  ${res.file}`);
  console.log(`chrome ${res.chrome.status}${res.chrome.score ? ` (${(res.chrome.score * 100).toFixed(1)}% ink overlap)` : res.chrome.reason ? ` — ${res.chrome.reason}` : ''}`);
  for (const c of res.checks) console.log(`  ${c.ok ? '✓' : '⚠'} ${c.ch} ${c.name}: ${c.detected}/${c.expected} dots`);
  console.log('Open the PNG and confirm every letter, dot and join by eye — this is the final check.');
}
