#!/usr/bin/env node
/**
 * brand-color-system — generate-palette.mjs (zero dependencies, Node 18+)
 *
 * Usage (run from the user's project folder):
 *   node <skill>/scripts/generate-palette.mjs --brand "#0f766e" [options]
 *   node <skill>/scripts/generate-palette.mjs --feel calm [options]          (no brand color yet)
 *
 * Options:
 *   --brand <hex>            exact brand color (kept unchanged in the scale)
 *   --accent <hex>           exact accent color (otherwise derived from --harmony / --feel)
 *   --feel <name>            trust | calm | playful | premium | tech | heritage | minimal (seed when no --brand)
 *   --hue <deg> [--chroma <c>] [--lightness <l>]   manual seed in OKLCH when no --brand
 *   --harmony <h>            complementary (default) | analogous | split | none
 *   --neutral <n>            tinted (default) | pure | warm | cool
 *   --on-primary <m>         auto (default) | white | dark — label color on buttons
 *   --anchor-stop <stop>     force the brand color onto a stop (50…950)
 *   --lang <l>               en (default) | fa | both — fa/both apply the 5.5:1 house rule to small text
 *   --market iran            also warn when the brand is close to a well-known Iranian brand
 *                            (data: references/iran-brand-colors.md, dated — verify)
 *   --competitor "<hex>[:Name]"   extra competitor color (repeatable)
 *   --name <text>            project name for the report
 *   --out <dir>              output folder (default: ./brand-colors in the current folder)
 *   --json                   print the palette JSON to stdout as well
 *
 * Writes: palette.css (drop-in for web-ui-playbook tokens), palette.json, palette-report.md, palette-preview.html.
 * Never writes inside the plugin/skill folder. Exit 1 if any required contrast pair fails (should not happen).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STOPS, cssOklch, fmtRatio } from './color-core.mjs';
import { buildPalette, parseBrandTable } from './palette-engine.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(SCRIPT_DIR, '..');

// ---------- args ----------
const argv = process.argv.slice(2);
const opts = { competitors: [] };
const BOOL = new Set(['json', 'help']);
for (let i = 0; i < argv.length; i++) {
  let a = argv[i];
  if (!a.startsWith('--')) { console.error(`Unexpected argument: ${a}`); process.exit(2); }
  a = a.slice(2);
  let val;
  if (a.includes('=')) [a, val] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
  else if (!BOOL.has(a)) val = argv[++i];
  else val = true;
  const key = a.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (key === 'competitor') {
    const [hex, ...name] = String(val).split(':');
    opts.competitors.push({ hex, name: name.join(':') || hex, category: '', evidence: 'given by user' });
  } else opts[key] = val;
}
if (opts.help || argv.length === 0) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\*\*\n?/, '').replace(/^ \* ?/gm, ''));
  process.exit(argv.length === 0 ? 2 : 0);
}
for (const k of ['hue', 'chroma', 'lightness']) if (opts[k] != null) opts[k] = Number(opts[k]);
if (opts.lang && !['en', 'fa', 'both'].includes(opts.lang)) { console.error('--lang must be en, fa or both'); process.exit(2); }

if (opts.market === 'iran') {
  const table = fs.readFileSync(path.join(SKILL_DIR, 'references', 'iran-brand-colors.md'), 'utf8');
  opts.competitors.push(...parseBrandTable(table));
} else if (opts.market) { console.error(`Unknown --market "${opts.market}" (only "iran" is available).`); process.exit(2); }

// ---------- output folder (never inside the plugin/skill) ----------
const norm = (p) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
const inside = (child, parent) => { const rel = path.relative(norm(parent), norm(child)); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
const skillsDir = path.dirname(SKILL_DIR);
const forbidden = [SKILL_DIR, skillsDir];
if (fs.existsSync(path.join(path.dirname(skillsDir), '.claude-plugin'))) forbidden.push(path.dirname(skillsDir));
const outDir = path.resolve(opts.out || path.join(process.cwd(), 'brand-colors'));
if (forbidden.some((f) => inside(outDir, f))) {
  console.error(`Refusing to write into the skill/plugin folder (${outDir}).\nRun from your project folder, or pass --out <your-project>/resources/css/brand.`);
  process.exit(2);
}

// ---------- build ----------
let p;
try { p = buildPalette({ ...opts, anchorStop: opts.anchorStop != null ? Number(opts.anchorStop) : null }); }
catch (e) { console.error(e.message); process.exit(2); }

// ---------- writers ----------
const ORDER = ['bg', 'surface', 'surface-subtle', 'border', 'border-strong', 'text', 'muted',
  'primary', 'primary-hover', 'primary-fg', 'primary-subtle', 'primary-ink', 'brand', 'accent', 'accent-fg',
  'success', 'success-subtle', 'warning', 'warning-subtle', 'danger', 'danger-subtle', 'info', 'info-subtle', 'focus'];
const ROLE = {
  bg: 'page background', surface: 'cards, inputs', 'surface-subtle': 'hover rows, wells', border: '1px dividers (decorative)',
  'border-strong': 'input/checkbox borders (≥ 3:1)', text: 'body text and headings', muted: 'secondary text',
  primary: 'main button fill', 'primary-hover': 'main button hover', 'primary-fg': 'text on primary buttons',
  'primary-subtle': 'selected/active background', 'primary-ink': 'brand-colored text and links', brand: 'exact brand color: logo, illustrations, large headings',
  accent: 'highlights, badges (≤ 10% of the screen)', 'accent-fg': 'text on accent', focus: 'focus ring',
  success: 'success text/icons', 'success-subtle': 'success background', warning: 'warning text/icons', 'warning-subtle': 'warning background',
  danger: 'error text/icons', 'danger-subtle': 'error background', info: 'info text/icons', 'info-subtle': 'info background',
};
const worst = (mode, tok) => {
  const rows = p.matrix.filter((m) => m.mode === mode && m.fg === tok && m.kind !== 'decor');
  if (!rows.length) return '';
  const w = rows.reduce((a, b) => (a.ratio < b.ratio ? a : b));
  return ` · ${fmtRatio(w.ratio)}:1 on ${w.bg}`;
};
const decl = (name, hex, mode) => `  --${name}: ${cssOklch(hex)}; /* ${hex} ${ROLE[name] || ''}${worst(mode, name)} */`;
const scaleDecl = (prefix, scale) => scale.map((s) => `  --color-${prefix}-${s.stop}: ${cssOklch(s.hex)}; /* ${s.hex}${s.anchored ? ' ← exact' : ''} */`).join('\n');

const css = `/* ==========================================================================
   Brand palette — ${p.meta.name}
   Generated ${p.meta.generated} by brand-color-system/scripts/generate-palette.mjs
   Brand color ${p.brand.hex} kept exactly as brand-${p.brand.stop}.
   Every text/background pair below was checked (WCAG 2.2 AA${p.meta.fa ? '; Persian small text ≥ 5.5:1 house rule' : ''}) —
   see palette-report.md.

   Use with web-ui-playbook: copy this file next to tokens.css and import it AFTER the tokens:
     @import "./tokens.css";
     @import "./palette.css";
   It only defines colors (no @import "tailwindcss"); later definitions win.
   Templates keep using semantic classes: bg-primary text-primary-fg hover:bg-primary-hover,
   text-primary-ink for brand-colored links, bg-brand only for logo/illustration areas.
   ========================================================================== */

:root {
${ORDER.map((t) => decl(t, p.tokens.light[t], 'light')).join('\n')}
}

.dark {
${ORDER.map((t) => decl(t, p.tokens.dark[t], 'dark')).join('\n')}
  color-scheme: dark;
}

@theme inline {
${ORDER.map((t) => `  --color-${t}: var(--${t});`).join('\n')}
}

/* Full scales for rare cases (charts, illustrations). Prefer the semantic tokens above in templates. */
@theme {
${scaleDecl('brand', p.scales.brand)}
${p.scales.accent !== p.scales.brand ? scaleDecl('accent', p.scales.accent) + '\n' : ''}${scaleDecl('base', p.scales.base)}
}
`;

const rnd = (x, d = 2) => Number(x.toFixed(d));
const json = {
  meta: { ...p.meta, generator: 'brand-color-system/generate-palette.mjs', inputs: { ...opts, competitors: undefined } },
  brand: { hex: p.brand.hex, stop: p.brand.stop, oklch: { l: rnd(p.brand.oklch.l, 4), c: rnd(p.brand.oklch.c, 4), h: rnd(p.brand.oklch.h, 2) }, fromUser: p.brand.fromUser },
  tokens: p.tokens,
  scales: Object.fromEntries(Object.entries(p.scales).map(([k, s]) => [k, Object.fromEntries(s.map((x) => [x.stop, x.hex]))])),
  contrast: p.matrix.map((m) => ({ mode: m.mode, fg: m.fg, bg: m.bg, kind: m.kind, ratio: rnd(m.ratio), target: m.target, apcaLc: rnd(m.apca, 1), pass: m.pass, ...(m.note ? { note: m.note } : {}) })),
  decisions: p.decisions, warnings: p.warnings,
  cvd: p.cvd.map((c) => ({ ...c, deltaE: rnd(c.deltaE, 3) })),
};

const CVD_NAME = { protan: 'red-blind (protanopia)', deutan: 'green-blind (deuteranopia)', tritan: 'blue-blind (tritanopia)', achroma: 'grayscale / no color' };
const cvdLines = (() => {
  const byPair = new Map();
  for (const c of p.cvd) { const key = `${c.a} vs ${c.b}`; if (!byPair.has(key)) byPair.set(key, []); byPair.get(key).push(CVD_NAME[c.type]); }
  return [...byPair].map(([pair, types]) => `- **${pair}** look alike for: ${types.join(', ')}.`);
})();
const tableRow = (cells) => `| ${cells.join(' | ')} |`;
const report = `# Brand palette — ${p.meta.name}

Generated ${p.meta.generated} · brand color \`${p.brand.hex}\` (kept exactly as brand-${p.brand.stop}) · language: ${p.meta.lang}${p.meta.fa ? ' — small Persian text uses the **5.5:1 house rule** (stricter than WCAG 4.5:1; a readability choice, not a legal requirement)' : ''}

## What was decided (plain words)
${p.decisions.map((d) => `- ${d}`).join('\n')}

## Warnings
${p.warnings.length ? p.warnings.map((w) => `- ⚠ ${w}`).join('\n') : '- None.'}

## How to use it
1. Copy \`palette.css\` next to \`tokens.css\` (web-ui-playbook) and add \`@import "./palette.css";\` right after the tokens import.
2. Keep using semantic classes: \`bg-primary text-primary-fg hover:bg-primary-hover\` for main buttons, \`text-primary-ink\` for brand-colored links, \`text-muted\` for secondary text, \`bg-success-subtle text-success\` for alerts (always with an icon and a word).
3. Use \`bg-brand\` / \`text-brand\` only for the logo, illustrations and big headings — it is decoration, not a button color${p.tokens.light.primary !== p.tokens.light.brand ? ' (your buttons use a different shade, see above)' : ''}.
4. After building pages, run the contrast check: \`node <skill>/scripts/check-contrast.mjs resources/css/palette.css${p.meta.fa ? ' --fa' : ''}\`, and the page audit \`node <web-ui-playbook>/scripts/audit.mjs resources/views --contrast\`.

## Tokens
${tableRow(['Token', 'Light', 'Dark', 'Used for'])}
${tableRow(['---', '---', '---', '---'])}
${ORDER.map((t) => tableRow([`\`--${t}\``, `\`${p.tokens.light[t]}\``, `\`${p.tokens.dark[t]}\``, ROLE[t]])).join('\n')}

## Contrast check (every pair, both modes)
Text needs ${p.meta.fa ? '5.5:1 (Persian house rule; WCAG minimum 4.5:1)' : '4.5:1'}, button labels 4.5:1 (≥ 14px semibold by the component spec), borders/focus rings 3:1. APCA Lc is shown for information only — ⏱ WCAG 3 and its contrast method are still drafts (as of Oct 2026 — verify before relying); WCAG 2.2 is the standard that counts.

${tableRow(['Mode', 'Foreground', 'Background', 'Ratio', 'Needs', 'APCA Lc', 'Result'])}
${tableRow(['---', '---', '---', '---:', '---:', '---:', '---'])}
${p.matrix.map((m) => tableRow([m.mode, `\`${m.fg}\` ${m.fgHex}`, `\`${m.bg}\` ${m.bgHex}`, `${fmtRatio(m.ratio)}:1`, m.kind === 'decor' ? '—' : `${m.target}:1`, Math.round(m.apca), m.kind === 'decor' ? `info: ${m.note}` : m.pass ? '✓ pass' : '✗ FAIL'])).join('\n')}

## Color-vision check
Status colors are compared as people with color-vision deficiency see them (Machado 2009 simulation, full severity). Pairs that look alike:
${cvdLines.length ? cvdLines.join('\n') : '- None found.'}

This is normal for red/green/amber status colors. The fix is never "more color": every status message keeps its **icon and word** (✓ موفق / ⚠ هشدار / ✕ خطا), and charts use labels or patterns, not color alone.

## Scales
${tableRow(['Stop', ...Object.keys(p.scales)])}
${tableRow(['---', ...Object.keys(p.scales).map(() => '---')])}
${STOPS.map((s, i) => tableRow([s, ...Object.values(p.scales).map((sc) => `\`${sc[i].hex}\`${sc[i].anchored ? ' ←' : ''}`)])).join('\n')}
`;

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const swatchRow = (name, scale) => `<div class="row"><div class="rname">${name}</div>${scale.map((s) => `<div class="sw" style="background:${s.hex};color:${s.lch.l > 0.62 ? '#111' : '#fff'}">${s.anchored ? '<b>★</b> ' : ''}${s.stop}<small>${s.hex}</small></div>`).join('')}</div>`;
const demo = (title) => `
  <header class="nav"><strong class="logo">${esc(p.meta.name)}</strong><a href="#" class="link">${title === 'Light' ? 'Pricing' : 'Docs'}</a></header>
  <h2>${title} mode</h2>
  <p>Body text on the page background. <span class="muted">Muted secondary text for captions and help.</span> <a href="#" class="link">A brand-colored link</a>.</p>
  <div class="btns"><button class="btn">Primary action</button><button class="btn hover">Hover state</button><button class="ghost">Secondary</button><span class="badge">New</span></div>
  <label class="lbl">Email<input class="input" value="name@example.com"></label>
  <div class="alert success">✓ <b>Success.</b> Your changes were saved.</div>
  <div class="alert warning">⚠ <b>Warning.</b> Your trial ends in 3 days.</div>
  <div class="alert danger">✕ <b>Error.</b> The card number is not valid.</div>
  <div class="alert info">ℹ <b>Info.</b> A new version is available.</div>
  ${p.meta.lang !== 'en' ? '<p dir="rtl" lang="fa" class="fa">نمونهٔ متن فارسی: پیش‌ثبت‌نام دورهٔ جدید از امروز شروع شد. <span class="muted">ظرفیت هر کلاس ۱۲ نفر است.</span> <a href="#" class="link">مشاهدهٔ برنامهٔ کلاس‌ها</a></p>' : ''}
  <div class="brandband">--brand ${p.brand.hex}: logo &amp; illustration areas</div>`;
const vars = css.split('@theme inline')[0];
const preview = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Palette preview — ${esc(p.meta.name)}</title>
<style>
${vars}
* { box-sizing: border-box; }
body { margin: 0; font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; background: #e9e9ec; color: #111; }
.wrap { max-width: 1200px; margin: 0 auto; padding: 16px; }
.panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
.panel { background: var(--bg); color: var(--text); border-radius: 14px; padding: 20px; border: 1px solid var(--border); }
.nav { display: flex; justify-content: space-between; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; }
.logo { color: var(--brand); } .dark .logo { color: ${p.matrix.find((m) => m.mode === 'dark' && m.fg === 'brand' && m.bg === 'surface').ratio >= 3 ? 'var(--brand)' : 'var(--primary-ink)'}; } .muted { color: var(--muted); } .link { color: var(--primary-ink); }
h2 { margin: 16px 0 4px; font-size: 20px; }
.btns { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 12px 0; }
.btn { background: var(--primary); color: var(--primary-fg); border: 0; border-radius: 8px; padding: 10px 16px; font: 600 14px system-ui; }
.btn.hover { background: var(--primary-hover); }
.ghost { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 8px; padding: 9px 15px; font: 600 14px system-ui; }
.btn:focus-visible, .ghost:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
.badge { background: var(--accent); color: var(--accent-fg); border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
.lbl { display: grid; gap: 4px; font-size: 13px; color: var(--muted); max-width: 320px; }
.input { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); border-radius: 8px; padding: 8px 10px; font: inherit; }
.alert { border-radius: 8px; padding: 8px 12px; margin: 6px 0; font-size: 14px; }
${['success', 'warning', 'danger', 'info'].map((s) => `.alert.${s} { background: var(--${s}-subtle); color: var(--${s}); }`).join('\n')}
.fa { font-family: Vazirmatn, "Vazirmatn Variable", Vazir, Tahoma, sans-serif; line-height: 1.9; }
.brandband { margin-top: 12px; background: var(--brand); color: #fff; border-radius: 8px; padding: 10px 12px; font-size: 13px; text-shadow: 0 1px 2px #0008; }
.row { display: flex; gap: 2px; margin: 2px 0; align-items: stretch; }
.rname { width: 70px; font: 600 12px system-ui; display: flex; align-items: center; }
.sw { flex: 1; min-width: 0; padding: 8px 4px; font: 12px system-ui; border-radius: 4px; text-align: center; }
.sw small { display: block; opacity: .85; font-size: 10px; }
.notes { background: #fff; border-radius: 14px; padding: 16px 20px; margin-top: 16px; font-size: 14px; }
@media (max-width: 640px) { .sw small { display: none; } .rname { width: 52px; } }
</style></head>
<body><div class="wrap">
<h1 style="margin:8px 0 12px;font-size:22px">${esc(p.meta.name)} — palette preview</h1>
<div class="panels"><section class="panel">${demo('Light')}</section><section class="panel dark">${demo('Dark')}</section></div>
<div class="notes"><h3 style="margin-top:0">Scales (★ = exact brand/accent color)</h3>
${Object.entries(p.scales).map(([k, s]) => swatchRow(k, s)).join('\n')}
<h3>Decisions</h3><ul>${p.decisions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
${p.warnings.length ? `<h3>Warnings</h3><ul>${p.warnings.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
<p>Contrast: ${p.matrix.filter((m) => m.kind !== 'decor').length} required pairs checked, ${p.failures.length} failing. Full table in palette-report.md.</p></div>
</div></body></html>
`;

fs.mkdirSync(outDir, { recursive: true });
const files = { 'palette.css': css, 'palette.json': JSON.stringify(json, null, 2), 'palette-report.md': report, 'palette-preview.html': preview };
for (const [f, content] of Object.entries(files)) fs.writeFileSync(path.join(outDir, f), content);

// ---------- console summary ----------
if (opts.json) console.log(JSON.stringify(json, null, 2));
console.log(`\nPalette "${p.meta.name}" → ${outDir}`);
console.log(`  files: ${Object.keys(files).join(', ')}`);
console.log(`  brand ${p.brand.hex} = brand-${p.brand.stop} · buttons ${p.tokens.light.primary} / ${p.tokens.light['primary-fg']} · links ${p.tokens.light['primary-ink']}`);
for (const d of p.decisions) console.log(`  - ${d}`);
for (const w of p.warnings) console.log(`  ⚠ ${w}`);
const required = p.matrix.filter((m) => m.kind !== 'decor');
console.log(`  contrast: ${required.length - p.failures.length}/${required.length} required pairs pass${p.cvd.length ? ` · ${new Set(p.cvd.map((c) => `${c.a}/${c.b}`)).size} status pair(s) look alike under color-vision deficiency (keep icons + words)` : ''}`);
process.exit(p.failures.length ? 1 : 0);
