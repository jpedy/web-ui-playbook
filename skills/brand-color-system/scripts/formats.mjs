/**
 * brand-color-system — formats.mjs
 * One palette (the object buildPalette() returns) → token files for each stack. generate-palette.mjs --format picks
 * them; every format carries the same checked colors, so the contrast results in palette-report.md hold for all.
 *   tailwind4   palette.css — :root/.dark variables + @theme inline (Laravel, Next.js with Tailwind v4, static + Tailwind CLI)
 *   css-variables  palette.vars.css — plain CSS custom properties, OS dark mode + .dark/[data-theme] (static HTML, WordPress classic, any CSS)
 *   shadcn      palette.shadcn.css — shadcn/ui variable names (Next.js + shadcn, Inertia + React + shadcn)
 *   wordpress   theme.palette.json (theme.json v3 palette + styles), styles/dark.json (style variation), palette.wp-dark.css
 * Which format a stack uses: web-ui-playbook references/stacks/<stack>.md ("Where tokens live").
 */
import { cssOklch, fmtRatio, contrast, parseColor } from './color-core.mjs';

export const ORDER = ['bg', 'surface', 'surface-subtle', 'border', 'border-strong', 'text', 'muted',
  'primary', 'primary-hover', 'primary-fg', 'primary-subtle', 'primary-ink', 'brand', 'accent', 'accent-fg',
  'success', 'success-subtle', 'warning', 'warning-subtle', 'danger', 'danger-subtle', 'info', 'info-subtle', 'focus'];
export const ROLE = {
  bg: 'page background', surface: 'cards, inputs', 'surface-subtle': 'hover rows, wells', border: '1px dividers (decorative)',
  'border-strong': 'input/checkbox borders (≥ 3:1)', text: 'body text and headings', muted: 'secondary text',
  primary: 'main button fill', 'primary-hover': 'main button hover', 'primary-fg': 'text on primary buttons',
  'primary-subtle': 'selected/active background', 'primary-ink': 'brand-colored text and links', brand: 'exact brand color: logo, illustrations, large headings',
  accent: 'highlights, badges (≤ 10% of the screen)', 'accent-fg': 'text on accent', focus: 'focus ring',
  success: 'success text/icons', 'success-subtle': 'success background', warning: 'warning text/icons', 'warning-subtle': 'warning background',
  danger: 'error text/icons', 'danger-subtle': 'error background', info: 'info text/icons', 'info-subtle': 'info background',
};

/** Worst required contrast of a token in a mode, as a comment suffix. */
export const worst = (p, mode, tok) => {
  const rows = p.matrix.filter((m) => m.mode === mode && m.fg === tok && m.kind !== 'decor');
  if (!rows.length) return '';
  const w = rows.reduce((a, b) => (a.ratio < b.ratio ? a : b));
  return ` · ${fmtRatio(w.ratio)}:1 on ${w.bg}`;
};

/** :root { … } and .dark { … } with every semantic token. */
export function variableBlocks(p) {
  const decl = (name, hex, mode) => `  --${name}: ${cssOklch(hex)}; /* ${hex} ${ROLE[name] || ''}${worst(p, mode, name)} */`;
  return `:root {
${ORDER.map((t) => decl(t, p.tokens.light[t], 'light')).join('\n')}
}

.dark {
${ORDER.map((t) => decl(t, p.tokens.dark[t], 'dark')).join('\n')}
  color-scheme: dark;
}
`;
}

function tailwind4(p) {
  const scaleDecl = (prefix, scale) => scale.map((s) => `  --color-${prefix}-${s.stop}: ${cssOklch(s.hex)}; /* ${s.hex}${s.anchored ? ' ← exact' : ''} */`).join('\n');
  return `/* ==========================================================================
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

${variableBlocks(p)}
@theme inline {
${ORDER.map((t) => `  --color-${t}: var(--${t});`).join('\n')}
}

/* Full scales for rare cases (charts, illustrations). Prefer the semantic tokens above in templates. */
@theme {
${scaleDecl('brand', p.scales.brand)}
${p.scales.accent !== p.scales.brand ? scaleDecl('accent', p.scales.accent) + '\n' : ''}${scaleDecl('base', p.scales.base)}
}
`;
}

// shadcn/ui variable names (ui.shadcn.com/docs/theming ⏱ 2026-10-18: OKLCH values, :root + .dark, @theme inline,
// --radius 0.625rem with sm…4xl multipliers; no --destructive-foreground). Every pair maps onto a pair the palette
// already checked: name → [our token, the checked pair it relies on].
const SHADCN = [
  ['background', 'bg'], ['foreground', 'text', 'text on bg'],
  ['card', 'surface'], ['card-foreground', 'text', 'text on surface'],
  ['popover', 'surface'], ['popover-foreground', 'text', 'text on surface'],
  ['primary', 'primary'], ['primary-foreground', 'primary-fg', 'primary-fg on primary'],
  ['secondary', 'surface-subtle'], ['secondary-foreground', 'text', 'text on surface-subtle'],
  ['muted', 'surface-subtle'], ['muted-foreground', 'muted', 'muted on surface-subtle'],
  ['accent', 'surface-subtle'], ['accent-foreground', 'text', 'text on surface-subtle'],
  ['destructive', 'danger', 'danger on surface'],
  ['border', 'border'], ['input', 'border-strong', 'border-strong on surface (3:1)'], ['ring', 'focus', 'focus on bg (3:1)'],
  ['sidebar', 'surface'], ['sidebar-foreground', 'text', 'text on surface'], ['sidebar-primary', 'primary'], ['sidebar-primary-foreground', 'primary-fg', 'primary-fg on primary'],
  ['sidebar-accent', 'surface-subtle'], ['sidebar-accent-foreground', 'text', 'text on surface-subtle'], ['sidebar-border', 'border'], ['sidebar-ring', 'focus'],
  // not in shadcn: the plugin's status, link and brand colors (use text-success, text-primary-ink, bg-brand…)
  ['success', 'success'], ['warning', 'warning'], ['info', 'info'], ['primary-ink', 'primary-ink'], ['brand', 'brand'],
];
const RADIUS = [['sm', 0.6], ['md', 0.8], ['lg', 1], ['xl', 1.4], ['2xl', 1.8], ['3xl', 2.2], ['4xl', 2.6]];

/** Extra checks the shadcn names need beyond the palette matrix → [{ mode, pair, ratio, need }] below target. */
export function shadcnChecks(p) {
  const out = [];
  for (const mode of ['light', 'dark']) {
    const t = p.tokens[mode];
    const r = contrast(parseColor('#ffffff'), parseColor(t.danger));
    if (r < 4.5) out.push({ mode, pair: 'white text on --destructive (a filled destructive button)', ratio: r, need: 4.5 });
  }
  return out;
}

function shadcn(p) {
  const chart = [p.scales.brand[6], p.scales.accent[5], p.scales.brand[3], p.scales.accent[7], p.scales.base[5]].map((s) => s.hex);
  const block = (mode) => SHADCN.map(([name, tok, pair]) => `  --${name}: ${cssOklch(p.tokens[mode][tok])}; /* ${p.tokens[mode][tok]} = --${tok}${pair ? ` · checked: ${pair}` : ''} */`)
    .concat(chart.map((h, i) => `  --chart-${i + 1}: ${cssOklch(h)}; /* ${h} — label every series; never color alone */`)).join('\n');
  const warn = shadcnChecks(p);
  return `/* ==========================================================================
   Brand palette — ${p.meta.name} — shadcn/ui variables (OKLCH)
   Generated ${p.meta.generated} by brand-color-system/scripts/generate-palette.mjs --format shadcn
   Brand color ${p.brand.hex} kept exactly as --brand. Every foreground/background pair shadcn uses maps onto a pair
   checked in palette-report.md (WCAG 2.2 AA${p.meta.fa ? '; Persian small text ≥ 5.5:1 house rule' : ''}).
${warn.length ? warn.map((w) => `   ⚠ ${w.mode}: ${w.pair} = ${fmtRatio(w.ratio)}:1 (needs ${w.need}:1) — use dark text on it or the outline variant.`).join('\n') + '\n' : ''}
   Use: replace the color variables in your global CSS (e.g. app/globals.css) with this file's :root/.dark/@theme
   blocks, or @import it after @import "tailwindcss". --radius is shadcn's default — set it from the design commitment.
   ========================================================================== */

:root {
  --radius: 0.625rem;
${block('light')}
}

.dark {
${block('dark')}
  color-scheme: dark;
}

@theme inline {
${[...SHADCN.map(([n]) => n), ...chart.map((_, i) => `chart-${i + 1}`)].map((n) => `  --color-${n}: var(--${n});`).join('\n')}
${RADIUS.map(([k, m]) => `  --radius-${k}: ${m === 1 ? 'var(--radius)' : `calc(var(--radius) * ${m})`};`).join('\n')}
}
`;
}

/** Plain CSS custom properties (no Tailwind): light in :root, dark under .dark / [data-theme=dark] and the OS setting. */
function cssVariables(p) {
  const decl = (name, hex, mode) => `  --${name}: ${cssOklch(hex)}; /* ${hex} ${ROLE[name] || ''}${worst(p, mode, name)} */`;
  const scale = (prefix, s) => s.map((x) => `  --${prefix}-${x.stop}: ${cssOklch(x.hex)}; /* ${x.hex}${x.anchored ? ' ← exact' : ''} */`).join('\n');
  const dark = ORDER.map((t) => '  ' + decl(t, p.tokens.dark[t], 'dark')).join('\n');
  return `/* ==========================================================================
   Brand palette — ${p.meta.name} — plain CSS variables (no Tailwind needed)
   Generated ${p.meta.generated} by brand-color-system/scripts/generate-palette.mjs --format css-variables
   Brand color ${p.brand.hex} kept exactly as --brand. Every text/background pair was checked
   (WCAG 2.2 AA${p.meta.fa ? '; Persian small text ≥ 5.5:1 house rule' : ''}) — see palette-report.md.
   Use: <link rel="stylesheet" href="css/palette.vars.css"> before your own CSS, then write
   color: var(--text); background: var(--surface); a { color: var(--primary-ink) } …
   Dark mode follows the visitor's system setting; class="dark" or data-theme="dark" on <html> forces it,
   data-theme="light" forces light.
   ========================================================================== */

:root {
${ORDER.map((t) => decl(t, p.tokens.light[t], 'light')).join('\n')}
  color-scheme: light;
}

/* Full scales for charts and illustrations — prefer the semantic variables above */
:root {
${scale('brand', p.scales.brand)}
${p.scales.accent !== p.scales.brand ? scale('accent', p.scales.accent) + '\n' : ''}${scale('base', p.scales.base)}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${dark}
    color-scheme: dark;
  }
}

.dark, [data-theme="dark"] {
${ORDER.map((t) => decl(t, p.tokens.dark[t], 'dark')).join('\n')}
  color-scheme: dark;
}
`;
}

// WordPress (⏱ developer.wordpress.org + the Gutenberg theme.json schema, checked 2026-10-18): theme.json version 3,
// settings.color.palette [{slug, name, color}] → CSS variables --wp--preset--color--{slug} and has-{slug}-color classes,
// styles reference presets as "var:preset|color|{slug}", styles.elements has button/link/heading with :hover/:focus-visible,
// style variations live in styles/*.json; theme.json has no automatic light/dark switch.
const WP_SLUGS = ORDER;
const titleCase = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const WP_NAMES = { bg: 'Background', surface: 'Surface', 'surface-subtle': 'Surface (subtle)', 'border-strong': 'Border (inputs)', text: 'Text', muted: 'Text (muted)', 'primary-fg': 'Text on primary', 'primary-ink': 'Brand text (links)', 'accent-fg': 'Text on accent', focus: 'Focus ring' };
// slug "text" would collide with WordPress's own has-text-color marker class, so text is "contrast" (WordPress's usual name)
export const wpSlug = (t) => (t === 'text' ? 'contrast' : t);
const wpPalette = (tokens) => WP_SLUGS.map((t) => ({ slug: wpSlug(t), name: WP_NAMES[t] || titleCase(t), color: tokens[t] }));
const wpPreset = (t) => `var:preset|color|${wpSlug(t)}`;
function wpThemeJson(p) {
  return JSON.stringify({
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: { color: { defaultPalette: false, defaultGradients: false, palette: wpPalette(p.tokens.light) } },
    styles: {
      color: { background: wpPreset('bg'), text: wpPreset('text') },
      elements: {
        link: { color: { text: wpPreset('primary-ink') }, ':hover': { color: { text: wpPreset('text') } } },
        button: { color: { background: wpPreset('primary'), text: wpPreset('primary-fg') }, ':hover': { color: { background: wpPreset('primary-hover') } }, ':focus-visible': { outline: { color: wpPreset('focus'), style: 'solid', width: '2px', offset: '2px' } } },
        heading: { color: { text: wpPreset('text') } },
      },
    },
  }, null, 2);
}
const wpDarkVariation = (p) => JSON.stringify({ $schema: 'https://schemas.wp.org/trunk/theme.json', version: 3, title: 'Dark', settings: { color: { palette: wpPalette(p.tokens.dark) } } }, null, 2);
const wpDarkCss = (p) => `/* ${p.meta.name} — dark colors that follow the visitor's system setting (theme.json cannot switch by itself).
   Enqueue after the global styles: wp_enqueue_style('palette-dark', get_theme_file_uri('palette.wp-dark.css'), ['global-styles']).
   html:root wins over WordPress's own :root preset variables. Generated by brand-color-system (${p.meta.generated}). */
@media (prefers-color-scheme: dark) {
  html:root {
${WP_SLUGS.map((t) => `    --wp--preset--color--${wpSlug(t)}: ${p.tokens.dark[t]}; /* ${ROLE[t] || ''} */`).join('\n')}
    color-scheme: dark;
  }
}
`;

/** name → { file, build(p) → text, extra?(p) → [[name, text]], install: plain-words first step for palette-report.md } */
export const FORMATS = {
  tailwind4: {
    file: 'palette.css',
    build: tailwind4,
    install: 'Copy `palette.css` next to `tokens.css` (web-ui-playbook) and add `@import "./palette.css";` right after the tokens import.',
  },
  wordpress: {
    file: 'theme.palette.json',
    build: wpThemeJson,
    extra: (p) => [['styles/dark.json', wpDarkVariation(p)], ['palette.wp-dark.css', wpDarkCss(p)]],
    install: 'WordPress block theme: merge `settings.color` and `styles` from `theme.palette.json` into your theme.json (version 3), copy `styles/dark.json` into the theme (a Dark style variation users can pick) and, for dark mode that follows the visitor\x27s system setting, enqueue `palette.wp-dark.css` after the global styles. Blocks then use classes such as has-primary-background-color (text color: has-contrast-color).',
  },
  'css-variables': {
    file: 'palette.vars.css',
    build: cssVariables,
    install: 'Plain HTML/CSS (no Tailwind): link `palette.vars.css` before your own stylesheet and use the variables (`color: var(--text)`, `background: var(--primary)`, links `var(--primary-ink)`).',
  },
  shadcn: {
    file: 'palette.shadcn.css',
    build: shadcn,
    install: 'shadcn/ui project: replace the color variables in your global CSS (Next.js: `app/globals.css`) with the `:root`, `.dark` and `@theme inline` blocks of `palette.shadcn.css` (keep `@import "tailwindcss";` first).',
  },
};
