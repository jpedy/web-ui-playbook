/**
 * brand-color-system — formats.mjs
 * One palette (the object buildPalette() returns) → token files for each stack. generate-palette.mjs --format picks
 * them; every format carries the same checked colors, so the contrast results in palette-report.md hold for all.
 *   tailwind4   palette.css — :root/.dark variables + @theme inline (Laravel, Next.js with Tailwind v4, static + Tailwind CLI)
 * Which format a stack uses: web-ui-playbook references/stacks/<stack>.md ("Where tokens live").
 */
import { cssOklch, fmtRatio } from './color-core.mjs';

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

/** name → { file, build(p) → text, install: plain-words first step for palette-report.md } */
export const FORMATS = {
  tailwind4: {
    file: 'palette.css',
    build: tailwind4,
    install: 'Copy `palette.css` next to `tokens.css` (web-ui-playbook) and add `@import "./palette.css";` right after the tokens import.',
  },
};
