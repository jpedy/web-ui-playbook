#!/usr/bin/env node
/**
 * web-ui-playbook — detect-stack.mjs (zero dependencies, read-only unless --init)
 *
 *   node detect-stack.mjs [project-dir] [--json]
 *       Detects the stack (Laravel, Next.js, WordPress, static HTML; Vue/Nuxt, Svelte/SvelteKit, Astro, React SPA;
 *       Shopify and site builders), Tailwind version and the languages used. Several candidates (e.g. a Laravel
 *       app with a Next.js folder) → prints ONE question to ask the user.
 *   node detect-stack.mjs [project-dir] --init --market iran|global [--assumed] [--lang fa|en|both] [--stack <s>] [--force]
 *       Writes .web-ui-playbook.json in the project (the one file every script reads). The market is never guessed
 *       from code: pass it from the intake answer; add --assumed when Iran was assumed from a Persian request.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFILE_FILE, TIER, STACK_PATHS } from './profile.mjs';

const SKIP = /^(node_modules|vendor|\.git|\.next|\.nuxt|\.svelte-kit|\.astro|dist|build|out|storage|bootstrap|coverage|\.output|public)$/;
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const read = (f, max = 200000) => { try { return fs.readFileSync(f, 'utf8').slice(0, max); } catch { return ''; } };
const has = (dir, ...p) => fs.existsSync(path.join(dir, ...p));
const ls = (dir) => { try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; } };
const anyFile = (dir, re) => ls(dir).some((e) => e.isFile() && re.test(e.name));

/** What one folder is → { stack, subtype, signals[] } | null */
function inspect(dir) {
  const pkg = readJson(path.join(dir, 'package.json'));
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const composer = readJson(path.join(dir, 'composer.json'));
  const req = { ...(composer?.require || {}), ...(composer?.['require-dev'] || {}) };
  const sig = [];
  // Laravel
  if (req['laravel/framework'] || has(dir, 'artisan')) {
    sig.push(req['laravel/framework'] ? `composer.json requires laravel/framework ${req['laravel/framework']}` : 'artisan file');
    if (has(dir, 'resources', 'views')) sig.push('resources/views/');
    const sub = req['filament/filament'] ? 'filament' : req['livewire/livewire'] ? 'livewire' : req['inertiajs/inertia-laravel'] ? `inertia-${deps.react ? 'react' : deps.vue ? 'vue' : 'js'}` : null;
    if (sub) sig.push(`subtype ${sub}`);
    return { stack: 'laravel', subtype: sub, signals: sig };
  }
  // WordPress theme
  const styleCss = read(path.join(dir, 'style.css'), 4000);
  if (/Theme Name\s*:/i.test(styleCss)) {
    const block = has(dir, 'templates') && anyFile(path.join(dir, 'templates'), /\.html$/i);
    const fn = read(path.join(dir, 'functions.php'));
    const woo = has(dir, 'woocommerce') || /add_theme_support\s*\(\s*['"]woocommerce['"]/.test(fn);
    sig.push('style.css with a "Theme Name:" header');
    if (has(dir, 'theme.json')) sig.push('theme.json');
    sig.push(block ? 'templates/*.html (block theme)' : 'no templates/*.html (classic theme)');
    if (woo) sig.push('WooCommerce support');
    return { stack: 'wordpress', subtype: `${block ? 'block' : 'classic'}${woo ? '+woocommerce' : ''}`, signals: sig };
  }
  // Shopify theme
  if (has(dir, 'layout', 'theme.liquid') || (has(dir, 'config', 'settings_schema.json') && has(dir, 'sections'))) return { stack: 'shopify', subtype: null, signals: ['layout/theme.liquid or config/settings_schema.json'] };
  const cfg = (name) => ls(dir).find((e) => e.isFile() && new RegExp(`^${name}\\.config\\.(js|mjs|cjs|ts|mts)$`).test(e.name))?.name;
  if (deps.next) {
    const app = has(dir, 'app') || has(dir, 'src', 'app');
    sig.push(`package.json: next ${deps.next}`);
    if (cfg('next')) sig.push(cfg('next'));
    sig.push(app ? 'app/ directory (App Router)' : 'pages/ only (Pages Router)');
    if (has(dir, 'tsconfig.json')) sig.push('tsconfig.json (TypeScript)');
    if (has(dir, 'components.json')) sig.push('components.json (shadcn/ui)');
    return { stack: app ? 'next' : 'next-pages', subtype: has(dir, 'components.json') ? 'shadcn' : null, signals: sig };
  }
  if (deps.nuxt || cfg('nuxt')) return { stack: 'nuxt', subtype: null, signals: [deps.nuxt ? `package.json: nuxt ${deps.nuxt}` : cfg('nuxt')] };
  if (deps['@sveltejs/kit']) return { stack: 'sveltekit', subtype: null, signals: [`package.json: @sveltejs/kit ${deps['@sveltejs/kit']}`, ...(cfg('svelte') ? [cfg('svelte')] : [])] };
  if (deps.astro || cfg('astro')) return { stack: 'astro', subtype: null, signals: [deps.astro ? `package.json: astro ${deps.astro}` : cfg('astro')] };
  if (deps.vue) return { stack: 'vue', subtype: null, signals: [`package.json: vue ${deps.vue}`] };
  if (deps.svelte) return { stack: 'svelte', subtype: null, signals: [`package.json: svelte ${deps.svelte}`] };
  if (deps.react && (deps.vite || deps['react-scripts'] || deps['@vitejs/plugin-react'])) return { stack: 'react-spa', subtype: null, signals: [`package.json: react ${deps.react}`, deps.vite ? `vite ${deps.vite}` : 'react-scripts'] };
  // Site builders (exported or saved pages) and plain static HTML
  const htmls = ls(dir).filter((e) => e.isFile() && /\.html?$/i.test(e.name)).map((e) => e.name);
  if (htmls.length) {
    for (const h of htmls.slice(0, 10)) {
      const t = read(path.join(dir, h), 60000);
      const gen = t.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const b = /wix/i.test(gen) || /static\.wixstatic\.com/.test(t) ? 'wix' : /webflow/i.test(gen) || /data-wf-site/.test(t) ? 'webflow' : /elementor/i.test(gen) || /class=["'][^"']*elementor-/.test(t) ? 'elementor' : /squarespace/i.test(gen) ? 'squarespace' : /framer/i.test(gen) ? 'framer' : null;
      if (b) return { stack: 'builder', subtype: b, signals: [`${h}: ${gen ? `generator "${gen}"` : `${b} markup`}`] };
    }
    return { stack: 'static', subtype: null, signals: [`${htmls.length} HTML file(s): ${htmls.slice(0, 3).join(', ')}${htmls.length > 3 ? '…' : ''}`, ...(pkg ? ['package.json without a framework'] : [])] };
  }
  return null;
}

function tailwindVersion(dir, stack) {
  const pkg = readJson(path.join(dir, 'package.json'));
  const v = pkg && ({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).tailwindcss;
  if (v) { const m = String(v).match(/(\d+)/); if (m) return Number(m[1]); }
  const dirs = (STACK_PATHS[stack]?.css || []).map((d) => path.join(dir, d)).filter((d) => fs.existsSync(d));
  for (const d of dirs) for (const e of ls(d)) if (e.isFile() && /\.css$/i.test(e.name) && /@import\s+["']tailwindcss["']/.test(read(path.join(d, e.name)))) return 4;
  if (has(dir, 'tailwind.config.js') || has(dir, 'tailwind.config.cjs') || has(dir, 'tailwind.config.ts')) return 3;
  return null;
}

/** Languages from templates, locale files and config → { fa, en, dir, evidence[] } */
function languages(dir, stack) {
  const ev = [];
  let fa = 0, en = 0, rtlAttr = false, faAttr = false;
  const files = [];
  const exts = /\.(html?|blade\.php|php|jsx|tsx|vue|svelte|astro|mdx?|liquid)$/i;
  const walk = (d, depth) => { if (depth > 4 || files.length >= 60) return; for (const e of ls(d)) { if (SKIP.test(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p, depth + 1); else if (exts.test(e.name)) files.push(p); } };
  for (const t of STACK_PATHS[stack]?.templates || ['.']) if (fs.existsSync(path.join(dir, t))) walk(path.join(dir, t), 0);
  for (const f of files) {
    const t = read(f, 100000);
    fa += (t.match(/[پچژکگیآ-ي]/g) || []).length;
    en += (t.replace(/<[^>]*>|\{[^}]*\}|@\w+|\b(class|className|href|src|div|span|const|return|import|function)\b/g, ' ').match(/\b[A-Za-z]{3,}\b/g) || []).length;
    if (/\bdir\s*=\s*["']rtl/.test(t)) rtlAttr = true;
    if (/\blang\s*=\s*["']fa/.test(t)) faAttr = true;
  }
  if (fa > 40) ev.push(`${fa} Persian letters in ${files.length} template file(s)`);
  if (rtlAttr) ev.push('dir="rtl" in a template');
  if (faAttr) ev.push('lang="fa" in a template');
  const appCfg = read(path.join(dir, 'config', 'app.php'));
  if (/'locale'\s*=>\s*env\([^)]*['"]fa['"]|'locale'\s*=>\s*['"]fa['"]/.test(appCfg)) { ev.push("config/app.php locale 'fa'"); faAttr = true; }
  for (const loc of ['messages', 'locales', 'lang', 'i18n', 'src/messages', 'src/locales']) for (const n of ['fa.json', 'fa']) if (has(dir, loc, n)) { ev.push(`${loc}/${n}`); faAttr = true; }
  const isFa = fa > 40 || rtlAttr || faAttr;
  return { fa: isFa, en: !isFa || en > 400, dir: isFa ? 'rtl' : 'ltr', evidence: ev };
}

export function detectStack(root = '.') {
  root = path.resolve(root);
  const candidates = [];
  const pushIn = (dir) => { const r = inspect(dir); if (r) candidates.push({ ...r, tier: TIER[r.stack], dir: path.relative(root, dir).replace(/\\/g, '/') || '.' }); return r; };
  const top = pushIn(root);
  // a WordPress install: every theme is a candidate
  const themes = path.join(root, 'wp-content', 'themes');
  if (fs.existsSync(themes)) for (const e of ls(themes)) if (e.isDirectory()) pushIn(path.join(themes, e.name));
  // monorepo / app-in-a-folder: one level down (skip when the root is already a framework app)
  if (!top || top.stack === 'static') for (const e of ls(root)) if (e.isDirectory() && !SKIP.test(e.name) && !e.name.startsWith('.') && e.name !== 'wp-content') pushIn(path.join(root, e.name));
  // a static root that only holds other apps is not a candidate itself
  const apps = candidates.filter((c) => c.stack !== 'static');
  const list = apps.length && candidates[0]?.stack === 'static' && candidates[0].dir === '.' ? candidates.filter((c) => !(c.stack === 'static' && c.dir === '.')) : candidates;
  const primary = list.length === 1 ? list[0] : null;
  const pick = primary || list[0];
  return {
    root, candidates: list, primary, ambiguous: list.length > 1,
    tailwind: pick ? tailwindVersion(path.join(root, pick.dir), pick.stack) : null,
    language: languages(pick ? path.join(root, pick.dir) : root, pick?.stack),
  };
}

export function question(det) {
  if (!det.candidates.length) return 'This folder has no project yet. Which should I build with: (A) Laravel + Blade, (B) Next.js, (C) WordPress, or (D) plain HTML/CSS?';
  const opts = det.candidates.map((c, i) => `(${String.fromCharCode(65 + i)}) ${c.stack}${c.subtype ? ` (${c.subtype})` : ''} in \`${c.dir}\``);
  return `This folder has several projects. Which one are we working on: ${opts.join(', ')}?`;
}

const isMain = !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const VALUE = ['--market', '--lang', '--stack'];
  const dir = args.find((a, i) => !a.startsWith('--') && !VALUE.includes(args[i - 1])) || '.';
  if (!fs.existsSync(dir)) { console.error(`Not found: ${dir}`); process.exit(2); }
  const det = detectStack(dir);
  if (!args.includes('--init')) {
    if (args.includes('--json')) { console.log(JSON.stringify({ ...det, question: det.primary ? null : question(det) }, null, 2)); process.exit(0); }
    if (!det.candidates.length) console.log('No known stack found.');
    for (const c of det.candidates) console.log(`${c === det.primary ? '→' : '•'} ${c.stack}${c.subtype ? ` (${c.subtype})` : ''} · Tier ${c.tier} · in ${c.dir}\n    ${c.signals.join('\n    ')}`);
    console.log(`Tailwind: ${det.tailwind ? `v${det.tailwind}` : 'not found'} · languages: ${[det.language.fa && 'fa', det.language.en && 'en'].filter(Boolean).join('+')} (${det.language.dir})${det.language.evidence.length ? ` — ${det.language.evidence.join('; ')}` : ''}`);
    if (!det.primary) console.log(`\nAsk the user: ${question(det)}`);
    const pf = path.join(path.resolve(dir), PROFILE_FILE);
    console.log(fs.existsSync(pf) ? `\nProfile: ${pf} exists.` : `\nNo ${PROFILE_FILE} yet — create it with --init --market iran|global after the intake.`);
    process.exit(0);
  }
  // --init
  const market = val('--market');
  if (!['iran', 'global'].includes(market || '')) { console.error('--init needs --market iran|global (from the intake answer). If the request was Persian and the user did not say, use --market iran --assumed and tell the user "Assuming the audience is inside Iran — tell me if not."'); process.exit(2); }
  const stack = val('--stack') || det.primary?.stack;
  if (!stack) { console.error(`Cannot choose the stack automatically. ${question(det)} Then pass --stack <name>.`); process.exit(2); }
  if (!(stack in TIER)) { console.error(`Unknown --stack "${stack}" (known: ${Object.keys(TIER).join(', ')}).`); process.exit(2); }
  const chosen = det.candidates.find((c) => c.stack === stack) || null;
  const projDir = path.resolve(dir, chosen?.dir || '.');
  const file = path.join(projDir, PROFILE_FILE);
  if (fs.existsSync(file) && !args.includes('--force')) { console.error(`${file} already exists — read it and keep to it, or pass --force to replace it.`); process.exit(2); }
  const lang = val('--lang');
  const langs = lang === 'both' ? ['fa', 'en'] : lang === 'fa' || lang === 'en' ? [lang] : [det.language.fa && 'fa', det.language.en && 'en'].filter(Boolean);
  const profile = {
    version: 1,
    stack, subtype: chosen?.subtype || null, tier: TIER[stack],
    languages: langs, dir: langs.includes('fa') ? 'rtl' : 'ltr',
    market, marketAssumed: args.includes('--assumed'),
    paths: STACK_PATHS[stack],
    tailwind: det.tailwind,
    detected: { signals: chosen?.signals || [], languageEvidence: det.language.evidence, date: new Date().toISOString().slice(0, 10) },
  };
  fs.writeFileSync(file, JSON.stringify(profile, null, 2) + '\n');
  console.log(`wrote ${file}\n  stack ${stack} (Tier ${TIER[stack]}) · languages ${langs.join('+')} (${profile.dir}) · market ${market}${profile.marketAssumed ? ' — ASSUMED: tell the user "Assuming the audience is inside Iran — tell me if not."' : ''}`);
  if (TIER[stack] === 3) console.log('  Tier 3 (site builder / hosted theme): only design rules, token values to paste, logo files and checks on a saved page apply — see references/stacks/builders.md.');
}
