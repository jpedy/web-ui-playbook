#!/usr/bin/env node
/**
 * brand-logo-studio — selftest.mjs (zero npm dependencies)
 *   node scripts/selftest.mjs                    (uses the installed Chrome/Edge for the shaping checks if found)
 *   CHROME_PATH=none node scripts/selftest.mjs   (forces the no-browser path)
 * 1. bidi runs and Persian normalization on mixed strings
 * 2. shaping: every bundled font covers its sample, ZWNJ breaks the join, Latin tracking only on LTR runs
 * 3. dot detection on single letters; path parser/transform
 * 4. PNG decode and ICO encode round trips; output-folder guard
 * 5. validators catch live text, images, external refs, missing viewBox, clipping, color-only detail
 * 6. color roles; every recipe × mode renders; full kit export of the Zabansara fixture
 * 7. browser comparison: pass when Chrome is found, graceful skip when not
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bidiRuns, normalizePersian } from './lib/bidi.mjs';
import { shapeText } from './lib/shape.mjs';
import { FONTS } from './lib/fonts.mjs';
import { findDots, parsePath, transformPath, pathBBox } from './lib/path.mjs';
import { decodePng, encodeIco, contrast, findChrome } from './lib/util.mjs';
import { render } from './lib/vendor.mjs';
import { validateSvg, inkRadius, oneColor } from './lib/validate.mjs';
import { RECIPES, iconBody, svgDoc, lockup } from './lib/marks.mjs';
import { loadBrief, logoColors } from './lib/brief.mjs';
import { directions, exportKit } from './lib/kit.mjs';
import { compareWithChrome } from './shaping-check.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
let failed = 0, passed = 0;
const check = (ok, msg) => { if (ok) passed++; else { failed++; console.log(`✗ ${msg}`); } };
const throws = async (fn) => { try { await fn(); return false; } catch { return true; } };

// 1. bidi + normalization
const vis = (s, b) => bidiRuns(s, b).runs.map((r) => `${r.dir}:${r.text}`).join(' | ');
check(vis('کلاس IELTS ۱۲۳') === 'ltr:IELTS ۱۲۳ | rtl:کلاس ', `mixed fa/en/digits → ${vis('کلاس IELTS ۱۲۳')}`);
check(vis('زبان‌سرا') === 'rtl:زبان‌سرا', 'ZWNJ stays inside the Persian run');
check(vis('Zabansara 2026') === 'ltr:Zabansara 2026', 'Latin + digits is one LTR run');
check(vis('Shop ایران') === 'ltr:Shop  | rtl:ایران', `LTR base with a Persian word → ${vis('Shop ایران')}`);
check(vis('آموزشگاه «پارس» ۲') === 'ltr:۲ | rtl:آموزشگاه «پارس» ', `Persian with quotes and a digit → ${vis('آموزشگاه «پارس» ۲')}`);
const n = normalizePersian('علي كتاب ٣');
check(n.text === 'علی کتاب ۳' && n.changes.length === 3, `normalize Arabic ي ك ٣ → ${n.text}`);
check(normalizePersian('کتاب ها').changes.some((c) => c.includes('ZWNJ')), 'warns on a space where ZWNJ is meant');

// 2. shaping
for (const [id, f] of Object.entries(FONTS)) {
  const sample = f.script === 'fa' ? 'زبان‌سرا پچژگ ۱۲۳' : 'Zabansara 123';
  const r = await shapeText(sample, id, { size: 100 });
  check(!r.missing.length && r.width > 100 && r.d.length > 200, `${id}: shapes "${sample}" (missing ${r.missing.join(',')})`);
}
const withZ = await shapeText('زبان‌سرا', 'vazirmatn-black'), noZ = await shapeText('زبانسرا', 'vazirmatn-black');
check(withZ.d !== noZ.d, 'ZWNJ changes the shaping (ن stays final, س starts a new join)');
const plain = await shapeText('Zabansara', 'inter:700'), tracked = await shapeText('Zabansara', 'inter:700', { tracking: 0.05 });
check(tracked.width > plain.width + 30, 'tracking widens a Latin run');
const faPlain = await shapeText('زبان‌سرا', 'vazirmatn-black'), faTracked = await shapeText('زبان‌سرا', 'vazirmatn-black', { tracking: 0.05 });
check(Math.abs(faTracked.width - faPlain.width) < 0.01, 'tracking is never applied to a Persian run');
check(await throws(() => shapeText('x', 'estedad:1200')), 'variable weight outside the range is refused');
check(await throws(() => shapeText('x', 'no-such-font')), 'unknown font is refused');

// 3. dots and paths
const dots = { 'ز': 1, 'ب': 1, 'ن': 1, 'ت': 2, 'ق': 2, 'پ': 3, 'ش': 3, 'ر': 0, 'ا': 0, 'س': 0, 'م': 0 };
for (const [ch, want] of Object.entries(dots)) {
  const g = await shapeText(ch, 'vazirmatn-black', { size: 130 });
  const got = findDots(g.d).length;
  check(want === 0 ? got === 0 : got >= 1 && got <= want, `dots in ${ch}: ${got} (expected ${want}; 2–3 dots may be drawn as one shape)`);
}
const p = parsePath('M10 20L30 40H50V60C1 2 3 4 5 6Q7 8 9 10Z');
check(p.length === 7 && p[0].cmd === 'M' && p[4].nums.length === 6, 'parsePath reads absolute commands');
check(await throws(() => parsePath('M0 0A5 5 0 0 1 10 10')), 'parsePath refuses arcs');
check(await throws(() => parsePath('m0 0l5 5')), 'parsePath refuses relative commands');
const bb = pathBBox(transformPath('M0 0L10 0L10 10Z', { sx: 2, sy: 3, tx: 5, ty: 7 }));
check(bb.x0 === 5 && bb.y0 === 7 && bb.w === 20 && bb.h === 30, 'transformPath + pathBBox');

// 4. PNG + ICO + guard
const red = await render('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="2" height="4" fill="#ff0000"/></svg>', { width: 4 });
const dec = decodePng(red.png);
check(dec.width === 4 && dec.pixels[0] === 255 && dec.pixels[3] === 255 && dec.pixels[2 * 4 + 3] === 0, 'resvg PNG decodes (red left half, transparent right)');
const px = Buffer.alloc(16 * 16 * 4);
for (let i = 0; i < 16 * 16; i++) { px[i * 4] = 13; px[i * 4 + 1] = 148; px[i * 4 + 2] = 136; px[i * 4 + 3] = i % 16 < 8 ? 255 : 0; }
const ico = encodeIco([{ size: 16, pixels: px }, { size: 32, pixels: Buffer.alloc(32 * 32 * 4, 255) }]);
check(ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 2 && ico[6] === 16 && ico[22] === 32, 'ICO header: type 1, 2 images, sizes 16 and 32');
const off = ico.readUInt32LE(18);
check(ico.readInt32LE(off + 8) === 32 && ico[off + 40] === 136 && ico[off + 42] === 13, 'ICO DIB: double height, BGRA order');
const andMask = off + 40 + 16 * 16 * 4;
check(ico[andMask] === 0x00 && ico[andMask + 1] === 0xff, 'ICO AND mask marks transparent pixels');
const skillDir = path.resolve(DIR, '..');
const guard = spawnSync(process.execPath, [path.join(DIR, 'text-to-path.mjs'), '--text', 'x', '--font', 'inter', '--out', path.join(skillDir, 'x.svg')], { encoding: 'utf8' });
check(guard.status === 2 && !fs.existsSync(path.join(skillDir, 'x.svg')), 'refuses to write into the skill folder');

// 5. validators
const ids = async (svg, o) => (await validateSvg(svg, o)).filter((f) => f.level !== 'ok').map((f) => f.id);
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>x</text></svg>')).includes('live-text'), 'catches <text>');
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="a.png"/></svg>')).includes('embedded'), 'catches <image>');
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><use href="https://x.test/a.svg#i"/></svg>')).includes('external'), 'catches an external reference');
check((await ids('<svg xmlns="http://www.w3.org/2000/svg"><rect width="5" height="5"/></svg>')).includes('viewbox'), 'catches a missing viewBox');
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="-4" width="8" height="8" fill="#111111"/></svg>')).includes('clipping'), 'catches ink outside the viewBox');
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#fde68a"/></svg>')).includes('contrast'), 'warns on a faint logo color');
const colorOnly = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="#0d9488"/><rect x="30" y="30" width="40" height="40" fill="#111827"/></svg>';
const cutout = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" fill="#0d9488" d="M10 10H90V90H10Z M30 30H70V70H30Z"/></svg>';
check((await ids(colorOnly)).includes('one-color'), 'warns when detail is separated by color only');
check(!(await ids(cutout)).includes('one-color'), 'a real cutout survives one-color printing');
const twoSquares = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke-width="7"><rect x="25" y="25" width="50" height="50" rx="6" stroke="#0d9488"/><rect x="25" y="25" width="50" height="50" rx="6" stroke="#1a4e4a" transform="rotate(45 50 50)"/></g></svg>';
check((await ids(twoSquares)).includes('one-color'), 'regression: two overlapping squares told apart only by color (the first shamsa draft) warn');
check(oneColor('<mask id="m"><rect fill="#fff"/></mask><path fill="#0d9488"/>', '#000') === '<mask id="m"><rect fill="#fff"/></mask><path fill="#000"/>', 'oneColor recolors shapes and leaves masks untouched');

// 6. colors, recipes, kit
const faint = logoColors({ colors: { primary: '#5eead4' } });
check(faint.notes.some((x) => x.includes('too faint')), 'flags a brand color below 3:1 on white');
const fx = loadBrief(path.join(DIR, 'fixtures', 'brief-zabansara.json'));
check(fx.colors.accentOnDark === fx.colors.accent, 'the accent keeps its color on dark when it reads there (≥ 3:1)');
check(contrast(fx.colors.ink, fx.colors.lightBg) >= 4.5 && contrast(fx.colors.onDark, fx.colors.darkBg) >= 4.5, 'wordmark ink ≥ 4.5:1 on light and on dark');
for (const id of Object.keys(RECIPES)) for (const mode of ['color', 'reversed', 'mono-black', 'mono-white']) {
  const svg = svgDoc('0 0 100 100', await iconBody(id, fx.colors, mode, { letter: 'ز', letterFont: 'vazirmatn-black' }));
  const fails = (await validateSvg(svg, { kind: mode === 'color' ? 'light' : mode, darkBg: fx.colors.darkBg })).filter((f) => f.level === 'FAIL');
  check(!fails.length, `${id} ${mode}: ${fails.map((f) => f.msg).join('; ')}`);
  if (mode === 'color') {
    const oc = (await validateSvg(svg, { kind: 'light' })).find((f) => f.id === 'one-color');
    check(oc.level === 'ok', `${id}: survives one-color printing (${oc.msg})`);
    const masked = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><svg x="112.64" y="112.64" width="286.72" height="286.72" viewBox="0 0 100 100">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></svg>`;
    check((await inkRadius(masked)) <= 0.4, `${id}: inside the maskable safe zone at 56%`);
  }
}
check(await throws(() => iconBody('R1_monogram', fx.colors, 'color', { letter: 'ز', letterFont: 'estedad:800' })), 'R1 refuses a variable font (overlapping contours)');
for (const layout of ['h-rtl', 'h-ltr', 'stacked', 'fa-only', 'wordmark-fa', 'wordmark-en', 'icon']) {
  const l = await lockup({ layout, mode: 'color', colors: fx.colors, icon: 'R1_monogram', letter: 'ز', letterFont: 'vazirmatn-black', accentDots: 'first', fa: { text: fx.name.fa, font: fx.fonts.fa }, en: { text: fx.name.en, font: fx.fonts.en } });
  check(!/<text/.test(l.svg) && l.width > 0 && l.height > 0, `lockup ${layout}`);
}
const ds = directions(fx);
check(ds.length === 3 && new Set(ds.map((d) => `${d.icon}|${d.accentDots}`)).size === 3, 'three distinct directions');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-kit-'));
const kit = await exportKit(fx, 'C', tmp);
const need = ['svg/logo-h-rtl.svg', 'svg/logo-fa-only.svg', 'svg/logo-icon.svg', 'svg/logo-mono-black.svg', 'favicon.svg', 'favicon.ico', 'png/apple-touch-icon.png',
  'png/icon-maskable-512.png', 'png/og-image.png', 'site.webmanifest', 'head-snippet.blade.php', 'brand-sheet.png', 'proof/proof-wordmark.png', 'kit-report.md'];
for (const f of need) check(fs.existsSync(path.join(tmp, f)), `kit has ${f}`);
check(!kit.findings.some((f) => f.level === 'FAIL'), `kit has no blocking findings: ${kit.findings.filter((f) => f.level === 'FAIL').map((f) => f.msg).join('; ')}`);
check(decodePng(fs.readFileSync(path.join(tmp, 'png/apple-touch-icon.png'))).pixels[3] === 255, 'apple-touch-icon is opaque');
const kitIco = fs.readFileSync(path.join(tmp, 'favicon.ico'));
check(kitIco.readUInt16LE(4) === 3 && [16, 32, 48].every((s, i) => kitIco[6 + 16 * i] === s), 'favicon.ico holds 16, 32 and 48');
check(kit.proof.checks.every((c) => c.ok), 'proof sheet: every dot of زبان‌سرا found');
check(fs.readFileSync(path.join(tmp, 'kit-report.md'), 'utf8').includes('کارت بازرگانی'), 'report carries the Latin-letters filing note');
fs.rmSync(tmp, { recursive: true, force: true });

// 7. browser comparison
const chrome = findChrome();
if (chrome) {
  for (const [t, f] of [['زبان‌سرا', 'vazirmatn-black'], ['کلاس IELTS ۱۲۳', 'vazirmatn-bold'], ['Zabansara', 'plus-jakarta-sans:800'], ['شیرینی‌پزی', 'estedad:800']]) {
    const r = await compareWithChrome(t, f, 120);
    check(r.status === 'pass', `matches ${path.basename(chrome)}: «${t}» ${f} → ${r.status} ${r.score ? (r.score * 100).toFixed(1) + '%' : r.reason}`);
  }
} else console.log('(no Chrome/Edge found: browser comparison not run)');
const saved = process.env.CHROME_PATH;
process.env.CHROME_PATH = 'none';
const sk = await compareWithChrome('زبان‌سرا', 'vazirmatn-black');
check(sk.status === 'skipped' && sk.ourPng && /CHROME_PATH/.test(sk.reason), 'no browser → "skipped", outline still produced');
if (saved === undefined) delete process.env.CHROME_PATH; else process.env.CHROME_PATH = saved;

console.log(`\nselftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
