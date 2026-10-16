#!/usr/bin/env node
/**
 * brand-logo-studio — shaping-check.mjs
 *
 *   node shaping-check.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--size 160] [--out proof-dir]
 *
 * Renders the same string twice — our HarfBuzz outline (resvg) and the installed Chrome/Edge/Chromium
 * with the same font file — and compares the ink (IoU). A low score means the outline differs from how
 * a browser shapes the text (wrong joins, reversed runs, missing marks). Writes a side-by-side PNG.
 *
 * Optional dependency: a Chromium-family browser, found on the usual paths or via CHROME_PATH.
 * If none is found, prints "skipped" and exits 0 — it never downloads a browser.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shapeText } from './lib/shape.mjs';
import { resolveFont } from './lib/fonts.mjs';
import { render } from './lib/vendor.mjs';
import { transformPath } from './lib/path.mjs';
import { findChrome, chromeScreenshot, decodePng, outDir } from './lib/util.mjs';

function inkMask({ width, height, pixels }) {
  const m = new Uint8Array(width * height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, a = pixels[i + 3] / 255;
    const lum = (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) * a + 255 * (1 - a);
    if (lum < 128) { m[y * width + x] = 1; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return { m, width, x0, y0, x1, y1 };
}
function iou(a, b) {
  if (a.x1 < 0 || b.x1 < 0) return { score: 0, widthRatio: 0 };
  const W = a.x1 - a.x0 + 1, H = a.y1 - a.y0 + 1, bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
  let inter = 0, uni = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const va = a.m[(a.y0 + y) * a.width + a.x0 + x];
    const vb = b.m[(b.y0 + Math.min(bh - 1, Math.floor((y * bh) / H))) * b.width + b.x0 + Math.min(bw - 1, Math.floor((x * bw) / W))];
    if (va && vb) inter++;
    if (va || vb) uni++;
  }
  return { score: uni ? inter / uni : 0, widthRatio: bw / W };
}

/** Compare outline vs Chrome. Returns { status: 'pass'|'differs'|'skipped', score, ourPng, chromePng, reason }. */
export async function compareWithChrome(text, fontSpec, size = 160) {
  const r = await shapeText(text, fontSpec, { size });
  const pad = Math.round(size * 0.5), W = Math.ceil(r.width + 2 * pad), H = Math.ceil(r.ascender - r.descender + 2 * pad);
  const baseline = pad + r.ascender;
  const ours = await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${transformPath(r.d, { tx: pad, ty: baseline })}"/></svg>`, { width: W });
  const chrome = findChrome();
  if (!chrome) return { status: 'skipped', reason: 'no Chrome, Edge or Chromium found (set CHROME_PATH to enable this check)', ourPng: ours.png, text: r.text, runs: r.runs };
  const info = resolveFont(fontSpec);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-shape-'));
  const fontUrl = 'file:///' + info.file.replace(/\\/g, '/').replace(/^\/+/, '');
  const html = path.join(dir, 'page.html');
  const isRtl = /[؀-ۿ]/.test(r.text) && !/^[A-Za-z]/.test(r.text);
  const wght = info.weight ? `font-weight:${info.weight};font-variation-settings:'wght' ${info.weight};` : '';
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:T;src:url("${fontUrl}");font-weight:100 900}html,body{margin:0;background:#fff}div{font-family:T;font-size:${size}px;line-height:${H}px;height:${H}px;padding:0 ${pad}px;color:#000;white-space:nowrap;${wght}}</style><div dir="${isRtl ? 'rtl' : 'ltr'}">${r.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`);
  const shot = chromeScreenshot(chrome, html, W + 40, H);
  fs.rmSync(dir, { recursive: true, force: true });
  if (!shot.png) return { status: 'skipped', reason: `browser found (${chrome}) but the screenshot failed: ${shot.reason}`, ourPng: ours.png, text: r.text, runs: r.runs };
  const a = inkMask(ours), b = inkMask(decodePng(shot.png));
  const { score, widthRatio } = iou(a, b);
  return { status: score >= 0.8 && Math.abs(widthRatio - 1) < 0.06 ? 'pass' : 'differs', score, widthRatio, ourPng: ours.png, chromePng: shot.png, browser: chrome, text: r.text, runs: r.runs };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
  const text = get('text');
  if (!text) { console.log('Usage: node shaping-check.mjs --text "زبان‌سرا" [--font vazirmatn-black] [--size 160] [--out dir]'); process.exit(2); }
  const font = get('font', 'vazirmatn-bold');
  const res = await compareWithChrome(text, font, Number(get('size', 160)));
  console.log(`text     ${JSON.stringify(res.text)}  font ${font}`);
  console.log(`runs     ${res.runs.map((u) => `[${u.dir}: ${u.text}]`).join(' ')}   (visual order)`);
  if (res.status === 'skipped') console.log(`skipped  ${res.reason}. The outline was still produced; check the proof sheet by eye.`);
  else console.log(`${res.status === 'pass' ? 'pass   ' : 'DIFFERS'}  ink overlap ${(res.score * 100).toFixed(1)}% · width ratio ${res.widthRatio.toFixed(3)} · browser ${path.basename(res.browser)}`);
  if (get('out')) {
    const dir = outDir(get('out'), 'brand-kit/proof');
    fs.writeFileSync(path.join(dir, 'shaping-outline.png'), res.ourPng);
    if (res.chromePng) fs.writeFileSync(path.join(dir, 'shaping-chrome.png'), res.chromePng);
    console.log(`wrote    ${dir}`);
  }
  process.exit(res.status === 'differs' ? 1 : 0);
}
