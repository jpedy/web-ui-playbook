# Changelog

## Unreleased — branch v3-multistack (becomes 1.2.0)

### Changed — deliberate behavior change
- **`audit.mjs`: Iran rules now follow the market, not the language.** A Persian page audited without an Iran market gets `foreign-host` **warnings** (privacy/speed) instead of errors. Projects whose market is Iran — `"market": "iran"` in `.web-ui-playbook.json`, or `--iran` / `--market iran` — still get **errors**. Persian language rules (RTL, digits, ZWNJ, typography) are unchanged and still follow the text. Selftest: `selftest.mjs` §3c.

### Added
- **Project profile `.web-ui-playbook.json`** — three separate switches (stack · language/direction · market) read by `audit.mjs`, `generate-palette.mjs` and `export-kit.mjs`; command-line flags override it. `marketAssumed` records that Iran was assumed from a Persian request, and the audit report says so.
- **`scripts/detect-stack.mjs`** — detects Laravel, Next.js (App/Pages Router), WordPress (block/classic/WooCommerce), static HTML, Nuxt/Vue, SvelteKit/Svelte, Astro, React SPA, Shopify and site builders; asks one question when a folder holds several projects; `--init` writes the profile and refuses to guess the market.
- **`references/stacks/`** — adapter index (profile format, tiers, adapter template) and the Laravel adapter (Laravel 13, Livewire 4, Filament 5 — verified 2026-10-18: Laravel 13's self-hosted font helper, Livewire 4's `wire:model.live.blur`, Filament's remote default font).
- `audit.mjs --market iran|global`, `--lang`, `--stack`, `--profile`; the JSON result reports the settings used.
- `generate-palette.mjs --format` (token formats in `scripts/formats.mjs`; `tailwind4` = the previous output, byte-identical) and `--market global`; language and market default to the profile.
- brand-logo-studio: per-stack integration files (`lib/integrations.mjs`; Laravel's `head-snippet.blade.php` unchanged); the kit report shows Iran legal notes only for market Iran, a neutral trademark note otherwise, and says when the market was not set.

### Next.js (Tier 1)
- **`references/stacks/next.md`** — Next.js 16 App Router adapter, verified 2026-10-18 against the Next.js docs (and the docs shipped in `node_modules/next/dist/docs`), next-intl, shadcn/ui and react.dev: `next/font/local` required (why `next/font/google` fails for Iran builds), `proxy.ts` (renamed from `middleware.ts`), `[lang]` + `dir`, Cache Components rules, app icon file conventions, `metadataBase`, Server Functions + `useActionState`, html.js gate before hydration, Windows `&`-path and static-export pitfalls found in testing.
- **JSX/TSX reader** (`scripts/parsers/jsx.mjs`): class strings inside `cn()/clsx()/cva()/twMerge()` and `className={'…'}`; visible text only between JSX tags (TypeScript is not text); TypeScript generics are not components; `htmlFor` labels; layouts without `<h1>`.
- **`--render` for any stack:** a running **local** server (`--render http://localhost:3000/path`, reverse-proxied; other hosts refused), a build folder (`--render out --pages /,/about`) or a file. An unreachable target is an **error**, never "skipped". Unresolved texts carry fixed reason codes. Server-rendered pages (Next.js, Nuxt, SvelteKit, Astro) count their initial dynamic classes as applied.
- **`--format shadcn`** — shadcn/ui variable names in OKLCH (every pair maps onto a checked palette pair; warns when white text on `--destructive` is too faint).
- Logo kit **stack `next`**: `next-app/` with `favicon.ico`, `icon.svg`, `apple-icon.png`, `opengraph-image.png` (+alt), `manifest.json`, a `viewport` snippet and a README.
- Audit: the html.js gate is found in any audited file (layouts); the palette generator's preview page is not audited; `--pages` survives Git Bash's path rewriting.
- Tested: production builds of a Persian shop product page (market Iran) and an English SaaS landing (global, shadcn, static export) — results in the README support matrix.

### Static HTML/CSS/JS (Tier 1)
- **`references/stacks/static-html.md`** — no-framework adapter (plain CSS variables or the Tailwind CLI); it now holds the standalone recipe that was in `performance-and-tech.md` §5.
- **`--format css-variables`** — `palette.vars.css`: plain custom properties, dark mode from the system setting and from `.dark` / `data-theme`.
- Logo kit **stack `static`**: `head-snippet.html`. **Fixed:** an English-only brand name crashed the kit (lockups assumed a Persian name); kit wording for brands without a Persian name.
- Audit: **plain-CSS colors are never passed statically** — a text inside an element whose CSS rule sets `color`/`background` is "could not resolve (css-rule)" and is measured by `--render` (no change for Tailwind projects, including all earlier test pages). Static sites: `broken-link` (error) and `clean-url` (warning) for internal links.
- **`--render` tap targets** (all stacks): at phone width every control smaller than 24px (WCAG 2.5.8 floor) and the count between 24 and 44px (house rule) are warnings; links inside running text and visually hidden skip links are exempt.
- detect-stack: a static site's own sub-folders of pages are not separate projects.
- Tested: an English portfolio (two pages, plain CSS, market global); the tap-target check was then re-run on the Next.js projects (fixed there) and reports 7 sub-44px controls on the v2 Laravel school page.

### Internal
- Markup readers moved to `scripts/parsers/` unchanged (each audit rule exists once for every stack).
- `performance-and-tech.md` is stack-neutral now; Laravel setup, Blade components, Livewire/Filament/Inertia notes moved to `references/stacks/laravel.md` (updated to current versions).
- SKILL.md: step 0 "Profile", a visible "Assuming the audience is inside Iran — tell me if not." line, a shorter trigger-focused description (884 characters).
- Regression proof: every v1.1.0 fixture, the v2 school page and the earlier test pages give identical audit JSON (except the change above); palettes and the logo kit are byte-identical.

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
