/**
 * brand-color-system — token-pairs.mjs
 * The foreground/background token pairs every palette must pass, shared by
 * generate-palette.mjs (when choosing tokens) and check-contrast.mjs (when auditing a project).
 * Token names match web-ui-playbook/assets/tokens.css (--bg, --surface, --text, --muted, --primary…),
 * plus three additive tokens: --primary-ink, --accent-fg, --brand.
 */

/**
 * kind: 'text'  = text that can be small (body, captions, badges, links, status messages)
 *       'label' = button labels — the component spec keeps them ≥ 14px semibold, so the WCAG 4.5:1 floor applies
 *                 even for Persian (the 5.5:1 house rule targets small Persian text)
 *       'ui'    = borders, focus rings, icons (WCAG 1.4.11, 3:1)
 */
export const PAIRS = [
  ['text', 'bg', 'text'], ['text', 'surface', 'text'], ['text', 'surface-subtle', 'text'],
  ['muted', 'bg', 'text'], ['muted', 'surface', 'text'], ['muted', 'surface-subtle', 'text'],
  ['primary-fg', 'primary', 'label'], ['primary-fg', 'primary-hover', 'label'],
  ['primary-ink', 'bg', 'text'], ['primary-ink', 'surface', 'text'], ['primary-ink', 'primary-subtle', 'text'],
  ['accent-fg', 'accent', 'text'],
  ['border-strong', 'surface', 'ui'], ['border-strong', 'bg', 'ui'],
  ['focus', 'bg', 'ui'], ['focus', 'surface', 'ui'],
  ...['success', 'warning', 'danger', 'info'].flatMap((s) => [[s, 'surface', 'text'], [s, `${s}-subtle`, 'text']]),
];

/** When a project has no --primary-ink, templates use text-primary for links: check that instead. */
export const FALLBACK = { 'primary-ink': 'primary' };

export const WCAG_TEXT = 4.5;
export const WCAG_UI = 3;
/** House rule (not a WCAG requirement): Persian text below ~14px is easier to read at ≥ 5.5:1 because dots are small. */
export const FA_HOUSE_TEXT = 5.5;

export const targetFor = (kind, fa) => (kind === 'text' ? (fa ? FA_HOUSE_TEXT : WCAG_TEXT) : kind === 'label' ? WCAG_TEXT : WCAG_UI);
export const wcagFloor = (kind) => (kind === 'text' || kind === 'label' ? WCAG_TEXT : WCAG_UI);
