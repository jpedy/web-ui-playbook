#!/usr/bin/env node
/**
 * brand-logo-studio — text-to-path.mjs (zero npm dependencies; vendored HarfBuzz)
 *
 *   node text-to-path.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--size 120] [--color "#111827"]
 *                         [--tracking 0.02 (Latin runs only)] [--out wordmark.svg] [--json]
 *
 * Shapes the text with OpenType rules, splits mixed Persian/Latin/digits into bidi runs, and writes an
 * SVG with outlines only (no <text>, no font dependency). Prints the visual run order so you can check
 * that «کلاس IELTS ۱۲۳» keeps "IELTS" and "۱۲۳" readable. Fonts: --list-fonts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { shapeText } from './lib/shape.mjs';
import { FONTS } from './lib/fonts.mjs';
import { outDir } from './lib/util.mjs';
import { transformPath } from './lib/path.mjs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (args.includes('--list-fonts')) {
  for (const [id, f] of Object.entries(FONTS)) console.log(`${id.padEnd(20)} ${f.script}  ${f.static ? `static ${f.weight}` : `variable ${f.range.join('–')} (use ${id}:<weight>)`}  ${f.role}`);
  process.exit(0);
}
const text = get('text');
if (!text) { console.log('Usage: node text-to-path.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--size 120] [--out file.svg]   (--list-fonts)'); process.exit(2); }
const size = Number(get('size', 120));
const r = await shapeText(text, get('font', 'vazirmatn-bold'), { size, tracking: Number(get('tracking', 0)) });
const pad = size * 0.1;
const vb = `0 0 ${(r.bbox.w + 2 * pad).toFixed(2)} ${(r.bbox.h + 2 * pad).toFixed(2)}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><path fill="${get('color', '#111827')}" d="${transformPath(r.d, { tx: pad - r.bbox.x0, ty: pad - r.bbox.y0 })}"/></svg>`;
const outArg = get('out');
if (outArg) {
  const dir = outDir(path.dirname(path.resolve(outArg)));
  fs.writeFileSync(path.join(dir, path.basename(outArg)), svg);
}
if (args.includes('--json')) console.log(JSON.stringify({ text: r.text, font: r.font, width: r.width, bbox: r.bbox, runs: r.runs, missing: r.missing, warnings: r.warnings }, null, 2));
else {
  console.log(`text   ${JSON.stringify(r.text)}  (font ${r.font})`);
  console.log(`runs   ${r.runs.map((u) => `[${u.dir}: ${u.text}]`).join(' ')}   ← visual order, left to right`);
  for (const w of r.warnings) console.log(`note   ${w}`);
  if (outArg) console.log(`wrote  ${path.resolve(outArg)}`);
  else console.log(svg);
}
process.exit(r.missing.length ? 1 : 0);
