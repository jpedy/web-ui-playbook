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
import { loadBrief, logoColors, preloadProfile } from './lib/brief.mjs';
import { directions, exportKit, kitReport } from './lib/kit.mjs';
import { integrationFor } from './lib/integrations.mjs';
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
check((await ids('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="2" y="2" width="6" height="6" fill="#fde68a"/></svg>')).includes('contrast'), 'warns on a faint logo color');
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
check(kit.files.length === new Set(kit.files).size && kit.files.length === fs.readdirSync(tmp, { recursive: true }).filter((f) => fs.statSync(path.join(tmp, f)).isFile()).length, `kit file list matches the files written (${kit.files.length})`);
const favRes = await validateSvg(fs.readFileSync(path.join(tmp, 'favicon.svg'), 'utf8'), { kind: 'light', allowStyle: true });
check(!favRes.some((f) => f.level !== 'ok'), 'adaptive favicon.svg validates clean (variants checked separately)');
check(!kit.findings.some((f) => f.level === 'FAIL'), `kit has no blocking findings: ${kit.findings.filter((f) => f.level === 'FAIL').map((f) => f.msg).join('; ')}`);
check(decodePng(fs.readFileSync(path.join(tmp, 'png/apple-touch-icon.png'))).pixels[3] === 255, 'apple-touch-icon is opaque');
const kitIco = fs.readFileSync(path.join(tmp, 'favicon.ico'));
check(kitIco.readUInt16LE(4) === 3 && [16, 32, 48].every((s, i) => kitIco[6 + 16 * i] === s), 'favicon.ico holds 16, 32 and 48');
check(kit.proof.checks.every((c) => c.ok), 'proof sheet: every dot of زبان‌سرا found');
check(fs.readFileSync(path.join(tmp, 'kit-report.md'), 'utf8').includes('کارت بازرگانی'), 'report carries the Latin-letters filing note');
fs.rmSync(tmp, { recursive: true, force: true });
// accent roles, 16 px favicon fallback, brand-colored maskable field
for (const [k, against] of [['accentOnLight', fx.colors.lightBg], ['accentOnPrimary', fx.colors.primary], ['accentOnPale', fx.colors.onDark]]) check(contrast(fx.colors[k], against) >= 3, `${k} ${fx.colors[k]} reaches 3:1 (${contrast(fx.colors[k], against).toFixed(2)})`);
check(fx.colors.accent === '#d9b863', 'the palette accent itself is never changed');
const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-kitB-'));
const kitB = await exportKit(fx, 'B', tmpB);
check(kitB.decisions.some((d) => d.includes('simplified monogram')) && fs.existsSync(path.join(tmpB, 'svg/favicon-monogram.svg')), 'direction B (book, thin at 16 px) → monogram favicon, stated in the report');
check(fs.readFileSync(path.join(tmpB, 'kit-report.md'), 'utf8').includes('simplified monogram'), 'kit-report.md names the favicon substitution');
check(!kit.decisions.some((d) => d.includes('simplified monogram')), 'direction C (monogram) keeps its own favicon');
const mask = decodePng(fs.readFileSync(path.join(tmpB, 'png/icon-maskable-512.png')));
check(mask.pixels[0] === 0x0d && mask.pixels[1] === 0x94 && mask.pixels[2] === 0x88, 'maskable icon: brand-colored field (corner pixel is the brand color)');
check(fs.readFileSync(path.join(tmpB, 'kit-report.md'), 'utf8').includes('Verify with an IP attorney'), 'legal note says "verify with an IP attorney"');
fs.rmSync(tmpB, { recursive: true, force: true });

// 7. browser comparison
const chrome = findChrome();
if (chrome) {
  for (const [t, f] of [['زبان‌سرا', 'vazirmatn-black'], ['کلاس IELTS ۱۲۳', 'vazirmatn-bold'], ['Zabansara', 'plus-jakarta-sans:800'], ['شیرینی‌پزی', 'estedad:800']]) {
    const r = await compareWithChrome(t, f, 120);
    check(r.status === 'pass', `matches ${path.basename(chrome)}: «${t}» ${f} → ${r.status} ${r.score ? (r.score * 100).toFixed(1) + '%' : r.reason}`);
  }
  // negative cases: the browser draws a deliberately different string — the rule must catch it
  const noDot = await compareWithChrome('ریز', 'vazirmatn-black', 120, { browserText: 'ریر' });
  check(noDot.status === 'differs', `catches a missing dot (ریز vs ریر): ${noDot.status}, shapes ${noDot.analysis?.shapesOurs}/${noDot.analysis?.shapesBrowser}, overlap ${(noDot.score * 100).toFixed(1)}%`);
  const join = await compareWithChrome('زبان‌سرا', 'vazirmatn-black', 120, { browserText: 'زبانسرا' });
  check(join.status === 'differs', `catches a wrong join (ZWNJ dropped): ${join.status}, shapes ${join.analysis?.shapesOurs}/${join.analysis?.shapesBrowser}, overlap ${(join.score * 100).toFixed(1)}%`);
  for (const [t, f] of [['زبان‌سرا', 'vazirmatn-black'], ['پیشگام', 'vazirmatn-black']]) {
    const r = await compareWithChrome(t, f, 120);
    check(r.analysis.edgeShare > 0.95 && r.analysis.largestInteriorBlob === 0, `«${t}»: the mismatch is edge anti-aliasing only (${(r.analysis.edgeShare * 100).toFixed(0)}% within 2 px of an edge)`);
  }
} else console.log('(no Chrome/Edge found: browser comparison not run)');
// 8. market and stack: brief → project profile (.web-ui-playbook.json) → defaults; legal notes follow the market
{
  const fxFile = path.join(DIR, 'fixtures', 'brief-zabansara.json');
  const rawFx = JSON.parse(fs.readFileSync(fxFile, 'utf8'));
  const dirC = { id: 'C', title: 'test' };
  const rep = (b) => kitReport(b, dirC, ['favicon.svg'], [], [], null, [], integrationFor(b.stack));
  const iranRep = rep(loadBrief(fxFile));
  check(/Iranian trademark database/.test(iranRep) && /head-snippet\.blade\.php/.test(iranRep), 'market iran (brief): Iran legal notes and the Laravel integration');
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-prof-'));
  const { market, ...noMarket } = rawFx;
  fs.writeFileSync(path.join(proj, 'brief.json'), JSON.stringify(noMarket));
  if (fs.existsSync(path.join(DIR, '..', '..', 'web-ui-playbook', 'scripts', 'profile.mjs'))) {
    fs.writeFileSync(path.join(proj, '.web-ui-playbook.json'), JSON.stringify({ version: 1, stack: 'laravel', languages: ['en'], dir: 'ltr', market: 'global' }));
    await preloadProfile(path.join(proj, 'brief.json'));
    const g = loadBrief(path.join(proj, 'brief.json'));
    const gRep = rep(g);
    check(g.market === 'global' && g.marketSource === 'profile' && g.stack === 'laravel', `no market in the brief → the project profile's market (${g.market}, from ${g.marketSource})`);
    check(!/Iranian|legal-iran|کارت بازرگانی/.test(gRep) && /every country where/.test(gRep), 'market global: no Iran legal notes, a neutral trademark note instead');
  }
  const proj2 = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-noprof-'));
  fs.writeFileSync(path.join(proj2, 'package.json'), '{}'); // project root: the profile search stops here
  fs.writeFileSync(path.join(proj2, 'brief.json'), JSON.stringify(noMarket));
  const cwd0 = process.cwd(); process.chdir(proj2);
  await preloadProfile(path.join(proj2, 'brief.json'));
  const d = loadBrief(path.join(proj2, 'brief.json'));
  process.chdir(cwd0);
  check(d.market === 'iran' && d.marketSource === 'default' && /Market not set/.test(rep(d)), 'no market anywhere → the original default (iran), and the report says the market was not set');
  fs.rmSync(proj, { recursive: true, force: true }); fs.rmSync(proj2, { recursive: true, force: true });
  // stack next: files named for the App Router conventions, copied byte-for-byte from the kit
  const kitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-next-'));
  fs.mkdirSync(path.join(kitDir, 'png'));
  for (const [f, v] of [['favicon.ico', 'ICO'], ['favicon.svg', '<svg/>'], ['png/apple-touch-icon.png', 'APPLE'], ['png/og-image.png', 'OG']]) fs.writeFileSync(path.join(kitDir, f), v);
  const nf = Object.fromEntries(integrationFor('next').files({ c: { primary: '#0d9488', lightBg: '#ffffff', darkBg: '#060807' }, brief: { name: { fa: 'زبان‌سرا', en: 'Zabansara' } }, out: kitDir }));
  const want = ['next-app/favicon.ico', 'next-app/icon.svg', 'next-app/apple-icon.png', 'next-app/opengraph-image.png', 'next-app/opengraph-image.alt.txt', 'next-app/manifest.json', 'next-app/viewport.ts.txt', 'next-app/README.md'];
  check(want.every((f) => f in nf) && String(nf['next-app/favicon.ico']) === 'ICO' && String(nf['next-app/apple-icon.png']) === 'APPLE' && String(nf['next-app/icon.svg']) === '<svg/>', 'stack next: favicon.ico, icon.svg, apple-icon.png, opengraph-image.png (+alt), manifest.json, viewport snippet and README, copied from the kit');
  const man = JSON.parse(nf['next-app/manifest.json']);
  check(man.dir === 'rtl' && man.lang === 'fa' && man.icons.some((i) => i.purpose === 'maskable') && /themeColor/.test(nf['next-app/viewport.ts.txt']) && /metadataBase/.test(nf['next-app/README.md']) && /top-level/.test(nf['next-app/README.md']), 'stack next: RTL manifest with a maskable icon; theme color via viewport; README says top-level app/ and metadataBase');
  const sf = Object.fromEntries(integrationFor('static').files({ c: { primary: '#0d9488', darkBg: '#060807' }, brief: { name: { en: 'Mira Holt' } } }));
  check(/rel="icon" href="\/brand\/favicon\.svg"/.test(sf['head-snippet.html']) && /YOUR-DOMAIN/.test(sf['head-snippet.html']) && /media="\(prefers-color-scheme: dark\)"/.test(sf['head-snippet.html']), 'stack static: head-snippet.html with /brand/ paths, light/dark theme colors and an absolute og:image to fill in');
  // a brand with only a Latin name (English sites outside Iran): every layout it needs renders
  const fxB = loadBrief(fxFile);
  const enOnly = async (layout) => (await lockup({ layout, mode: 'color', colors: fxB.colors, icon: 'R1_monogram', letter: 'M', letterFont: 'vazirmatn-black', accentDots: 'none', fa: null, en: { text: 'Mira Holt', font: 'inter:800' } })).svg;
  const okEn = await Promise.all(['h-ltr', 'wordmark-en', 'icon'].map((l) => enOnly(l).then((s) => /<path/.test(s)).catch(() => false)));
  check(okEn.every(Boolean), `English-only brand: h-ltr, wordmark-en and icon lockups render (got ${okEn.join(', ')})`);
  fs.writeFileSync(path.join(kitDir, 'png', 'icon-512.png'), 'ICON512');
  const wf = Object.fromEntries(integrationFor('wordpress').files({ c: { primary: '#0d9488', darkBg: '#060807' }, brief: { name: { fa: 'زبان‌سرا', en: 'Zabansara' } }, out: kitDir }));
  check(String(wf['wordpress/site-icon-512.png']) === 'ICON512' && /add_theme_support\( 'custom-logo'/.test(wf['wordpress/functions-snippet.php']) && /theme-color/.test(wf['wordpress/functions-snippet.php']) && /Site Icon/.test(wf['wordpress/README.md']), 'stack wordpress: a 512px Site Icon to upload (WordPress makes the sizes), custom-logo + theme-color snippet, README');
  check(['nuxt', 'sveltekit', 'astro', 'shopify', 'builder'].every((s) => 'head-snippet.html' in Object.fromEntries(integrationFor(s).files({ c: { primary: '#0d9488', darkBg: '#060807' }, brief: { name: { en: 'X' } } }))), 'Tier 2/3 stacks get the plain HTML head snippet');
  check(integrationFor('wix-or-unknown').stack === 'laravel', 'unknown stack falls back to the Laravel integration (the original default)');
  fs.rmSync(kitDir, { recursive: true, force: true });
}

const saved = process.env.CHROME_PATH;
process.env.CHROME_PATH = 'none';
const sk = await compareWithChrome('زبان‌سرا', 'vazirmatn-black');
check(sk.status === 'skipped' && sk.ourPng && /CHROME_PATH/.test(sk.reason), 'no browser → "skipped", outline still produced');
if (saved === undefined) delete process.env.CHROME_PATH; else process.env.CHROME_PATH = saved;

console.log(`\nselftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
