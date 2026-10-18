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

// 3b. --release gate
const relFile = path.join(FX, 'release-fa.blade.php'), relHead = fs.readFileSync(relFile, 'utf8');
const expRel = JSON.parse(relHead.match(/expected-release: ({.*})/)[1]), expNorm = JSON.parse(relHead.match(/expected-normal: ({.*})/)[1]);
const rel = audit([relFile, '--release']), nor = audit([relFile]);
const rc = count(rel, 'release-'), nc = count(nor, 'release-');
for (const k of Object.keys(expRel)) check(rc[k] === expRel[k] && (rel.findings || []).filter((f) => f.rule === k).every((f) => f.sev === 'error'), `--release: ${k} ${expRel[k]} errors (got ${rc[k] || 0})`);
for (const k of new Set([...Object.keys(expNorm), ...Object.keys(nc)])) check((nc[k] || 0) === (expNorm[k] || 0) && (nor.findings || []).filter((f) => f.rule === k).every((f) => f.sev === 'warn'), `normal mode: ${k} ${expNorm[k] || 0} warnings (got ${nc[k] || 0})`);
check(rel.status === 1 && !(rel.findings || []).some((f) => /۰۹۱۲ ۱۲۳ ۴۵۶۷/.test(f.msg)), '--release exits 1; the input placeholder hint «۰۹۱۲ ۱۲۳ ۴۵۶۷» is allowed');

// 3c. three switches: market (Iran rules), language (Persian rules), stack — profile file + flags
const sevs = (res, rule) => (res.findings || []).filter((f) => f.rule === rule).map((f) => f.sev);
const badFa = path.join(FX, 'bad-fa.html');
const noMarket = audit([badFa]), withIran = audit([badFa, '--iran']), mGlobal = audit([badFa, '--market', 'global']);
check(sevs(noMarket, 'foreign-host').length === 3 && sevs(noMarket, 'foreign-host').every((s) => s === 'warn'), 'deliberate change (v1.2.0): a Persian page without an Iran market gets foreign-host WARNINGS, not errors');
check(sevs(withIran, 'foreign-host').length === 3 && sevs(withIran, 'foreign-host').every((s) => s === 'error'), '--iran: foreign hosts are errors');
check(sevs(mGlobal, 'foreign-host').every((s) => s === 'warn') && (mGlobal.findings || []).some((f) => f.rule === 'zwnj'), '--market global: still Persian rules for Persian text (language), no Iran errors (market)');
const projDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wup-profile-'));
fs.copyFileSync(badFa, path.join(projDir, 'index.html'));
fs.writeFileSync(path.join(projDir, '.web-ui-playbook.json'), JSON.stringify({ version: 1, stack: 'static', languages: ['fa'], dir: 'rtl', market: 'iran', marketAssumed: true }));
const viaProfile = (() => { const r = spawnSync(process.execPath, [AUDIT, 'index.html', '--json'], { encoding: 'utf8', cwd: projDir }); return JSON.parse(r.stdout); })();
check(sevs(viaProfile, 'foreign-host').every((s) => s === 'error') && sevs(viaProfile, 'foreign-host').length === 3, 'profile market "iran" (from .web-ui-playbook.json) → foreign hosts are errors, no flag needed');
check(viaProfile.settings?.market === 'iran' && viaProfile.settings?.marketAssumed === true && viaProfile.settings?.stack === 'static', 'profile: market, "assumed" marker and stack are reported in the result');
const flagWins = (() => { const r = spawnSync(process.execPath, [AUDIT, 'index.html', '--market', 'global', '--json'], { encoding: 'utf8', cwd: projDir }); return JSON.parse(r.stdout); })();
check(sevs(flagWins, 'foreign-host').every((s) => s === 'warn') && flagWins.settings?.marketSource === '--market flag', 'a command-line flag overrides the profile');
const txt = spawnSync(process.execPath, [AUDIT, 'index.html'], { encoding: 'utf8', cwd: projDir }).stdout;
check(/ASSUMED/.test(txt), 'text report says visibly that the Iran market was assumed');
fs.rmSync(projDir, { recursive: true, force: true });
const en = audit([path.join(FX, 'en-global.html'), '--market', 'global']);
const FA_RULES = /^(arabic-|zwnj|fa-|html-dir|physical-direction|physical-css|space-x|row-reverse)/;
check(!(en.findings || []).some((f) => FA_RULES.test(f.rule)) && !(en.findings || []).some((f) => f.sev === 'error' && /foreign|external/.test(f.rule)), `English LTR page, market global: no Persian or Iran rule fires (got: ${[...new Set((en.findings || []).map((f) => f.rule))].join(', ')})`);
check(sevs(en, 'foreign-host').length === 1 && sevs(en, 'foreign-host')[0] === 'warn', 'English page: the Google Fonts link is still reported, as a privacy/speed warning');
// stack detection
const { detectStack } = await import('./detect-stack.mjs');
const mk = (files) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wup-stack-')); for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); } return d; };
const pkg = (deps) => JSON.stringify({ dependencies: deps });
const STACK_CASES = [
  ['laravel', 'livewire', { 'composer.json': JSON.stringify({ require: { 'laravel/framework': '^12.0', 'livewire/livewire': '^3.0' } }), 'artisan': '', 'resources/views/welcome.blade.php': '<h1>hi</h1>' }],
  ['next', 'shadcn', { 'package.json': pkg({ next: '16.4.2', react: '19.3.1' }), 'app/page.tsx': 'export default function P(){return <h1>Hi</h1>}', 'components.json': '{}' }],
  ['next-pages', null, { 'package.json': pkg({ next: '16.4.2' }), 'pages/index.tsx': '' }],
  ['wordpress', 'block', { 'style.css': '/*\nTheme Name: Test\n*/', 'theme.json': '{"version":3}', 'templates/index.html': '<!-- wp:paragraph -->' }],
  ['wordpress', 'classic+woocommerce', { 'style.css': '/* Theme Name: Old */', 'functions.php': "<?php add_theme_support( 'woocommerce' );", 'index.php': '' }],
  ['static', null, { 'index.html': '<!doctype html><html lang="en"><h1>Hi</h1></html>' }],
  ['nuxt', null, { 'package.json': pkg({ nuxt: '4.6.2' }) }],
  ['sveltekit', null, { 'package.json': pkg({ '@sveltejs/kit': '3.1.0', svelte: '5' }) }],
  ['astro', null, { 'package.json': pkg({ astro: '7.4.0' }) }],
  ['react-spa', null, { 'package.json': JSON.stringify({ dependencies: { react: '19' }, devDependencies: { vite: '7' } }) }],
  ['shopify', null, { 'layout/theme.liquid': '{{ content_for_layout }}' }],
  ['builder', 'webflow', { 'index.html': '<html data-wf-site="123"><meta name="generator" content="Webflow"></html>' }],
];
for (const [stack, subtype, files] of STACK_CASES) {
  const d = mk(files); const r = detectStack(d);
  check(r.primary?.stack === stack && (r.primary?.subtype || null) === subtype, `detect-stack: ${stack}${subtype ? ` (${subtype})` : ''} (got ${r.primary?.stack || 'none'}${r.primary?.subtype ? ` (${r.primary.subtype})` : ''})`);
  fs.rmSync(d, { recursive: true, force: true });
}
const mono = mk({ 'package.json': JSON.stringify({ private: true, workspaces: ['web', 'api'] }), 'web/package.json': pkg({ next: '16.4.2' }), 'web/app/page.tsx': '', 'api/composer.json': JSON.stringify({ require: { 'laravel/framework': '^12' } }), 'api/artisan': '' });
const mr = detectStack(mono);
check(mr.ambiguous && mr.candidates.length === 2 && !mr.primary, 'detect-stack: Next.js + Laravel in one folder → ambiguous, ask one question');
const DS = path.join(DIR, 'detect-stack.mjs');
const noMk = spawnSync(process.execPath, [DS, mono, '--init', '--stack', 'next'], { encoding: 'utf8' });
check(noMk.status === 2 && /--market iran\|global/.test(noMk.stderr), '--init refuses without --market (the market is never guessed from code)');
const ok = spawnSync(process.execPath, [DS, mono, '--init', '--stack', 'next', '--market', 'iran', '--assumed', '--lang', 'fa'], { encoding: 'utf8' });
const written = JSON.parse(fs.readFileSync(path.join(mono, 'web', '.web-ui-playbook.json'), 'utf8'));
check(ok.status === 0 && written.stack === 'next' && written.market === 'iran' && written.marketAssumed === true && written.dir === 'rtl' && /Assuming the audience is inside Iran/.test(ok.stdout), '--init writes the profile into the chosen app folder, records "assumed" and prints the sentence to tell the user');
const again = spawnSync(process.execPath, [DS, mono, '--init', '--stack', 'next', '--market', 'global'], { encoding: 'utf8' });
check(again.status === 2 && /already exists/.test(again.stderr), '--init never overwrites an existing profile without --force');
fs.rmSync(mono, { recursive: true, force: true });

// 3e. Next.js / JSX reader (fixtures/next-fa): cn() strings, TypeScript is not text, generics are not components
const nx = audit([path.join(FX, 'next-fa'), '--contrast', '--css', path.join(DIR, '..', 'assets', 'tokens.css'), '--market', 'iran']);
const pd = (nx.findings || []).filter((f) => f.rule === 'physical-direction').map((f) => f.msg);
check(pd.length === 2 && pd.some((m) => /"ml-4"/.test(m)) && pd.some((m) => /"pl-2"/.test(m)), `JSX: physical classes inside cn() and className={'…'} are found (got ${pd.length})`);
check(!(nx.findings || []).some((f) => /^(zwnj|fa-|arabic-|input-label|h1)/.test(f.rule)), `JSX: no findings from TypeScript code, the htmlFor label or the layout without <h1> (got: ${(nx.findings || []).filter((f) => f.rule !== 'physical-direction').map((f) => f.rule).join(', ') || 'none'})`);
check(nx.contrast && !nx.contrast.unresolved.some((u) => u.why === 'component') && nx.contrast.unresolved.every((u) => u.reason === 'dynamic-class'), 'JSX: TypeScript generics are not read as components; cn() classes are "dynamic-class" (never passed)');

// 3f. static sites (fixtures/static-en, profile stack static): plain-CSS colors are never passed statically; links exist
const stDir = path.join(FX, 'static-en');
const st = (() => { const r = spawnSync(process.execPath, [AUDIT, '.', '--contrast', '--json'], { encoding: 'utf8', cwd: stDir }); return JSON.parse(r.stdout); })();
check(st.contrast?.unresolved.some((u) => u.reason === 'css-rule' && /too light/.test(u.text)) && !(st.findings || []).some((f) => f.rule === 'contrast' && /too light/.test(f.msg)), 'plain CSS: text colored by a CSS rule (.faint) is "could not resolve (css-rule)" — not checked against inherited colors');
check((st.findings || []).some((f) => f.rule === 'broken-link' && f.sev === 'error' && /\/missing/.test(f.msg)) && (st.findings || []).some((f) => f.rule === 'clean-url' && f.sev === 'warn' && /\/work\/case/.test(f.msg)) && !(st.findings || []).some((f) => /"\/"/.test(f.msg)), 'static links: a missing page is an error, a clean URL that needs host rewriting is a warning, "/" is fine');
const { detectStack: ds2 } = await import('./detect-stack.mjs');
check(ds2(stDir).primary?.stack === 'static' && ds2(stDir).candidates.length === 1, 'detect-stack: a static site with a sub-folder of pages is one project, not two');

// 3g. WordPress (fixtures/wp-fa, profile stack wordpress): theme.json presets, has-*-color classes, PHP templates
const wpDir = path.join(FX, 'wp-fa');
const wp = (() => { const r = spawnSync(process.execPath, [AUDIT, '.', '--contrast', '--json'], { encoding: 'utf8', cwd: wpDir }); return JSON.parse(r.stdout); })();
const wpC = (wp.findings || []).filter((f) => f.rule === 'contrast');
check(wpC.length === 1 && /has-faint-color/.test(wpC[0].msg) && /has-surface-background-color/.test(wpC[0].msg) && wp.contrast?.unresolved.length === 0, 'WordPress: has-{slug}-color classes resolve through theme.json presets (faint on surface fails; nothing unresolved)');
check(wp.contrast?.cssFiles.some((f) => /theme\.json$/.test(f)), 'WordPress: theme.json is a token source for --contrast');
check((wp.findings || []).filter((f) => f.rule === 'physical-css').length === 2 && (wp.findings || []).filter((f) => f.rule === 'physical-css').every((f) => f.line === 11), 'block spacing: equal padding-left/right is direction-neutral; only the unequal pair is an error');
check(wp.files === 3 && !(wp.findings || []).some((f) => /html-lang|html-dir/.test(f.rule)), 'PHP templates are read for stack wordpress, and <html <?php language_attributes(); ?>> counts as lang + dir');
const plainDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wup-php-'));
fs.copyFileSync(path.join(wpDir, 'header.php'), path.join(plainDir, 'header.php'));
fs.writeFileSync(path.join(plainDir, 'package.json'), '{}'); // project root without a profile
const notWp = (() => { const r = spawnSync(process.execPath, [AUDIT, '.', '--json'], { encoding: 'utf8', cwd: plainDir }); return JSON.parse(r.stdout); })();
fs.rmSync(plainDir, { recursive: true, force: true });
check(notWp.files === 0, 'without stack wordpress, .php files are not audited (Laravel apps keep their PHP classes out)');

// 3d. progressive disclosure: SKILL.md stays short; every stack adapter has the template's headings
const skill = fs.readFileSync(path.join(DIR, '..', 'SKILL.md'), 'utf8');
const desc = (skill.match(/^description: (.*)$/m) || [])[1] || '';
check(skill.split('\n').length <= 150 && desc.length > 0 && desc.length <= 1024, `SKILL.md ≤ 150 lines (${skill.split('\n').length}) and description ≤ 1024 characters (${desc.length})`);
const STACKS = path.join(DIR, '..', 'references', 'stacks');
const HEADINGS = ['Verified on', 'Project structure', 'Where tokens live', 'Components and templates', 'RTL and i18n', 'Fonts (self-hosted)', 'Icons and favicons', 'Images', 'Forms', 'Motion baseline', 'Accessibility specifics', 'Build and test', 'Audit and render recipe', 'Known pitfalls'];
for (const f of fs.readdirSync(STACKS).filter((n) => n.endsWith('.md') && !['README.md', 'tier2-frameworks.md', 'builders.md'].includes(n))) {
  const t = fs.readFileSync(path.join(STACKS, f), 'utf8');
  const missing = HEADINGS.filter((h) => !t.includes(`## ${h}`));
  check(!missing.length && /## Verified on\n[^\n]*⏱[^\n]*20\d\d-\d\d-\d\d/.test(t), `adapter ${f}: all template headings and a dated "Verified on" line${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
  check(t.split('\n').length <= 160, `adapter ${f}: ≤ 160 lines (${t.split('\n').length})`);
}

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
  const nj = audit([path.join(FX, 'nojs-fa.html'), '--render', path.join(FX, 'nojs-fa.html')]);
  const njm = (nj.findings || []).filter((f) => f.rule.startsWith('nojs')).map((f) => f.msg).join('\n');
  check(/این بند بدون جاوااسکریپت دیده نمی‌شود/.test(njm), 'no-JS view: an ungated hide-before-reveal is reported');
  check(!/دروازهٔ html.js امن است/.test(njm), 'no-JS view: content hidden only under html.js is not reported');
  check(/x-text="name"/.test(njm) && /x-for=/.test(njm), 'no-JS view: x-text and <template x-for> content that needs JavaScript is reported');
  // any stack: a running local server (reverse proxy) and a build folder give the same measurements as the file
  const http = await import('node:http');
  const srv = http.createServer((req, res) => { const f = path.join(FX, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'render-fa.html'); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream', 'content-security-policy': "script-src 'self'" }); res.end(fs.readFileSync(f)); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://localhost:${srv.address().port}`;
  // async child: a blocking spawnSync would stall this test server, which runs in the same process
  const ur = await (async () => { const { spawn } = await import('node:child_process'); return new Promise((resolve) => { let o = ''; const c = spawn(process.execPath, [AUDIT, rfile, '--render', `${base}/render-fa.html`, '--json'], { cwd: DIR }); c.stdout.on('data', (d) => (o += d)); c.on('close', () => resolve(JSON.parse(o))); }); })();
  const urErr = (ur.findings || []).filter((f) => f.rule === 'render-contrast').map((f) => f.msg).join('\n');
  check(ur.render?.[0].status === 'ok' && ur.render[0].kind === 'url' && /رنگ این متن بعد از اجرای اسکریپت/.test(urErr) && /فقط در فریم انیمیشن/.test(urErr), 'render URL mode: a running local server is measured through the audit proxy (its CSP header is dropped so the probe runs) with the same findings');
  srv.close();
  const dr = audit([rfile, '--render', FX, '--pages', 'render-fa']);
  check(dr.render?.[0].status === 'ok' && dr.render[0].kind === 'dir' && (dr.findings || []).some((f) => f.rule === 'render-contrast'), 'render folder mode: --render <build folder> --pages <name> (clean URL /render-fa → render-fa.html)');
  const down = audit([rfile, '--render', 'http://127.0.0.1:9/']);
  check(down.render?.[0].status === 'error' && (down.findings || []).some((f) => f.rule === 'render' && f.sev === 'error' && /not reachable/.test(f.msg)), 'render: an unreachable local server is an ERROR, never "skipped"');
  const sr = (() => { const r = spawnSync(process.execPath, [AUDIT, '.', '--render', '.', '--pages', 'index', '--json'], { encoding: 'utf8', cwd: stDir }); return JSON.parse(r.stdout); })();
  check((sr.findings || []).some((f) => f.rule === 'render-contrast' && /too light/.test(f.msg) && /1\.9\d:1/.test(f.msg)), 'plain CSS: --render measures the CSS-rule color the static check could not (1.90:1 → error)');
  const tg = (sr.findings || []).filter((f) => f.rule === 'render-target').map((f) => f.msg).join('\n');
  check(/"Work" is \d+×1\dpx/.test(tg) && /"Old page"/.test(tg), 'tap targets at 375px: links under 24px are reported (a link next to another link is not "running text")');
  const refs = audit([path.join(FX, 'refs.html'), '--render', path.join(FX, 'refs.html'), '--market', 'iran']);
  const refMsg = (refs.findings || []).filter((f) => f.rule === 'render-foreign-ref');
  check(refMsg.length === 1 && refMsg[0].sev === 'error' && /s\.w\.org/.test(refMsg[0].msg) && !/googleapis|example\.org/.test(refMsg[0].msg), 'render-foreign-ref: an image base URL in inline JSON counts (error for Iran); a JSON registry of .js files and the site\'s own domain do not');
  const remote = audit([rfile, '--render', 'https://example.com/']);
  check(remote.render?.[0].status === 'error' && /only local URLs/.test(remote.render[0].reason), 'render: remote URLs are refused (local hosts only)');
} else console.log('(no Chrome/Edge found: --render checks not run)');
const sk = audit([rfile, '--render', rfile], { CHROME_PATH: 'none' });
check(sk.render?.[0].status === 'skipped' && !(sk.findings || []).some((f) => f.rule.startsWith('render')), 'no browser → render "skipped", nothing passed, nothing downloaded');

console.log(`\nselftest: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
