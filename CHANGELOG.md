# Changelog

## 1.1.0 — 2026-10-17

### New skills
- **brand-color-system** — palette generator and contrast checker. Keeps the exact brand color, builds OKLCH scales on Tailwind 4 lightness curves, picks the accent by industry (warm saffron-gold for education and kids, quiet tones for finance and government; never next to the error/success hues), writes light + dark tokens for web-ui-playbook in which every text/background pair passes WCAG 2.2, with a 5.5:1 house rule for small Persian text, a color-vision check and a warning when the color is close to a well-known Iranian brand (dated table, verify before relying).
- **brand-logo-studio** — logos and brand kits in code: three directions, outlined SVG masters (bilingual, Persian-only, icon, reversed, one-color), adaptive favicon.svg, favicon.ico, app/social/email PNGs, web manifest, Blade head snippet, brand sheet, and a letter-by-letter proof sheet of the Persian name. Persian shaping with vendored HarfBuzz (ZWNJ, mixed Persian/Latin/digits), optional comparison against the installed Chrome/Edge, validators (live text, clipping, contrast against the touching color, one-color print, small sizes, safe zones), 13 bundled OFL fonts with per-font license notes.

### web-ui-playbook
- **Taste layer** (`references/anti-generic.md`): subject inventory, idea sentence + competitor test, argument-first page outlines, the real-content rule (numbers, testimonials and logos only from the owner; visible placeholders), a design commitment written to the user's `docs/design-commitment.md`, plain-word dials, a dated registry of generic-page tells, a no-cliché rule and a redesign mode. Ideas adapted from taste-skill (MIT) are cited by file and line in `THIRD_PARTY_NOTICES.md`.
- **`audit.mjs --contrast`** — every text element against its background in light and dark, from the project's tokens in `@import` order; unresolved pairs listed and never counted as passed.
- **`audit.mjs --slop`** — generic copy, buttons and layout/motion tells as warnings (owner-reviewed Persian lists in `scripts/data/fa-slop.json`, project overrides in `.slop-allow.json`), link-purpose check (WCAG 2.4.4), and a list of every number, superlative and quote for the owner to confirm.
- **`audit.mjs --render`** — the built page in the installed Chrome/Edge (headless, local server, network blocked, exact viewport sizes): contrast after Alpine/JS ran, overflow and headline lines at 1440/768/375, fonts loaded, blocked requests. Skips cleanly without a browser.
- Review checklist §F: slop audit + seven by-eye passes ending with a "substance" pass.
- Motion baseline (html.js gate, reveal once, reduced motion keeps fades, no scroll hijacking); RTL motion and scrolling notes; Persian text ≥ 13px (`text-caption` token).
- **`audit.mjs --release`** — pre-launch gate: PLACEHOLDER markers, `[ … ]` placeholder text, fake sample data and example phone numbers outside input hints are errors (warnings without the flag).
- **No-JS view** in `--render`: the page with JavaScript off; reports text hidden or empty without JS (the html.js gate rule). `--render`'s own measurement adjustments (timer frames, reveal-as-scrolled, transitions off) show an end state and do not apply to this view.
- `scripts/selftest.mjs` for all fixtures.

### Bug fixes
- `assets/tokens.css`: red alert text on its pink background was **4.35:1** (needs 4.5:1) — `--danger` is now `oklch(0.505 0.213 27.518)`.
- `assets/tokens.css`: dark-mode input borders were **2.5:1** (needs 3:1 for UI parts) — `--border-strong` in dark mode is now `white / 0.38`.
- `audit.mjs`: CSS was read in folder order instead of `@import` order, so an earlier file could override the palette — it now follows the `@import` cascade (regression test in brand-color-system's selftest).
- `audit.mjs` no longer runs its CLI when imported as a module.

## 1.0.0 — 2026-10-14
- First release: web-ui-playbook skill (workflow, 8 style directions, components, page patterns, Persian/RTL and Iran rules, examples, templates, review checklist, `audit.mjs`).
