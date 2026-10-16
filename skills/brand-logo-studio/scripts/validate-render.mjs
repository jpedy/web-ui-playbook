#!/usr/bin/env node
/**
 * brand-logo-studio — validate-render.mjs
 *
 *   node validate-render.mjs logo.svg [more.svg …] [--kind light|reversed|mono-black|mono-white]
 *                            [--light "#ffffff"] [--dark "#0b1220"] [--out brand-kit/proof]
 *
 * Checks any logo SVG (also ones made by hand or by another tool): live <text>, embedded images or
 * scripts, external references, missing viewBox, clipping, contrast ≥ 3:1, detail lost in one-color print.
 * With --out it also writes <name>-sizes.png: the logo at 512/64/32/16 px on light, on dark and in one
 * color — the "does it still read small?" test, which is judged by eye.
 * Exit code 1 if any FAIL.
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateSvg, oneColor } from './lib/validate.mjs';
import { render } from './lib/vendor.mjs';
import { outDir } from './lib/util.mjs';
import { place } from './lib/kit.mjs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const flagIdx = new Set(['--kind', '--light', '--dark', '--out'].flatMap((f) => { const i = args.indexOf(f); return i >= 0 ? [i, i + 1] : []; }));
const files = args.filter((a, i) => !flagIdx.has(i) && !a.startsWith('--'));
if (!files.length) { console.log('Usage: node validate-render.mjs logo.svg [--kind light|reversed|mono-black|mono-white] [--out dir]'); process.exit(2); }
const lightBg = get('light', '#ffffff'), darkBg = get('dark', '#0b1220');

async function sizesSheet(svg, file) {
  const rows = [lightBg, darkBg, '#ffffff'];
  const W = 512 + 64 + 32 + 16 + 5 * 40, H = rows.length * 592 + 20, parts = [`<rect width="${W}" height="${H}" fill="#e5e7eb"/>`];
  rows.forEach((bg, r) => {
    const art = r === 2 ? oneColor(svg, '#000000') : svg, y = 40 + r * 592;
    parts.push(`<rect x="20" y="${y - 20}" width="${W - 40}" height="552" rx="12" fill="${bg}"/>`);
    let x = 40;
    for (const s of [512, 64, 32, 16]) { parts.push(place(art, x, y + (512 - s) / 2, s, s)); x += s + 40; }
  });
  fs.writeFileSync(file, (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`, { width: W })).png);
}

const kindOf = (f) => { const b = path.basename(f); return /mono-white/.test(b) ? 'mono-white' : /mono-black/.test(b) ? 'mono-black' : /reversed|dark/.test(b) ? 'reversed' : 'light'; };
let fail = false;
for (const f of files) {
  const svg = fs.readFileSync(f, 'utf8');
  const kind = get('kind', kindOf(f));
  const res = await validateSvg(svg, { kind, lightBg, darkBg, allowStyle: /favicon/.test(path.basename(f)) });
  console.log(`${path.basename(f)}  (checked as ${kind})`);
  for (const r of res) console.log(`  ${r.level.padEnd(4)}  ${r.id}: ${r.msg}`);
  if (res.some((r) => r.level === 'FAIL')) fail = true;
  if (get('out')) {
    const sheet = path.join(outDir(get('out'), 'brand-kit/proof'), `${path.basename(f, '.svg')}-sizes.png`);
    await sizesSheet(svg, sheet);
    console.log(`  wrote ${sheet} — check by eye that it still reads at 16 px`);
  }
}
console.log('Passing these checks does not prove the logo is good or original; look at the sheets.');
process.exit(fail ? 1 : 0);
