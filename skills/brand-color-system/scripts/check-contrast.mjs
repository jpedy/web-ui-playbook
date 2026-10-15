#!/usr/bin/env node
/**
 * brand-color-system — check-contrast.mjs (zero dependencies, Node 18+)
 *
 * Audit the color tokens of a project's CSS (web-ui-playbook token names), or check single pairs.
 *
 *   node check-contrast.mjs resources/css/app.css [more.css] [--fa] [--json]
 *   node check-contrast.mjs --pair "#ffffff on #0f766e" [--pair "..."] [--fa]
 *
 * Reads custom properties from :root / html / @theme (light) and .dark / [data-theme="dark"] /
 * @media (prefers-color-scheme: dark) (dark). Resolves var() chains and light-dark().
 * Values it cannot compute (color-mix(), relative colors, missing tokens) are reported as
 * "could not resolve" — never counted as passed.
 *
 * Exit 1 if any pair fails WCAG 2.2 AA. With --fa, pairs between 4.5:1 and 5.5:1 are reported as
 * house-rule warnings (Persian small text), not failures.
 */
import fs from 'node:fs';
import { parseColor, composite, contrast, apca, fmtRatio } from './color-core.mjs';
import { PAIRS, FALLBACK, targetFor, wcagFloor } from './token-pairs.mjs';

const args = process.argv.slice(2);
const fa = args.includes('--fa');
const asJson = args.includes('--json');
const pairs = [];
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pair') pairs.push(args[++i]);
  else if (!args[i].startsWith('--')) files.push(args[i]);
}
if (!files.length && !pairs.length) {
  console.log('Usage: node check-contrast.mjs <file.css> [...] [--fa] [--json]\n       node check-contrast.mjs --pair "#ffffff on #0f766e" [--fa]');
  process.exit(2);
}

// ---------- ad-hoc pairs ----------
if (pairs.length) {
  let bad = 0;
  for (const p of pairs) {
    const [a, b] = p.split(/\s+on\s+/i).map((s) => s.trim());
    const fg = parseColor(a), bg = parseColor(b);
    if (!fg || !bg) { console.log(`✗ could not parse "${p}" (use: "#fff on #0f766e")`); bad++; continue; }
    const fgc = composite(fg, bg);
    const r = contrast(fgc, bg);
    const lc = apca(fgc, bg);
    const v = (min) => (r >= min ? '✓' : '✗');
    console.log(`${a} on ${b}: ${fmtRatio(r)}:1 · APCA Lc ${Math.round(lc)}`);
    console.log(`  ${v(4.5)} normal text (4.5:1)  ${v(3)} large text ≥ 24px / bold ≥ 18.66px (3:1)  ${v(3)} borders, icons, focus rings (3:1)${fa ? `  ${v(5.5)} Persian small text house rule (5.5:1)` : ''}`);
    if (r < 4.5) bad++;
  }
  if (!files.length) process.exit(bad ? 1 : 0);
}

// ---------- CSS parsing ----------
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
/** Walk brace blocks; returns [{context: ['@media …', ':root'], body}] with nested blocks removed from body. */
function blocks(css) {
  const out = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const head = css.slice(start, i);
      stack.push({ sel: head.slice(Math.max(head.lastIndexOf(';'), head.lastIndexOf('}')) + 1).trim(), from: i + 1 });
      start = i + 1;
    } else if (ch === '}') {
      const top = stack.pop();
      if (top) out.push({ context: [...stack.map((s) => s.sel), top.sel], body: css.slice(top.from, i).replace(/\{[^{}]*\}/g, '') });
      start = i + 1;
    }
  }
  return out;
}
const isDark = (ctx) => ctx.some((s) => /\.dark\b|data-theme\s*=\s*["']?dark|prefers-color-scheme:\s*dark/.test(s));
const isLight = (ctx) => !isDark(ctx) && /^(:root|html|:host)\b|^@theme/.test(ctx[ctx.length - 1]);

const vars = { light: {}, dark: {} };
for (const f of files) {
  if (!fs.existsSync(f)) { console.error(`Not found: ${f}`); process.exit(2); }
  for (const b of blocks(strip(fs.readFileSync(f, 'utf8')))) {
    const mode = isDark(b.context) ? 'dark' : isLight(b.context) ? 'light' : null;
    if (!mode) continue;
    for (const m of b.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) vars[mode][m[1]] = m[2].trim();
  }
}
const scope = (mode) => (mode === 'dark' ? { ...vars.light, ...vars.dark } : vars.light);

/** Resolve a CSS value to a color; returns {color} or {why}. */
function resolve(value, mode, depth = 0) {
  if (depth > 12) return { why: 'var() loop' };
  let v = value.trim();
  const ld = v.match(/^light-dark\(\s*([\s\S]+)\)$/);
  if (ld) {
    let d = 0, cut = -1;
    for (let i = 0; i < ld[1].length; i++) { const c = ld[1][i]; if (c === '(') d++; else if (c === ')') d--; else if (c === ',' && d === 0) { cut = i; break; } }
    if (cut < 0) return { why: `cannot parse ${v}` };
    v = mode === 'dark' ? ld[1].slice(cut + 1) : ld[1].slice(0, cut);
    return resolve(v, mode, depth + 1);
  }
  const vr = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
  if (vr) {
    const val = scope(mode)[vr[1]];
    if (val != null) return resolve(val, mode, depth + 1);
    if (vr[2]) return resolve(vr[2], mode, depth + 1);
    return { why: `${vr[1]} is not defined` };
  }
  if (/color-mix|\bfrom\s|calc\(/.test(v)) return { why: `computed value (${v.slice(0, 40)}…) — check in the browser` };
  const c = parseColor(v);
  return c ? { color: c } : { why: `not a color: ${v.slice(0, 40)}` };
}
function token(name, mode) {
  const s = scope(mode);
  for (const key of [`--${name}`, `--color-${name}`]) if (s[key] != null) return { ...resolve(s[key], mode), key };
  return { missing: true };
}

const hasDark = Object.keys(vars.dark).length > 0;
const results = [];
for (const mode of hasDark ? ['light', 'dark'] : ['light']) {
  const bgPage = token('bg', mode).color || parseColor(mode === 'dark' ? '#000' : '#fff');
  for (const [fgName, bgName, kind] of PAIRS) {
    let fgT = token(fgName, mode);
    let fgUsed = fgName;
    if (fgT.missing && FALLBACK[fgName]) { fgT = token(FALLBACK[fgName], mode); fgUsed = FALLBACK[fgName]; }
    const bgT = token(bgName, mode);
    if (fgT.missing || bgT.missing) continue; // token not used by this project
    const row = { mode, fg: fgUsed, bg: bgName, kind };
    if (!fgT.color || !bgT.color) { results.push({ ...row, status: 'unresolved', why: fgT.why || bgT.why }); continue; }
    const bg = composite(bgT.color, bgPage);
    const fg = composite(fgT.color, bg);
    const r = contrast(fg, bg);
    const target = targetFor(kind, fa);
    results.push({ ...row, ratio: r, apca: apca(fg, bg), target, status: r >= target ? 'pass' : r >= wcagFloor(kind) ? 'house-rule' : 'fail' });
  }
}

const count = (s) => results.filter((r) => r.status === s).length;
if (asJson) console.log(JSON.stringify({ files, fa, results }, null, 2));
else {
  if (!results.length) console.log('No web-ui-playbook color tokens (--bg, --text, --primary…) found in these files.');
  for (const r of results) {
    const mark = { pass: '✓', fail: '✗ FAIL', 'house-rule': '⚠ house rule', unresolved: '? could not resolve' }[r.status];
    const what = `${r.mode.padEnd(5)} ${`--${r.fg}`.padEnd(17)} on ${`--${r.bg}`.padEnd(17)}`;
    console.log(r.status === 'unresolved' ? `  ${what} ${mark}: ${r.why}` : `  ${what} ${fmtRatio(r.ratio).padStart(6)}:1  needs ${r.target}:1  APCA ${String(Math.round(r.apca)).padStart(4)}  ${mark}`);
  }
  console.log(`\n${results.length} pair(s): ${count('pass')} pass · ${count('fail')} fail · ${count('house-rule')} below the Persian 5.5:1 house rule (WCAG ok) · ${count('unresolved')} could not resolve (check by eye or in the browser)`);
  if (fa) console.log('House rule: small Persian text ≥ 5.5:1 is a readability choice of this skill, not a WCAG requirement.');
}
process.exit(count('fail') ? 1 : 0);
