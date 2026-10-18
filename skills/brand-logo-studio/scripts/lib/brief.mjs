/**
 * brand-logo-studio — brief.mjs
 * Reads a brief (JSON), derives logo colors from a brand-color-system palette.json (or explicit hexes)
 * with contrast checks, and holds the decision table (industry → recipes, fonts).
 * Brief format: references/brand-kit-spec.md §1. Decision table rationale: references/decision-table.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { contrast, toContrast } from './util.mjs';
import { RECIPES } from './marks.mjs';
import { normalizePersian } from './bidi.mjs';

/** industry → ranked symbol recipes, default fonts. Container recipes (R1/R4/R5) are added by the directions builder. */
export const DECISION = {
  education: { symbols: ['R3_book_bubble', 'R6_arrow', 'R2_rings'], container: 'R1_monogram', fa: 'vazirmatn-black', en: 'plus-jakarta-sans:800' },
  kids: { symbols: ['R3_book_bubble', 'R7_cube', 'R2_rings'], container: 'R1_monogram', fa: 'estedad:800', en: 'plus-jakarta-sans:800' },
  finance: { symbols: ['R2_rings', 'R6_arrow', 'R7_cube'], container: 'R4_shield', fa: 'vazirmatn-extrabold', en: 'inter:700' },
  government: { symbols: ['R2_rings', 'R6_arrow'], container: 'R4_shield', fa: 'vazirmatn-bold', en: 'inter:700' },
  health: { symbols: ['R2_rings', 'R6_arrow'], container: 'R4_shield', fa: 'sahel-bold', en: 'inter:700' },
  legal: { symbols: ['R2_rings', 'R6_arrow'], container: 'R4_shield', fa: 'parastoo-bold', en: 'lora:700' },
  saas: { symbols: ['R7_cube', 'R6_arrow', 'R2_rings'], container: 'R1_monogram', fa: 'vazirmatn-black', en: 'inter:800' },
  ecommerce: { symbols: ['R6_arrow', 'R7_cube', 'R2_rings'], container: 'R1_monogram', fa: 'estedad:800', en: 'plus-jakarta-sans:800' },
  food: { symbols: ['R2_rings', 'R6_arrow'], container: 'R1_monogram', fa: 'estedad:900', en: 'plus-jakarta-sans:800' },
  culture: { symbols: ['R8_shamsa', 'R2_rings'], container: 'R5_taaq_arch', fa: 'noto-naskh:700', en: 'lora:700' },
  luxury: { symbols: ['R8_shamsa', 'R2_rings'], container: 'R5_taaq_arch', fa: 'parastoo-bold', en: 'lora:600' },
  travel: { symbols: ['R6_arrow', 'R2_rings'], container: 'R5_taaq_arch', fa: 'estedad:800', en: 'plus-jakarta-sans:800' },
  default: { symbols: ['R6_arrow', 'R2_rings', 'R7_cube'], container: 'R1_monogram', fa: 'vazirmatn-black', en: 'inter:800' },
};

const req = (cond, msg) => { if (!cond) throw new Error(`brief: ${msg}`); };

/** The project's .web-ui-playbook.json (web-ui-playbook profile), searched from the brief's folder, then the working folder. */
async function projectProfile(dir) {
  try {
    const { loadProfile } = await import('../../../web-ui-playbook/scripts/profile.mjs');
    return loadProfile({ start: dir }) || loadProfile({ start: process.cwd() });
  } catch { return null; } // web-ui-playbook not installed next to this skill
}
const PROFILE_CACHE = new Map();
/** Call (await) before loadBrief so the brief can fall back to the project's market and stack. */
export async function preloadProfile(file) {
  const dir = path.dirname(path.resolve(file));
  if (!PROFILE_CACHE.has(dir)) PROFILE_CACHE.set(dir, await projectProfile(dir));
  return PROFILE_CACHE.get(dir);
}

/** Load and normalize a brief JSON file. Paths inside the brief resolve relative to the brief. */
export function loadBrief(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dir = path.dirname(path.resolve(file));
  req(raw.name && (raw.name.fa || raw.name.en), 'name.fa and/or name.en is required');
  const fa = raw.name.fa ? normalizePersian(raw.name.fa) : null;
  const industry = raw.industry && DECISION[raw.industry] ? raw.industry : 'default';
  const d = DECISION[industry];
  const brief = {
    name: { fa: fa?.text || null, en: raw.name.en || null },
    tagline: raw.tagline || {},
    industry,
    monogram: raw.monogram || (fa ? [...fa.text][0] : raw.name.en[0]),
    fonts: { fa: raw.fonts?.fa || d.fa, en: raw.fonts?.en || d.en, letter: raw.fonts?.letter || 'vazirmatn-black' },
    tracking: raw.tracking ?? 0,
    notes: fa?.changes || [],
  };
  // market and stack: the brief, else the project profile (preloadProfile), else the original defaults (iran, laravel)
  const prof = PROFILE_CACHE.get(dir)?.data || {};
  brief.market = raw.market || prof.market || 'iran';
  brief.marketSource = raw.market ? 'brief' : prof.market ? 'profile' : 'default';
  brief.stack = raw.stack || prof.stack || 'laravel';
  brief.colors = logoColors(raw, dir);
  return brief;
}

/**
 * Logo color roles. From palette.json (brand-color-system) when given, else from explicit colors.
 * Ensures: icon colors ≥ 3:1 (WCAG non-text) on the light background, reversed colors ≥ 3:1 on the dark one,
 * wordmark ink ≥ 4.5:1 on both. Records every substitution in colors.notes.
 */
export function logoColors(raw, dir = '.') {
  let pal = null;
  if (raw.palette) {
    const p = path.resolve(dir, raw.palette);
    req(fs.existsSync(p), `palette file not found: ${p}`);
    pal = JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  const notes = [];
  const scale = pal?.scales?.brand || {};
  const lightBg = raw.colors?.lightBg || '#ffffff';
  const darkBg = raw.colors?.darkBg || pal?.tokens?.dark?.bg || '#0b1220';
  const c = {
    primary: raw.colors?.primary || pal?.brand?.hex,
    ink: raw.colors?.ink || scale[900] || '#111827',
    accent: raw.colors?.accent || pal?.tokens?.light?.accent || raw.colors?.primary || pal?.brand?.hex,
    onDark: raw.colors?.onDark || scale[50] || '#f8fafc',
    accentOnDark: raw.colors?.accentOnDark || null, // filled below: the accent itself when it reads on dark, so the identity color stays the same
    onDarkMuted: raw.colors?.onDarkMuted || scale[200] || '#cbd5e1',
    lightBg, darkBg,
  };
  if (!c.accentOnDark) c.accentOnDark = c.accent && contrast(c.accent, darkBg) >= 3 ? c.accent : scale[300] || '#99f6e4';
  req(c.primary, 'give "palette": "<path to palette.json>" (brand-color-system) or "colors": { "primary": "#hex" }');
  if (contrast(c.primary, lightBg) < 3) {
    const darker = [600, 700, 800].map((s) => scale[s]).find((h) => h && contrast(h, lightBg) >= 3);
    notes.push(`The brand color ${c.primary} is only ${contrast(c.primary, lightBg).toFixed(2)}:1 on white — too faint for a logo shape. ${darker ? `The light-background logo uses the darker brand shade ${darker}; the exact color stays in the palette.` : 'Give a darker primary.'}`);
    if (darker) c.primary = darker;
  }
  if (contrast(c.ink, lightBg) < 4.5) { notes.push(`Wordmark ink ${c.ink} is below 4.5:1 on white; using #111827.`); c.ink = '#111827'; }
  if (contrast(c.onDark, darkBg) < 4.5) { notes.push(`Reversed wordmark ${c.onDark} is below 4.5:1 on ${darkBg}; using #ffffff.`); c.onDark = '#ffffff'; }
  for (const k of ['accentOnDark', 'onDarkMuted']) if (contrast(c[k], darkBg) < 3) { notes.push(`${k} ${c[k]} is below 3:1 on ${darkBg}; using ${c.onDark}.`); c[k] = c.onDark; }
  // The accent in context: each role reaches 3:1 against what it actually sits on (same hue; palette stop first).
  const accScale = pal?.scales?.accent || null;
  const role = (key, against, where) => {
    if (raw.colors?.[key]) return raw.colors[key];
    const r = toContrast(c.accent, against, 3, accScale);
    if (r.from !== 'as-is') notes.push(`The accent ${c.accent} is ${contrast(c.accent, against).toFixed(2)}:1 ${where}, so the logo uses ${r.hex} there (${r.ratio.toFixed(2)}:1, ${r.from === 'lightness' ? 'same hue, adjusted lightness' : `palette accent-${r.from.split(' ')[1]}`})${r.ok ? '' : ' — the closest possible; 3:1 cannot be reached at this hue'}. The exact accent stays in the palette.`);
    return r.hex;
  };
  c.accentOnLight = role('accentOnLight', lightBg, `on the light background ${lightBg}`);
  c.accentOnPrimary = role('accentOnPrimary', c.primary, `inside the brand color ${c.primary}`);
  c.accentOnPale = role('accentOnPale', c.onDark, `inside light shapes (${c.onDark}) on dark`);
  c.notes = notes;
  c.brandExact = pal?.brand?.hex || raw.colors?.primary;
  return c;
}

export const recipeName = (id) => RECIPES[id]?.name || id;
