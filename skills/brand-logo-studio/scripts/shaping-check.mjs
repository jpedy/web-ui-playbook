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
import { findChrome, chromeScreenshot, decodePng, encodePng, outDir } from './lib/util.mjs';

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
/** Connected ink components (8-neighbour), ignoring specks under 4 px. Returns their areas. */
function components(m, W, H) {
  const seen = new Uint8Array(W * H), areas = [];
  for (let i = 0; i < W * H; i++) {
    if (!m[i] || seen[i]) continue;
    let n = 0; const st = [i]; seen[i] = 1;
    while (st.length) {
      const p = st.pop(); n++;
      const x = p % W, y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, q = ny * W + nx;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && m[q] && !seen[q]) { seen[q] = 1; st.push(q); }
      }
    }
    if (n >= 4) areas.push(n);
  }
  return areas;
}
/**
 * Overlap of the two ink masks after fitting B's ink box onto A's, plus what the mismatch is made of:
 * pixels within 2 px of an edge (anti-aliasing, hinting, sub-pixel position) versus interior blobs
 * (a missing/extra dot, a wrong join), and the number of separate ink shapes in each.
 */
function iou(a, b) {
  if (a.x1 < 0 || b.x1 < 0) { // one side drew nothing (missing glyphs, font not loaded)
    const W = Math.max(1, a.width), H = Math.max(1, a.m.length / Math.max(1, a.width));
    return { score: 0, widthRatio: 0, analysis: { mismatch: 1, edgeShare: 0, shapesOurs: a.x1 < 0 ? 0 : -1, shapesBrowser: b.x1 < 0 ? 0 : -1, largestInteriorBlob: Infinity, smallestShape: 0, empty: a.x1 < 0 ? 'outline' : 'browser' }, masks: { A: new Uint8Array(W * H), B: new Uint8Array(W * H), W, H } };
  }
  const W = a.x1 - a.x0 + 1, H = a.y1 - a.y0 + 1, bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
  const A = new Uint8Array(W * H), B = new Uint8Array(W * H);
  let inter = 0, uni = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const va = a.m[(a.y0 + y) * a.width + a.x0 + x];
    const vb = b.m[(b.y0 + Math.min(bh - 1, Math.floor((y * bh) / H))) * b.width + b.x0 + Math.min(bw - 1, Math.floor((x * bw) / W))];
    A[y * W + x] = va; B[y * W + x] = vb;
    if (va && vb) inter++;
    if (va || vb) uni++;
  }
  const nearEdge = (m, x, y) => { const v = m[y * W + x]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || m[ny * W + nx] !== v) return true; } return false; };
  const interior = new Uint8Array(W * H);
  let xor = 0, edge = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (A[i] === B[i]) continue;
    xor++;
    if (nearEdge(A, x, y) || nearEdge(B, x, y)) edge++; else interior[i] = 1;
  }
  const ca = components(A, W, H), cb = components(B, W, H), blobs = components(interior, W, H);
  return {
    score: uni ? inter / uni : 0, widthRatio: bw / W,
    analysis: { mismatch: uni ? xor / uni : 0, edgeShare: xor ? edge / xor : 1, shapesOurs: ca.length, shapesBrowser: cb.length,
      largestInteriorBlob: blobs.length ? Math.max(...blobs) : 0, smallestShape: ca.length ? Math.min(...ca) : 0 },
    masks: { A, B, W, H },
  };
}
/** Diff image: grey = both, red = only our outline, blue = only the browser. */
function diffPng({ A, B, W, H }) {
  const px = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const c = A[i] && B[i] ? [156, 163, 175] : A[i] ? [220, 38, 38] : B[i] ? [37, 99, 235] : [255, 255, 255];
    px.set([...c, 255], i * 4);
  }
  return encodePng(W, H, px);
}

/** Compare outline vs Chrome. Returns { status: 'pass'|'differs'|'skipped', score, ourPng, chromePng, reason }. */
export async function compareWithChrome(text, fontSpec, size = 160, { browserText } = {}) { // browserText: self-test only — render a different string in the browser to prove mismatches are caught
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
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:T;src:url("${fontUrl}");font-weight:100 900}html,body{margin:0;background:#fff}div{display:inline-block;font-family:T;font-size:${size}px;line-height:${H}px;height:${H}px;padding:0 ${pad}px;color:#000;white-space:nowrap;${wght}}</style><div dir="${isRtl ? 'rtl' : 'ltr'}">${(browserText ?? r.text).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`);
  const shot = chromeScreenshot(chrome, html, W + 40, H);
  fs.rmSync(dir, { recursive: true, force: true });
  if (!shot.png) return { status: 'skipped', reason: `browser found (${chrome}) but the screenshot failed: ${shot.reason}`, ourPng: ours.png, text: r.text, runs: r.runs };
  const a = inkMask(ours), b = inkMask(decodePng(shot.png));
  const { score, widthRatio, analysis, masks } = iou(a, b);
  // pass: ≥ 80% ink overlap, width within ±6%, the same number of separate shapes (letters, dots), and no
  // interior mismatch bigger than a quarter of the smallest shape (a missing dot or a wrong join is bigger)
  const sameShapes = analysis.shapesOurs === analysis.shapesBrowser;
  const noBlob = analysis.largestInteriorBlob < Math.max(8, analysis.smallestShape / 4);
  const pass = score >= 0.8 && Math.abs(widthRatio - 1) < 0.06 && sameShapes && noBlob;
  return { status: pass ? 'pass' : 'differs', score, widthRatio, analysis, diffPng: diffPng(masks), ourPng: ours.png, chromePng: shot.png, browser: chrome, text: r.text, runs: r.runs };
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
  else {
    const an = res.analysis;
    console.log(`${res.status === 'pass' ? 'pass   ' : 'DIFFERS'}  ink overlap ${(res.score * 100).toFixed(1)}% · width ratio ${res.widthRatio.toFixed(3)} · browser ${path.basename(res.browser)}`);
    console.log(`why      ${(an.mismatch * 100).toFixed(1)}% of the ink differs; ${(an.edgeShare * 100).toFixed(0)}% of that lies within 2 px of an edge (anti-aliasing / hinting)`);
    console.log(`         separate shapes (letters + dots): ours ${an.shapesOurs}, browser ${an.shapesBrowser}${an.shapesOurs === an.shapesBrowser ? ' — same' : ' — DIFFERENT: a dot or a join differs'}`);
    console.log(`         largest mismatch away from edges: ${an.largestInteriorBlob} px (smallest shape ${an.smallestShape} px)`);
  }
  console.log('pass rule: ≥ 80% overlap, width ±6%, same number of shapes, no interior mismatch ≥ ¼ of the smallest shape');
  if (get('out')) {
    const dir = outDir(get('out'), 'brand-kit/proof');
    fs.writeFileSync(path.join(dir, 'shaping-outline.png'), res.ourPng);
    if (res.chromePng) fs.writeFileSync(path.join(dir, 'shaping-chrome.png'), res.chromePng);
    if (res.diffPng) fs.writeFileSync(path.join(dir, 'shaping-diff.png'), res.diffPng);
    console.log(`wrote    ${dir}`);
  }
  process.exit(res.status === 'differs' ? 1 : 0);
}
