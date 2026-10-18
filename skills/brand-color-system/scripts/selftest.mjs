#!/usr/bin/env node
/**
 * brand-color-system — selftest.mjs (zero dependencies)
 *   node scripts/selftest.mjs
 * 1. color-core vs golden values from culori 4.0.2 + apca-w3 0.1.9 (fixtures/golden.json)
 * 2. palette invariants on 60 brand colors × 2 languages (exact brand stop, monotonic scales, all pairs pass)
 * 3. competitor table parses; CLI refuses to write inside the skill folder
 * 4. web-ui-playbook's audit.mjs carries its own copy of the contrast math — it must agree with color-core
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as C from './color-core.mjs';
import { buildPalette, parseBrandTable } from './palette-engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
let failed = 0, passed = 0;
const check = (ok, msg) => { if (ok) passed++; else { failed++; console.log(`✗ ${msg}`); } };

// 1. golden values
const g = JSON.parse(fs.readFileSync(path.join(DIR, 'fixtures', 'golden.json'), 'utf8'));
for (const o of g.oklch) {
  const m = C.hexToOklch(o.hex);
  check(Math.abs(m.l - o.l) < 1e-4 && Math.abs(m.c - o.c) < 1e-4 && (o.c < 0.02 || C.hueDiff(m.h, o.h) < 0.05), `oklch ${o.hex}: got ${m.l} ${m.c} ${m.h}, want ${o.l} ${o.c} ${o.h}`);
  check(C.toHex(C.oklchToRgb(m)) === o.hex, `round-trip ${o.hex}`);
  check(C.toHex(C.parseColor(C.cssOklch(o.hex))) === o.hex, `cssOklch round-trip ${o.hex} → ${C.cssOklch(o.hex)}`);
}
for (const p of g.pairs) {
  const fg = C.parseColor(p.fg), bg = C.parseColor(p.bg);
  check(Math.abs(C.contrast(fg, bg) - p.wcag) < 1e-6, `WCAG ${p.fg}/${p.bg}`);
  check(Math.abs(C.apca(fg, bg) - p.apca) < 1e-6, `APCA ${p.fg}/${p.bg}: ${C.apca(fg, bg)} vs ${p.apca}`);
}
for (const k of g.clamps) {
  const r = C.clampChroma({ l: k.in[0], c: k.in[1], h: k.in[2] });
  check(Math.abs(r.c - k.c) < 5e-4 && C.toHex(C.oklchToRgb(r)) === k.hex, `clampChroma ${k.in}: ${r.c} vs ${k.c}`);
}
const tw = C.hexToOklch('#155dfc'); // Tailwind 4.x blue-600 = oklch(0.546 0.245 262.881)
check(Math.abs(tw.l - 0.546) < 0.001 && Math.abs(tw.c - 0.245) < 0.001 && Math.abs(tw.h - 262.881) < 0.05, 'Tailwind blue-600 reference');
check(C.fmtRatio(4.4999) === '4.49', 'ratios are truncated, never rounded up');
check(C.toHex(C.simulateCvd(C.parseColor('#ffffff'), 'deutan')) === '#ffffff', 'CVD keeps white white');

// 2. palette invariants
const brands = ['#0f766e', '#1e3a8a', '#f59e0b', '#64748b', '#b07a7a', '#ef394e', '#000000', '#ffffff', '#ffff00', '#7c3aed', '#14b8a6', '#fdb713'];
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
while (brands.length < 60) brands.push('#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0'));
for (const b of brands) {
  for (const lang of ['en', 'fa']) {
    const p = buildPalette({ brand: b, lang });
    const sc = p.scales.brand;
    check(sc.filter((s) => s.anchored).length === 1 && sc.find((s) => s.anchored).hex === b, `${b}: exact brand hex kept in scale`);
    for (const [name, s] of Object.entries(p.scales)) {
      const ok = s.every((x, i) => i === 0 || x.lch.l <= s[i - 1].lch.l + 1e-9);
      check(ok, `${b} ${lang}: ${name} scale lightness not monotonic: ${s.map((x) => x.lch.l.toFixed(3)).join(' ')}`);
    }
    check(p.failures.length === 0, `${b} ${lang}: failing pairs ${p.failures.map((f) => `${f.mode} ${f.fg}/${f.bg} ${f.ratio.toFixed(2)}`).join(', ')}`);
    check(p.tokens.light.brand === b, `${b}: --brand is the exact color`);
  }
}
for (const feel of ['trust', 'calm', 'playful', 'premium', 'tech', 'heritage', 'minimal']) {
  const p = buildPalette({ feel, lang: 'fa' });
  check(p.failures.length === 0, `feel ${feel}: failing pairs`);
}
// accent policy: derived accents never sit near error red / success green; industry defaults behave
const { INDUSTRIES, ACCENT_STATUS_GAP } = await import('./palette-engine.mjs');
for (const b of brands) {
  for (const industry of [undefined, ...Object.keys(INDUSTRIES)]) {
    const p = buildPalette({ brand: b, industry });
    if (p.scales.accent === p.scales.brand) continue;
    const h = p.scales.accent[5].lch.h;
    check(C.hueDiff(h, 27) >= ACCENT_STATUS_GAP - 1 && C.hueDiff(h, 150) >= ACCENT_STATUS_GAP - 1, `${b} ${industry || 'no industry'}: accent hue ${h.toFixed(0)} too close to a status hue`);
    check(p.failures.length === 0, `${b} ${industry}: failing pairs with accent policy`);
  }
}
const edu = buildPalette({ brand: '#0d9488', industry: 'education' }).scales.accent[5].lch;
check(Math.abs(edu.h - 88) < 6 && edu.c > 0.08, `teal + education → saffron-gold accent (got hue ${edu.h.toFixed(0)})`);
const fin = buildPalette({ brand: '#1e3a8a', industry: 'finance' }).scales.accent[5].lch;
check(fin.c <= 0.075, `finance → restrained low-chroma accent (got chroma ${fin.c.toFixed(3)})`);
check(buildPalette({ brand: '#0d9488', accent: '#e11d48' }).warnings.some((w) => /error red/.test(w)), 'user accent near error red is kept but warned');
check(buildPalette({ brand: '#0d9488', industry: 'education', harmony: 'analogous' }).decisions.some((d) => /your choice/.test(d)), '--harmony overrides the industry policy');
const muted = buildPalette({ brand: '#64748b' });
check(Math.max(...muted.scales.brand.map((s) => s.lch.c)) < 0.07, 'muted brand stays muted (no chroma floor)');

// 3. competitor table + out-dir guard
const rows = parseBrandTable(fs.readFileSync(path.join(DIR, '..', 'references', 'iran-brand-colors.md'), 'utf8'));
check(rows.length >= 5 && rows.every((r) => /^#[0-9a-f]{6}$/.test(r.hex) && /^\d{4}-\d{2}-\d{2}$/.test(r.checked)), `iran-brand-colors.md parses with dates (${rows.length} rows)`);
const near = buildPalette({ brand: '#ee3a4f', competitors: rows });
check(near.competitors.some((c) => /Digikala/.test(c.name)), 'competitor warning fires for a Digikala-like red');
const gen = path.join(DIR, 'generate-palette.mjs');
const refuse = spawnSync(process.execPath, [gen, '--brand', '#0f766e', '--out', path.join(DIR, '..', 'tmp-out')], { encoding: 'utf8' });
check(refuse.status === 2 && !fs.existsSync(path.join(DIR, '..', 'tmp-out')), 'CLI refuses --out inside the skill folder');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bcs-'));
const ok = spawnSync(process.execPath, [gen, '--brand', '#0f766e', '--lang', 'fa', '--out', tmp], { encoding: 'utf8' });
check(ok.status === 0 && ['palette.css', 'palette.json', 'palette-report.md', 'palette-preview.html'].every((f) => fs.existsSync(path.join(tmp, f))), `CLI writes 4 files to --out (${ok.stderr.trim()})`);
const cc = spawnSync(process.execPath, [path.join(DIR, 'check-contrast.mjs'), path.join(tmp, 'palette.css'), '--fa', '--json'], { encoding: 'utf8' });
const ccOut = cc.status === 0 ? JSON.parse(cc.stdout) : null;
check(ccOut && ccOut.results.length >= 40 && ccOut.results.every((r) => r.status === 'pass'), 'check-contrast re-verifies the generated palette.css');
fs.rmSync(tmp, { recursive: true, force: true });

// 4. audit.mjs math copy (web-ui-playbook) must match color-core
const auditPath = path.join(DIR, '..', '..', 'web-ui-playbook', 'scripts', 'audit.mjs');
if (fs.existsSync(auditPath)) {
  const audit = await import(pathToFileURL(auditPath).href);
  if (audit.colorMath) {
    for (const p of g.pairs.slice(0, 60)) {
      const a = audit.colorMath.contrast(audit.colorMath.parse(p.fg), audit.colorMath.parse(p.bg));
      check(Math.abs(a - p.wcag) < 1e-6, `audit.mjs contrast ${p.fg}/${p.bg}: ${a} vs ${p.wcag}`);
    }
    for (const o of g.oklch.slice(0, 40)) {
      const css = C.cssOklch(o.hex);
      check(C.toHex(audit.colorMath.parse(css)) === o.hex, `audit.mjs parses ${css}`);
    }
  } else check(false, 'audit.mjs does not export colorMath');
  // 5. audit.mjs --contrast on its fixture: failures found, unresolved reported and never counted as passed
  const wDir = path.join(DIR, '..', '..', 'web-ui-playbook');
  const run = spawnSync(process.execPath, [auditPath, path.join(wDir, 'scripts', 'fixtures', 'contrast-fa.blade.php'), '--contrast', '--json', '--css', path.join(wDir, 'assets', 'tokens.css')], { encoding: 'utf8' });
  const res = JSON.parse(run.stdout || '{}');
  const errs = (res.findings || []).filter((f) => f.rule === 'contrast').length;
  const house = (res.findings || []).filter((f) => f.rule === 'fa-contrast').length;
  const un = res.contrast?.unresolved || [];
  const whys = new Set(un.map((u) => u.why));
  check(run.status === 1 && errs === 7 && house === 1, `audit --contrast fixture: ${errs} contrast errors (want 7), ${house} house-rule warnings (want 1)`);
  check(un.length === 8 && ['dynamic', 'component', 'image', 'unknown'].every((w) => whys.has(w)), `audit --contrast fixture: ${un.length} unresolved (want 8: dynamic, component, image, unknown)`);
  // 6. cascade order follows @import (palette imported after tokens must win), whatever the folder order
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'bcs-order-'));
  fs.mkdirSync(path.join(proj, 'css', 'brand'), { recursive: true });
  fs.writeFileSync(path.join(proj, 'css', 'app.css'), '@import "tailwindcss";\n@import "./z-tokens.css";\n@import "./brand/palette.css";\n');
  fs.writeFileSync(path.join(proj, 'css', 'z-tokens.css'), ':root { --bg: #ffffff; --text: #111111; --primary: #fde68a; }\n@theme inline { --color-primary: var(--primary); }\n');
  fs.writeFileSync(path.join(proj, 'css', 'brand', 'palette.css'), ':root { --primary: #0f766e; }\n');
  fs.writeFileSync(path.join(proj, 'page.html'), '<html lang="en"><body><button class="bg-primary text-white">Go</button></body></html>\n');
  const ord = spawnSync(process.execPath, [auditPath, path.join(proj, 'page.html'), '--contrast', '--json', '--css', path.join(proj, 'css')], { encoding: 'utf8' });
  const ordRes = JSON.parse(ord.stdout || '{}');
  check(ord.status === 0 && !(ordRes.findings || []).some((f) => f.rule === 'contrast'), 'audit --contrast follows @import order (palette.css overrides tokens)');
  const cc2 = spawnSync(process.execPath, [path.join(DIR, 'check-contrast.mjs'), path.join(proj, 'css', 'app.css'), '--json'], { encoding: 'utf8' });
  const prim = JSON.parse(cc2.stdout || '{"results":[]}').results.find((r) => r.fg === 'primary' && r.bg === 'bg');
  check(prim && prim.ratio > 5, `check-contrast follows @import order (primary on bg ${prim && prim.ratio.toFixed(2)})`);
  fs.rmSync(proj, { recursive: true, force: true });
} else console.log('(web-ui-playbook not installed next to this skill — audit.mjs checks skipped)');

// 7. token formats, market and the project profile (.web-ui-playbook.json)
{
  const gp = path.join(DIR, 'generate-palette.mjs');
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'bcs-prof-'));
  const run = (args) => spawnSync(process.execPath, [gp, '--brand', '#0d9488', ...args], { encoding: 'utf8', cwd: proj });
  const readJ = (d) => JSON.parse(fs.readFileSync(path.join(proj, d, 'palette.json'), 'utf8'));
  const g = run(['--market', 'global', '--out', path.join(proj, 'g')]);
  check(g.status === 0 && fs.existsSync(path.join(proj, 'g', 'palette.css')), '--market global is accepted (no Iranian brand table)');
  const bad = run(['--format', 'nope', '--out', path.join(proj, 'x')]);
  check(bad.status === 2 && /available: /.test(bad.stderr) && !fs.existsSync(path.join(proj, 'x')), 'an unknown --format is refused (with the list) before anything is written');
  if (fs.existsSync(path.join(DIR, '..', '..', 'web-ui-playbook', 'scripts', 'profile.mjs'))) {
    fs.writeFileSync(path.join(proj, '.web-ui-playbook.json'), JSON.stringify({ version: 1, stack: 'laravel', languages: ['fa'], dir: 'rtl', market: 'iran' }));
    const pr = run(['--out', path.join(proj, 'p')]);
    const pj = readJ('p');
    check(pr.status === 0 && pj.meta.inputs.lang === 'fa' && pj.meta.inputs.market === 'iran' && pj.meta.fa === true, 'without --lang/--market the project profile supplies them (fa → 5.5:1 house rule; iran → brand table)');
    const fl = run(['--lang', 'en', '--market', 'global', '--out', path.join(proj, 'f')]);
    const fj = readJ('f');
    check(fl.status === 0 && fj.meta.inputs.lang === 'en' && fj.meta.inputs.market === 'global' && !fj.meta.fa, 'command-line flags override the profile');
  }
  fs.rmSync(proj, { recursive: true, force: true });
}

console.log(`\nselftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
