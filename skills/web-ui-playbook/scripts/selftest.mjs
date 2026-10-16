#!/usr/bin/env node
/**
 * web-ui-playbook — selftest.mjs (zero dependencies)
 *   node scripts/selftest.mjs                    (uses the installed Chrome/Edge for --render if found)
 *   CHROME_PATH=none node scripts/selftest.mjs   (forces the no-browser path)
 * 1. fixtures/bad-fa.html          — the base audit catches the known problems
 * 2. fixtures/contrast-fa.blade.php — --contrast: 7 errors, 1 house-rule warning, 8 "could not resolve"
 * 3. fixtures/slop-fa.blade.php    — --slop: per-rule counts in the fixture header; false-positive guards;
 *                                     every claim listed; .slop-allow.json overrides; normalization
 * 4. fixtures/render-fa.html       — --render: JS-applied colors measured, rAF updates seen, gradient text
 *                                     never passed, foreign request blocked and reported; graceful skip
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalize } from './slop.mjs';
import { findChrome, renderAudit } from './render.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const AUDIT = path.join(DIR, 'audit.mjs'), FX = path.join(DIR, 'fixtures');
let failed = 0, passed = 0;
const check = (ok, msg) => { if (ok) passed++; else { failed++; console.log(`✗ ${msg}`); } };
const audit = (args, env = {}) => { const r = spawnSync(process.execPath, [AUDIT, ...args, '--json'], { encoding: 'utf8', env: { ...process.env, ...env }, cwd: DIR }); try { return { ...JSON.parse(r.stdout), status: r.status }; } catch { return { status: r.status, findings: [], error: r.stderr || r.stdout }; } };
const count = (res, prefix) => { const c = {}; for (const f of res.findings || []) if (f.rule.startsWith(prefix)) c[f.rule] = (c[f.rule] || 0) + 1; return c; };

// 1. base audit
const bad = audit([path.join(FX, 'bad-fa.html')]);
for (const rule of ['foreign-host', 'arabic-digits', 'arabic-letters', 'physical-direction', 'fa-tracking', 'img-alt', 'icon-button-label', 'zwnj']) check((bad.findings || []).some((f) => f.rule === rule), `bad-fa.html: catches ${rule}`);
check(bad.status === 1, 'bad-fa.html: exit code 1 (errors)');

// 2. contrast
const con = audit([path.join(FX, 'contrast-fa.blade.php'), '--contrast', '--css', path.join(DIR, '..', 'assets', 'tokens.css')]);
const cc = count(con, '');
check(cc.contrast === 7 && cc['fa-contrast'] === 1 && con.contrast?.unresolved.length === 8, `contrast-fa: 7 errors / 1 house warning / 8 unresolved (got ${cc.contrast} / ${cc['fa-contrast']} / ${con.contrast?.unresolved.length})`);

// 3. slop
const slopFile = path.join(FX, 'slop-fa.blade.php');
const head = fs.readFileSync(slopFile, 'utf8');
const expected = JSON.parse(head.match(/expected: (\{.*\})/)[1]), expClaims = Number(head.match(/claims: (\d+)/)[1]);
const slop = audit([slopFile, '--slop']);
const sc = count(slop, 'slop-');
for (const rule of new Set([...Object.keys(expected), ...Object.keys(sc)])) check((sc[rule] || 0) === (expected[rule] || 0), `slop-fa: ${rule} expected ${expected[rule] || 0}, got ${sc[rule] || 0}`);
check(slop.claims?.length === expClaims, `slop-fa: ${expClaims} claims listed for the owner (got ${slop.claims?.length})`);
check(slop.findings.every((f) => f.sev === 'warn' || !f.rule.startsWith('slop')), 'slop findings are warnings only');
const msgs = (slop.findings || []).map((f) => f.msg).join('\n');
const streetLine = head.split('\n').findIndex((l) => l.includes('خیابان انقلاب')) + 1;
check(streetLine > 0 && !(slop.findings || []).some((f) => f.line === streetLine), 'never matches «انقلاب» in a street name or «انقلاب اسلامی»');
check(!/۲٬۵۰۰٬۰۰۰|۱۴۰۵|۰۲۱/.test(msgs), 'prices, years and the contact phone are not number claims');
check(!/همراه باشید|رضایت شما هدف/.test(msgs), 'footer and contact blocks are skipped');
check(!/«نمایش بیشتر»|«ارسال»/.test(msgs), 'in-place «نمایش بیشتر» and the form\'s «ارسال» are not flagged');
check(/«تایید»/.test(msgs), '«تایید» (no hamza) matches the «تأیید» rule');
check(/«یادگيري سريع و آسان»/.test(msgs), 'Arabic ي is normalized before matching (and quoted as written)');
check(/meta description: «برترین»/.test(msgs), 'superlatives in the meta description are flagged');
// .slop-allow.json overrides
const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'wup-slop-'));
fs.copyFileSync(slopFile, path.join(proj, 'page.blade.php'));
fs.writeFileSync(path.join(proj, '.slop-allow.json'), JSON.stringify({ allowPhrases: ['اساتید مجرب'], allowLabels: ['بیشتر بدانید'], disableRules: ['slop-emdash'] }));
const al = spawnSync(process.execPath, [AUDIT, 'page.blade.php', '--slop', '--json'], { encoding: 'utf8', cwd: proj });
const alj = JSON.parse(al.stdout), am = alj.findings.map((f) => f.msg).join('\n');
check(!/«اساتید مجرب»/.test(am.replace(/meta description: «اساتید مجرب»/g, '')) && !/«بیشتر بدانید»/.test(am) && !alj.findings.some((f) => f.rule === 'slop-emdash'), '.slop-allow.json: allowed phrase, allowed label and disabled rule are skipped');
fs.rmSync(proj, { recursive: true, force: true });
// normalization
const n = (s) => normalize(s).text;
check(n('تأیید') === n('تایید') && n('ثبت‌نام') === n('ثبت نام') && n('ي ك') === 'ی ک' && n('۳٣3') === '333' && n('زبـــان') === 'زبان' && n('سَلام') === 'سلام', 'normalization: hamza, ZWNJ = space, Arabic letters, digits, tatweel, diacritics');

// 4. render
const chrome = findChrome();
const rfile = path.join(FX, 'render-fa.html');
if (chrome) {
  const rr = audit([rfile, '--render', rfile]);
  const r = rr.render?.[0];
  const errs = (rr.findings || []).filter((f) => f.rule === 'render-contrast').map((f) => f.msg).join('\n');
  check(r?.status === 'ok', `render: ran in ${path.basename(chrome)}`);
  check(/رنگ این متن بعد از اجرای اسکریپت/.test(errs), 'render: catches a low-contrast color applied by JS after load');
  check(/فقط در فریم انیمیشن/.test(errs), 'render: sees content shown inside requestAnimationFrame (Alpine x-show style)');
  check(/بخش پایین صفحه/.test(errs), 'render: reveal-on-scroll content below the fold (IntersectionObserver + CSS transition) is measured');
  check(r?.unresolved.some((u) => /گرادیان/.test(u.text)) && !/گرادیان/.test(errs), 'render: text on a gradient stays "could not resolve" — never passed');
  check((rr.findings || []).some((f) => f.rule === 'render-external' && /example\.com/.test(f.msg)), 'render: a request to another host is blocked and reported');
  const vp = await renderAudit(rfile, { widths: [375, 1440], modes: ['light'] });
  check(vp.runs.every((x) => x.viewport && x.viewport[0] === x.width), `render: measures at the exact viewport width (headless Chrome alone would lay out 375 as 500): ${vp.runs.map((x) => x.viewport?.[0]).join(', ')}`);
  check(r?.pass + r?.fail + r?.house + r?.unresolved.length === r?.checked, 'render: every checked text is pass, fail or unresolved');
} else console.log('(no Chrome/Edge found: --render checks not run)');
const sk = audit([rfile, '--render', rfile], { CHROME_PATH: 'none' });
check(sk.render?.[0].status === 'skipped' && !(sk.findings || []).some((f) => f.rule.startsWith('render')), 'no browser → render "skipped", nothing passed, nothing downloaded');

console.log(`\nselftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
