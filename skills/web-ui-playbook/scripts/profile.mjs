/**
 * web-ui-playbook — profile.mjs (zero dependencies)
 *
 * The project profile: three separate switches every script reads from ONE file in the user's project,
 * `.web-ui-playbook.json` (written by `detect-stack.mjs --init`; format in references/stacks/README.md):
 *   stack     laravel | next | wordpress | static (Tier 1) · next-pages | nuxt | vue | sveltekit | svelte | astro |
 *             react-spa (Tier 2) · shopify | builder (Tier 3)
 *   language  languages: ["fa"] | ["en"] | ["fa","en"]; dir: "rtl" | "ltr"
 *   market    "iran" | "global" (+ marketAssumed: true when Iran was assumed from a Persian request, not confirmed)
 * Command-line flags override the file: --stack, --lang fa|en|both, --market iran|global (--iran = --market iran),
 * --rtl, --profile <file>. Language rules follow language, Iran rules follow market — never one from the other.
 */
import fs from 'node:fs';
import path from 'node:path';

export const PROFILE_FILE = '.web-ui-playbook.json';
export const TIER = {
  laravel: 1, next: 1, wordpress: 1, static: 1,
  'next-pages': 2, nuxt: 2, vue: 2, sveltekit: 2, svelte: 2, astro: 2, 'react-spa': 2,
  shopify: 3, builder: 3,
};
export const MARKETS = ['iran', 'global'];

/** Default source folders per stack (CSS with tokens, templates, build output). Adapters: references/stacks/<stack>.md */
export const STACK_PATHS = {
  laravel: { css: ['resources/css'], templates: ['resources/views'], output: 'public' },
  next: { css: ['app', 'src/app', 'styles', 'src/styles'], templates: ['app', 'src/app', 'components', 'src/components'], output: 'out' },
  'next-pages': { css: ['styles', 'src/styles'], templates: ['pages', 'src/pages', 'components', 'src/components'], output: 'out' },
  wordpress: { css: ['.', 'assets/css', 'assets', 'css'], templates: ['templates', 'parts', 'patterns', '.'], output: null },
  static: { css: ['css', 'src', 'styles', '.'], templates: ['.'], output: '.' },
  nuxt: { css: ['assets/css', 'assets', 'app/assets/css', 'app/assets'], templates: ['pages', 'components', 'layouts', 'app'], output: '.output/public' },
  vue: { css: ['src'], templates: ['src'], output: 'dist' },
  sveltekit: { css: ['src'], templates: ['src'], output: 'build' },
  svelte: { css: ['src'], templates: ['src'], output: 'dist' },
  astro: { css: ['src/styles', 'src'], templates: ['src'], output: 'dist' },
  'react-spa': { css: ['src'], templates: ['src'], output: 'dist' },
  shopify: { css: ['assets'], templates: ['layout', 'sections', 'snippets', 'templates'], output: null },
  builder: { css: [], templates: [], output: null },
};
const ROOT_MARKERS = ['.git', 'package.json', 'composer.json'];

/** Nearest .web-ui-playbook.json from `start` upward, stopping at the project root (.git / package.json / composer.json). */
export function findProfile(start = process.cwd()) {
  let dir = path.resolve(start);
  try { if (fs.statSync(dir).isFile()) dir = path.dirname(dir); } catch { return null; }
  for (;;) {
    const f = path.join(dir, PROFILE_FILE);
    if (fs.existsSync(f)) return f;
    if (ROOT_MARKERS.some((m) => fs.existsSync(path.join(dir, m)))) return null;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Read and check a profile file → { file, data, problems[] }. Unknown keys are kept; wrong values are reported. */
export function readProfile(file) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return { file, data: {}, problems: [`${PROFILE_FILE} is not valid JSON: ${e.message}`] }; }
  const problems = [];
  if (data.stack != null && !(data.stack in TIER)) problems.push(`unknown stack "${data.stack}" (known: ${Object.keys(TIER).join(', ')})`);
  if (data.market != null && !MARKETS.includes(data.market)) problems.push(`market must be "iran" or "global", not "${data.market}"`);
  if (data.languages != null && (!Array.isArray(data.languages) || data.languages.some((l) => !['fa', 'en'].includes(l)))) problems.push('languages must be a list of "fa" and/or "en"');
  if (data.dir != null && !['rtl', 'ltr'].includes(data.dir)) problems.push('dir must be "rtl" or "ltr"');
  return { file, data, problems };
}

export function loadProfile({ start, file } = {}) {
  const f = file || findProfile(start);
  return f && fs.existsSync(f) ? readProfile(f) : null;
}

const langList = (v) => (v === 'both' ? ['fa', 'en'] : v === 'fa' || v === 'en' ? [v] : null);

/**
 * Resolve the three switches from command-line args (array) and the profile (flags win).
 * → { stack, tier, languages|null, forceRtl, market|null, marketSource, marketAssumed, cssDirs|null, profile, problems[] }
 * market null = not set: no Iran rules (foreign hosts are warnings).
 */
export function resolveSettings(args = [], { start = process.cwd(), profile } = {}) {
  const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const prof = profile !== undefined ? profile : loadProfile({ start, file: val('--profile') });
  const p = prof?.data || {};
  const problems = [...(prof?.problems || [])];
  const stack = val('--stack') || p.stack || null;
  if (stack && !(stack in TIER)) problems.push(`unknown stack "${stack}"`);
  let market = null, marketSource = 'not set';
  if (val('--market')) { market = val('--market'); marketSource = '--market flag'; }
  else if (args.includes('--iran')) { market = 'iran'; marketSource = '--iran flag'; }
  else if (p.market) { market = p.market; marketSource = path.basename(prof.file); }
  if (market && !MARKETS.includes(market)) { problems.push(`market must be iran or global, not "${market}"`); market = null; }
  const languages = langList(val('--lang')) || (Array.isArray(p.languages) && p.languages.length ? p.languages : null);
  const dir = val('--lang') ? (languages?.length === 1 && languages[0] === 'fa' ? 'rtl' : null) : p.dir || null;
  const forceRtl = args.includes('--rtl') || (dir === 'rtl' && !(languages || []).includes('en'));
  const cssDirs = p.paths?.css?.length ? p.paths.css : stack && STACK_PATHS[stack] ? STACK_PATHS[stack].css : null;
  return {
    stack, tier: stack ? TIER[stack] ?? null : null, languages, forceRtl,
    market, marketSource, marketAssumed: marketSource === path.basename(prof?.file || '') && !!p.marketAssumed,
    cssDirs, profile: prof ? prof.file : null, problems,
  };
}

/** One plain line for reports. */
export function describeSettings(s) {
  const lang = s.languages ? s.languages.join('+') : 'detected per file';
  const market = s.market ? `${s.market}${s.marketAssumed ? ' (ASSUMED from a Persian request — confirm with the owner)' : ''} (${s.marketSource})` : 'not set (no Iran rules)';
  return `stack ${s.stack || 'not set'}${s.tier ? ` (Tier ${s.tier})` : ''} · language ${lang}${s.forceRtl ? ', RTL forced' : ''} · market ${market}${s.profile ? ` · from ${s.profile}` : ''}`;
}
