/**
 * brand-logo-studio — kit.mjs
 * Three directions from a brief, and the full brand-kit export for the chosen one.
 * File list and sizes: references/brand-kit-spec.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { lockup, iconBody, svgDoc, markOnField, RECIPES } from './marks.mjs';
import { DECISION } from './brief.mjs';
import { render } from './vendor.mjs';
import { encodeIco, unpremultiply, contrast } from './util.mjs';
import { validateSvg, inkRadius, smallSizeScore } from './validate.mjs';
import { shapeText } from './shape.mjs';
import { transformPath } from './path.mjs';
import { hasLatin } from './bidi.mjs';
import { proofSheet } from '../proof-sheet.mjs';
import { integrationFor } from './integrations.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
const vbOf = (svg) => svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
/** Place an SVG inside a box (keeps aspect ratio, centered). */
export function place(svg, x, y, w, h) {
  const [, , vw, vh] = vbOf(svg);
  const s = Math.min(w / vw, h / vh), pw = vw * s, ph = vh * s;
  return `<svg x="${r2(x + (w - pw) / 2)}" y="${r2(y + (h - ph) / 2)}" width="${r2(pw)}" height="${r2(ph)}" viewBox="0 0 ${vw} ${vh}">${inner(svg)}</svg>`;
}
async function label(text, size, x, y, color = '#111827', font = 'inter:600', anchor = 'start') {
  const r = await shapeText(text, font, { size });
  const dx = anchor === 'middle' ? -r.width / 2 : anchor === 'end' ? -r.width : 0;
  return `<path fill="${color}" d="${transformPath(r.d, { tx: x + dx, ty: y })}"/>`;
}

/** Three directions (A: container monogram, B: symbol, C: wordmark-led with an accent dot). */
export function directions(brief) {
  const d = DECISION[brief.industry] || DECISION.default;
  return [
    { id: 'A', icon: d.container, accentDots: 'none', title: `Container — ${RECIPES[d.container].name}`, why: 'A solid, ownable shape that works as an app icon and avatar; the safest choice for small sizes.' },
    { id: 'B', icon: d.symbols[0], accentDots: 'none', title: `Symbol — ${RECIPES[d.symbols[0]].name}`, why: `A picture of what the business does (${RECIPES[d.symbols[0]].use}).` },
    { id: 'C', icon: 'R1_monogram', accentDots: 'first', title: 'Wordmark-led — the name carries the brand, one dot in the accent color', why: 'The Persian name is the logo; only the color of one real letter dot changes (letterforms untouched). The app icon repeats the idea: the dot of the monogram in the accent color.' },
  ];
}

export function lockupFor(brief, dir, layout, mode) {
  return lockup({
    layout, mode, colors: brief.colors, icon: dir.icon, letter: brief.monogram, letterFont: brief.fonts.letter, accentDots: dir.accentDots,
    fa: brief.name.fa ? { text: brief.name.fa, font: brief.fonts.fa } : null,
    en: brief.name.en ? { text: brief.name.en, font: brief.fonts.en, tracking: brief.tracking } : null,
  });
}
export const mainLayout = (brief) => (brief.name.fa && brief.name.en ? 'h-rtl' : brief.name.fa ? 'fa-only' : 'h-ltr');

/** Contact sheet of the three directions. */
export async function directionsSheet(brief, outFile) {
  const dirs = directions(brief), c = brief.colors, W = 1800, rowH = 330, parts = [];
  let y = 70;
  parts.push(await label(`Three directions for ${brief.name.en || ''} — pick one (A, B or C)`, 34, 50, y));
  y += 40;
  for (const d of dirs) {
    const light = (await lockupFor(brief, d, mainLayout(brief), 'color')).svg;
    const dark = (await lockupFor(brief, d, mainLayout(brief), 'reversed')).svg;
    const mono = (await lockupFor(brief, d, mainLayout(brief), 'mono-black')).svg;
    const icon = svgDoc('0 0 100 100', await iconBody(d.icon, c, 'color', { letter: brief.monogram, letterFont: brief.fonts.letter, accentDot: d.accentDots !== 'none' }));
    parts.push(await label(`${d.id}. ${d.title}`, 28, 50, y + 36));
    parts.push(await label(d.why, 20, 50, y + 68, '#4b5563', 'inter:400'));
    const top = y + 90;
    parts.push(`<rect x="40" y="${top}" width="760" height="200" rx="12" fill="${c.lightBg}"/>${place(light, 70, top + 30, 700, 140)}`);
    parts.push(`<rect x="820" y="${top}" width="560" height="200" rx="12" fill="${c.darkBg}"/>${place(dark, 850, top + 40, 500, 120)}`);
    parts.push(`<rect x="1400" y="${top}" width="360" height="200" rx="12" fill="#ffffff"/>${place(icon, 1420, top + 20, 128, 128)}${place(icon, 1570, top + 52, 64, 64)}${place(icon, 1652, top + 68, 32, 32)}${place(icon, 1700, top + 76, 16, 16)}`);
    parts.push(place(mono, 1420, top + 160, 320, 30));
    y += rowH;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y + 20}"><rect width="100%" height="100%" fill="#e5e7eb"/>${parts.join('')}</svg>`;
  fs.writeFileSync(outFile, (await render(svg, { width: W })).png);
  return dirs;
}

const square = (size, bg, art, artSize) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}${place(art, (size - artSize) / 2, (size - artSize) / 2, artSize, artSize)}</svg>`;

/** Export the full kit for direction `dirId`. Returns { files, findings, warnings, proof, dir }. */
export async function exportKit(brief, dirId, out) {
  const dir = directions(brief).find((d) => d.id === String(dirId).toUpperCase());
  if (!dir) throw new Error(`unknown direction "${dirId}" — use A, B or C`);
  const c = brief.colors, files = [], findings = [], warnings = new Set();
  const svgDir = path.join(out, 'svg'), pngDir = path.join(out, 'png'), proofDir = path.join(out, 'proof');
  for (const d of [svgDir, pngDir, proofDir]) fs.mkdirSync(d, { recursive: true });
  const write = (file, data) => { fs.writeFileSync(file, data); files.push(path.relative(out, file).replace(/\\/g, '/')); };
  const L = async (layout, mode) => { const l = await lockupFor(brief, dir, layout, mode); l.warnings.forEach((w) => warnings.add(w)); return l.svg; };
  const both = brief.name.fa && brief.name.en, main = mainLayout(brief);

  // 1. vector masters
  const masters = [];
  const add = async (name, layout, mode) => { const svg = await L(layout, mode); write(path.join(svgDir, name), svg); masters.push({ name, svg, mode }); return svg; };
  const primary = await add(`logo-${main}.svg`, main, 'color');
  const reversed = await add(`logo-${main}-reversed.svg`, main, 'reversed');
  await add('logo-mono-black.svg', main, 'mono-black');
  await add('logo-mono-white.svg', main, 'mono-white');
  if (both) { await add('logo-h-ltr.svg', 'h-ltr', 'color'); await add('logo-stacked.svg', 'stacked', 'color'); await add('logo-stacked-reversed.svg', 'stacked', 'reversed'); }
  if (brief.name.fa && main !== 'fa-only') await add('logo-fa-only.svg', 'fa-only', 'color');
  if (brief.name.fa) { await add('logo-fa-only-mono-black.svg', 'fa-only', 'mono-black'); await add('wordmark-fa.svg', 'wordmark-fa', 'color'); }
  if (brief.name.en) await add('wordmark-en.svg', 'wordmark-en', 'color');
  const icon = await add('logo-icon.svg', 'icon', 'color');
  const iconRev = await add('logo-icon-reversed.svg', 'icon', 'reversed');
  await add('logo-icon-mono-black.svg', 'icon', 'mono-black');
  for (const m of masters) for (const f of await validateSvg(m.svg, { kind: m.mode === 'color' ? 'light' : m.mode, lightBg: c.lightBg, darkBg: c.darkBg })) if (f.level !== 'ok') findings.push({ file: `svg/${m.name}`, ...f });

  // 2. favicon set — a mark that is mostly thin strokes at 16 px is replaced by a simplified monogram there
  const decisions = [];
  let favIcon = icon, favIconRev = iconRev;
  const small = await smallSizeScore(icon);
  if (small.weak && dir.icon !== 'R1_monogram') {
    const mono = async (m) => svgDoc('0 0 100 100', await iconBody('R1_monogram', c, m, { letter: brief.monogram, letterFont: brief.fonts.letter }));
    favIcon = await mono('color'); favIconRev = await mono('reversed');
    write(path.join(svgDir, 'favicon-monogram.svg'), favIcon);
    decisions.push(`Favicons (favicon.svg, favicon.ico, favicon-16/32) use a simplified monogram («${brief.monogram}» in a rounded square, \`svg/favicon-monogram.svg\`) instead of the ${RECIPES[dir.icon].name.toLowerCase()}: at 16 px ${Math.round(small.partialShare * 100)}% of its pixels are only partly covered (limit 50%), so the symbol blurs. The larger icons keep the symbol.`);
  }
  const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>.d{display:none}@media (prefers-color-scheme:dark){.l{display:none}.d{display:inline}}</style><g class="l">${place(favIcon, 0, 0, 100, 100)}</g><g class="d">${place(favIconRev, 0, 0, 100, 100)}</g></svg>`;
  write(path.join(out, 'favicon.svg'), fav);
  const icoImgs = [];
  for (const s of [16, 32, 48]) {
    const r = await render(favIcon, { width: s, height: s });
    icoImgs.push({ size: s, pixels: unpremultiply(r.pixels) });
    if (s !== 48) write(path.join(pngDir, `favicon-${s}.png`), r.png);
  }
  write(path.join(out, 'favicon.ico'), encodeIco(icoImgs));
  write(path.join(pngDir, 'apple-touch-icon.png'), (await render(square(180, c.lightBg, icon, 140), { width: 180 })).png); // opaque: iOS fills transparency with black
  write(path.join(pngDir, 'icon-192.png'), (await render(square(192, null, icon, 192), { width: 192 })).png);
  write(path.join(pngDir, 'icon-512.png'), (await render(square(512, null, icon, 512), { width: 512 })).png);
  // Maskable: the brand color fills the icon when a one-color mark reads on it (≥ 3:1); the mark stays inside the 80% circle.
  const markInk = contrast('#ffffff', c.primary) >= 3 ? '#ffffff' : contrast(c.ink, c.primary) >= 3 ? c.ink : null;
  let maskArt, maskField;
  if (markInk) {
    const acc = dir.accentDots !== 'none' && contrast(c.accentOnPrimary, c.primary) >= 3 ? c.accentOnPrimary : null;
    const mark = svgDoc('0 0 100 100', await markOnField(dir.icon, markInk, acc, { letter: brief.monogram, letterFont: brief.fonts.letter, accentDot: !!acc }));
    let size = 0.8 * 512;
    while (size > 128 && (await inkRadius(square(512, null, mark, size))) > 0.36) size -= 16;
    maskArt = square(512, null, mark, size); maskField = c.primary;
    decisions.push(`Maskable app icon: the brand color ${c.primary} fills the whole icon; the mark is drawn in ${markInk} (${contrast(markInk, c.primary).toFixed(2)}:1)${acc ? ` with the dot in ${acc}` : ''}, inside the 80% safe circle.`);
  } else {
    maskArt = square(512, null, icon, 0.56 * 512); maskField = c.lightBg;
    decisions.push(`Maskable app icon: neither white nor the ink color reaches 3:1 on the brand color ${c.primary}, so the icon sits on the light background.`);
  }
  const radius = await inkRadius(maskArt);
  if (radius > 0.4) findings.push({ file: 'png/icon-maskable-512.png', level: 'FAIL', id: 'maskable', msg: `art reaches ${Math.round(radius * 100)}% of the size from the center (safe zone is 40%)` });
  write(path.join(pngDir, 'icon-maskable-512.png'), (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${maskField}"/>${inner(maskArt)}</svg>`, { width: 512 })).png);

  // 3. rasters for web, social and email
  write(path.join(pngDir, 'logo-light@2x.png'), (await render(primary, { width: 1600 })).png);
  write(path.join(pngDir, 'logo-dark@2x.png'), (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbOf(reversed).join(' ')}">${inner(reversed)}</svg>`, { width: 1600, background: c.darkBg })).png);
  const og = [`<rect width="1200" height="630" fill="${c.lightBg}"/>`, place(primary, 140, brief.tagline.fa ? 170 : 215, 920, 200)];
  if (brief.tagline.fa) og.push(await label(brief.tagline.fa, 40, 600, 470, c.ink, 'vazirmatn-bold', 'middle'));
  write(path.join(pngDir, 'og-image.png'), (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">${og.join('')}</svg>`, { width: 1200 })).png);
  write(path.join(pngDir, 'avatar-640.png'), (await render(square(640, c.lightBg, icon, 0.6 * 640), { width: 640 })).png);
  write(path.join(pngDir, 'email-signature.png'), (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80"><rect width="320" height="80" fill="#ffffff"/>${place(primary, 8, 12, 304, 56)}</svg>`, { width: 320 })).png);

  // 4. web manifest + the stack's integration files (integrations.mjs)
  write(path.join(out, 'site.webmanifest'), JSON.stringify({ name: brief.name.fa || brief.name.en, short_name: brief.name.fa || brief.name.en, icons: [
    { src: '/brand/png/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/brand/png/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/brand/png/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }], theme_color: c.primary, background_color: c.lightBg, display: 'standalone', dir: brief.name.fa ? 'rtl' : 'ltr', lang: brief.name.fa ? 'fa' : 'en' }, null, 2));
  const integ = integrationFor(brief.stack);
  for (const [name, text] of integ.files({ c, brief, out })) {
    fs.mkdirSync(path.dirname(path.join(out, name)), { recursive: true });
    write(path.join(out, name), text);
  }

  // 5. proof sheet (by eye) and brand sheet
  let proof = null;
  if (brief.name.fa) { proof = await proofSheet(brief.name.fa, brief.fonts.fa, path.join(proofDir, 'proof-wordmark.png')); files.push('proof/proof-wordmark.png'); }
  await brandSheet(brief, path.join(out, 'brand-sheet.png'), { primary, reversed, icon });
  files.push('brand-sheet.png');
  const report = kitReport(brief, dir, [...files, 'kit-report.md'], findings, [...warnings], proof, decisions, integ);
  write(path.join(out, 'kit-report.md'), report);
  return { files, findings, warnings: [...warnings], proof, dir, decisions };
}

async function brandSheet(brief, file, { primary, reversed, icon }) {
  const c = brief.colors, p = [];
  p.push(`<rect width="1920" height="1080" fill="#eef0f3"/>`);
  p.push(`<rect x="0" y="0" width="960" height="420" fill="${c.lightBg}"/>${place(primary, 120, 110, 720, 200)}`);
  const [, , vw, vh] = vbOf(primary), s = Math.min(720 / vw, 200 / vh), X = 0.25 * vh * s;
  p.push(`<rect x="${r2(480 - (vw * s) / 2 - X)}" y="${r2(210 - (vh * s) / 2 - X)}" width="${r2(vw * s + 2 * X)}" height="${r2(vh * s + 2 * X)}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6"/>`);
  p.push(await label('Clear space: keep X = 1/4 of the logo height free on every side', 20, 40, 395, '#4b5563', 'inter:500'));
  p.push(`<rect x="960" y="0" width="960" height="420" fill="${c.darkBg}"/>${place(reversed, 1080, 110, 720, 200)}`);
  p.push(await label('On dark backgrounds use the reversed logo', 20, 1000, 395, '#cbd5e1', 'inter:500'));
  p.push(`<rect x="0" y="420" width="640" height="380" fill="#f8fafc"/>`);
  let x = 40;
  for (const sz of [128, 64, 32, 16]) { p.push(place(icon, x, 540 + (128 - sz) / 2, sz, sz)); x += sz + 36; }
  p.push(`<defs><clipPath id="av"><circle cx="560" cy="604" r="64"/></clipPath></defs><g clip-path="url(#av)"><rect x="496" y="540" width="128" height="128" fill="${c.lightBg}"/>${place(icon, 516, 560, 88, 88)}</g><circle cx="560" cy="604" r="64" fill="none" stroke="#cbd5e1"/>`);
  p.push(await label('Icon at 128, 64, 32, 16 px and in a round avatar', 20, 40, 470));
  p.push(`<rect x="640" y="420" width="640" height="380" fill="#ffffff"/>`);
  p.push(await label('Colors', 22, 680, 470));
  const sw = [['brand (exact)', c.brandExact, c.lightBg], ['logo primary', c.primary, c.lightBg], ['ink', c.ink, c.lightBg], ['accent (logo, on light)', c.accentOnLight, c.lightBg], ['on dark', c.onDark, c.darkBg], ['dark background', c.darkBg, c.onDark]];
  for (let i = 0; i < sw.length; i++) {
    const [name, hex, against] = sw[i], sx = 680 + (i % 3) * 195, sy = 500 + Math.floor(i / 3) * 140;
    p.push(`<rect x="${sx}" y="${sy}" width="175" height="70" rx="8" fill="${hex}" stroke="#e5e7eb"/>`);
    p.push(await label(name, 17, sx, sy + 95));
    p.push(await label(`${hex}  ${contrast(hex, against).toFixed(1)}:1 on ${against === c.darkBg ? 'dark' : against === c.onDark ? 'on-dark' : 'light'}`, 15, sx, sy + 118, '#4b5563', 'inter:400'));
  }
  p.push(`<rect x="1280" y="420" width="640" height="380" fill="#f8fafc"/>`);
  p.push(await label('Typography', 22, 1320, 470));
  if (brief.name.fa) { p.push(await label(brief.name.fa, 64, 1880, 580, c.ink, brief.fonts.fa, 'end')); p.push(await label(`Persian: ${brief.fonts.fa}, letter-spacing always 0`, 17, 1320, 620, '#4b5563', 'inter:500')); }
  if (brief.name.en) { p.push(await label(brief.name.en, 52, 1320, 710, c.ink, brief.fonts.en)); p.push(await label(`Latin: ${brief.fonts.en}`, 17, 1320, 745, '#4b5563', 'inter:500')); }
  p.push(`<rect x="0" y="800" width="1920" height="280" fill="#ffffff"/>`);
  p.push(await label("Don'ts", 22, 40, 845));
  const [, , pw, ph] = vbOf(primary);
  const box = (i) => 40 + i * 470;
  p.push(`<svg x="${box(0)}" y="880" width="420" height="130" viewBox="0 0 ${pw} ${ph}" preserveAspectRatio="none">${inner(primary)}</svg>`);
  p.push(`<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-opacity="0.45"/></filter></defs><g filter="url(#sh)">${place(primary, box(1), 890, 420, 110)}</g>`);
  p.push(`<rect x="${box(2)}" y="880" width="420" height="130" fill="${c.accent}"/>${place(primary, box(2) + 20, 900, 380, 90)}`);
  if (brief.name.fa) {
    const fa = await shapeText(brief.name.fa, brief.fonts.fa, { size: 80 });
    const spread = fa.glyphs.map((g, i) => transformPath(g.d, { tx: i * 14 })).join('');
    const w = fa.bbox.w + fa.glyphs.length * 14;
    p.push(`<path fill="${c.ink}" d="${transformPath(spread, { tx: box(3) + 210 - w / 2 - fa.bbox.x0, ty: 975 })}"/>`);
  }
  const notes = ['Do not stretch', 'No shadows or effects', 'No low-contrast backgrounds', 'Never letter-space Persian'];
  for (let i = 0; i < 4; i++) p.push(await label(`× ${notes[i]}`, 19, box(i), 1050, '#b91c1c'));
  fs.writeFileSync(file, (await render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">${p.join('')}</svg>`, { width: 1920 })).png);
}

/** The same finding in several files → one entry with the file list. */
function group(findings) {
  const m = new Map();
  for (const f of findings) { const key = `${f.level}|${f.id}|${f.msg}`; if (!m.has(key)) m.set(key, [f, []]); m.get(key)[1].push(f.file); }
  return [...m.values()];
}

export function kitReport(brief, dir, files, findings, warnings, proof, decisions = [], integ = integrationFor(brief.stack)) {
  const c = brief.colors;
  const iran = brief.market === 'iran';
  const latin = hasLatin(`${brief.name.fa || ''} ${brief.name.en || ''}`);
  const blocking = findings.filter((f) => f.level === 'FAIL');
  return `# Brand kit — ${brief.name.fa || ''} ${brief.name.en || ''}

Generated ${new Date().toISOString().slice(0, 10)} by brand-logo-studio · direction **${dir.id}: ${dir.title}**

## Check these by eye before using the logo
- Open \`proof/proof-wordmark.png\`: every letter, dot and join of «${brief.name.fa || '—'}» must be right${proof ? ` (browser comparison: ${proof.chrome.status}${proof.chrome.score ? `, ${(proof.chrome.score * 100).toFixed(1)}% ink overlap` : ''})` : ''}.
- Open \`brand-sheet.png\`: the icon must still read at 16 px; the reversed logo must be clear on dark.
- Automated checks: ${blocking.length ? `${blocking.length} blocking problem(s), listed under Validation` : 'no blocking problems'}. **Passing them does not prove the logo is good, original or free to register.** Search for similar marks before using it${iran ? ' (references/legal-iran.md)' : ' in the trademark register of every country where you trade'}.

${decisions.length ? `## Decisions made automatically
${decisions.map((d) => `- ${d}`).join('\n')}

` : ''}## Files
${files.map((f) => `- \`${f}\``).join('\n')}

${integ.install}

## Colors
| Role | Hex | On white | On dark (${c.darkBg}) |
|---|---|---|---|
${[['brand (exact)', c.brandExact], ['logo primary', c.primary], ['ink (wordmark)', c.ink], ['accent (palette)', c.accent], ['accent on light (logo)', c.accentOnLight], ['accent inside brand color', c.accentOnPrimary], ['on dark', c.onDark], ['accent on dark', c.accentOnDark]].map(([n, h]) => `| ${n} | \`${h}\` | ${contrast(h, '#ffffff').toFixed(2)}:1 | ${contrast(h, c.darkBg).toFixed(2)}:1 |`).join('\n')}
${c.notes.length ? '\n' + c.notes.map((n) => `- ${n}`).join('\n') : ''}

## Fonts (outlined into the logo — the font files are not needed to display it)
- Persian \`${brief.fonts.fa}\` · Latin \`${brief.fonts.en}\` · monogram \`${brief.fonts.letter}\`. Licenses and sources: assets/fonts/FONTS.md in the skill.

## Validation
${findings.length ? group(findings).map(([f, list]) => `- ${f.level} · ${f.id}: ${f.msg}\n  in ${list.map((x) => `\`${x}\``).join(', ')}`).join('\n') : '- All masters: no live text, no external references, nothing clipped, contrast ≥ 3:1, survives one-color print.'}
${warnings.length ? '\n' + warnings.map((w) => `- note: ${w}`).join('\n') : ''}

## Legal notes ⏱ (as of 2026-10-16 — not legal advice)
${iran ? `${brief.marketSource === 'default' ? '- Market not set in the brief or `.web-ui-playbook.json` — the Iran notes below are shown by default; set `"market": "global"` if the brand is not for Iran.\n' : ''}${latin ?'- The logo contains Latin letters. According to the research this skill is based on (1404–1405 / 2025–2026), registering a mark with Latin letters in Iran requires a commercial card (کارت بازرگانی). ' + (brief.name.fa ? '`svg/logo-fa-only.svg` is the Persian-only version for a domestic filing.' : 'This brand has no Persian name yet, so there is no Persian-only version for a domestic filing.') + ' **Verify with an IP attorney** before filing — this rule was not independently confirmed.' : '- The logo is Persian-only.'}
- Search the Iranian trademark database and the official gazette before use (steps in references/legal-iran.md); verify with an IP attorney before relying on the result.` : `- Search the trademark register of every country where the brand will trade (for example WIPO's Global Brand Database) before use, and verify with an IP attorney before relying on the result.
- Copyright and trademark rules differ by country; nothing in this kit is legal advice.`}
`;
}
