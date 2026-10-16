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
import { transformPath, pathBBox } from './lib/path.mjs';
import { NAMES, expectedMarks, lettersInContext, letterDots } from './lib/letters.mjs';
import { outDir, decodePng } from './lib/util.mjs';
import { compareWithChrome } from './shaping-check.mjs';

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
  // Every letter as it appears IN the word (its joined form, from HarfBuzz clusters), with the separate marks found in
  // that form and those expected for it (ی has two dots only when it joins the next letter; گ's second stroke may be separate).
  const cells = lettersInContext(await shapeText(text, font, { size: 130 }));
  const cell = 230, perRow = Math.floor((W - 80) / cell), checks = [];
  for (let i = 0; i < cells.length; i++) {
    const { seg, d, joinsNext, zwnj } = cells[i], col = i % perRow, row = Math.floor(i / perRow);
    const cx = W - 40 - (col + 0.5) * cell, top = y + row * 320; // right to left, in reading order
    parts.push(`<rect x="${cx - cell / 2 + 6}" y="${top}" width="${cell - 12}" height="300" rx="10" fill="#ffffff"/>`);
    if (zwnj) {
      parts.push(await label('ZWNJ', 'inter:700', 40, cx, top + 130, '#6b7280', 'middle'), await label('نیم‌فاصله', 'vazirmatn-bold', 28, cx, top + 222, '#111827', 'middle'), await label('U+200C · join broken here', 'inter:500', 17, cx, top + 252, '#4b5563', 'middle'));
      continue;
    }
    const bb = pathBBox(d), detected = letterDots(d).length;
    const exps = seg.map((ch, j) => expectedMarks(ch, j < seg.length - 1 || joinsNext));
    const known = exps.every(Boolean);
    const min = known ? exps.reduce((s, e) => s + e.min, 0) : 0, max = known ? exps.reduce((s, e) => s + e.max, 0) : 0, dots = known ? exps.reduce((s, e) => s + e.dots, 0) : 0;
    const form = seg.length > 1 ? 'ligature' : joinsNext ? 'joins next' : 'final / alone';
    const name = seg.map((ch) => NAMES[ch]?.[0] || ch).join(' + ');
    parts.push(`<path fill="#111827" d="${transformPath(d, { tx: cx - (bb.x0 + bb.w / 2), ty: top + 25 - bb.y0 + (165 - bb.h) / 2 })}"/>`);
    parts.push(await label(name, 'vazirmatn-bold', 28, cx, top + 222, '#111827', 'middle'));
    parts.push(await label(`${seg.map((ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' ')} · ${form}`, 'inter:500', 17, cx, top + 252, '#4b5563', 'middle'));
    if (known) {
      const ok = detected >= min && detected <= max;
      const note = exps.map((e) => e.note).filter(Boolean).join('; ');
      checks.push({ ch: seg.join(''), name, expected: dots, range: [min, max], detected, ok, form, note });
      const shown = note && detected > dots ? `${dots} dots · stroke` : `${detected}/${dots}`; // گ: its second stroke is a separate shape, not a dot
      parts.push(await label(shown, 'inter:700', 24, cx + cell / 2 - 22, top + 34, ok ? '#15803d' : '#b91c1c', 'end'));
      if (note) parts.push(await label('2nd stroke drawn separately', 'inter:400', 14, cx, top + 282, '#6b7280', 'middle'));
    }
  }
  y += Math.ceil(cells.length / perRow) * 320 + 40;
  parts.push(await label('Each box: the letter as it appears in the word · name · codepoint · form · separate marks found / dots expected for that form (top corner; 2–3 dots drawn as one shape count as found).', 'inter:400', 22, 60, y));
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
  for (const c of res.checks) console.log(`  ${c.ok ? '✓' : '⚠'} ${c.ch} ${c.name} (${c.form}): ${c.detected} found / ${c.expected} dots expected${c.note ? ` — ${c.note}` : ''}`);
  console.log('Open the PNG and confirm every letter, dot and join by eye — this is the final check.');
}
