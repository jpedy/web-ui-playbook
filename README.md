# web-ui-playbook

A self-contained [Claude Code](https://claude.com/claude-code) plugin that lets Claude design and build professional web interfaces — and the brand behind them — for people with no design background. One stack-agnostic design core (direction, tokens, components, patterns, accessibility, copy) with thin adapters for **Laravel, Next.js, WordPress and plain HTML/CSS/JS** (guidance for Vue/Nuxt, Svelte/SvelteKit, Astro and React SPAs), and first-class support for **Persian (Farsi) / RTL** sites and for users **inside Iran**.

Three skills that work together (and replace any other design skill):

| Skill | What it does |
|---|---|
| **web-ui-playbook** | Pages, landing pages, dashboards, forms and components: intake questions, one of 8 style directions, a written design commitment, tokens first, tested component specs and page patterns, Persian/RTL and Iran rules, then an audit of its own output. |
| **brand-color-system** | Brand palettes: keeps your exact brand color, builds Tailwind-style scales in OKLCH, picks an accent by industry, and writes light + dark tokens in which every text/background pair passes WCAG 2.2 (plus a 5.5:1 house rule for small Persian text). |
| **brand-logo-studio** | Logos and brand kits in code: three directions, then outlined SVG masters (Persian + Latin, Persian-only, icon, reversed, one-color), favicons, app/social/email images, a brand sheet and a letter-by-letter proof sheet of the Persian name. |

What web-ui-playbook does, every time:
1. Detects your stack, asks up to 6 short questions (audience, goal, feel, language, devices, inside Iran?) and saves the answers that change the rules in `.web-ui-playbook.json` (see [Project profile](#project-profile)). It asks you for **real content** — numbers, testimonials and logos come only from you.
2. Picks a style direction, names 1–2 real reference sites, and writes `docs/design-commitment.md` **in your project** (type, color roles, layout rhythm, one signature detail, motion budget) so later sessions stay consistent.
3. Defines tokens (via brand-color-system) before markup, then builds.
4. Applies the language and market layers separately: Persian/RTL rules (Vazirmatn, Persian digits, ZWNJ, bidi) when the site is Persian; Iran rules (Jalali, Toman, SMS-OTP, Shaparak, eNamad, no foreign CDNs) when the users are inside Iran. A Persian request is assumed to be for Iran — Claude says so in one line and records it, so you can correct it.
5. Audits its own output (`scripts/audit.mjs`), fixes what it finds, and reports what it fixed, the placeholders you must fill, and **every number and quote on the page for you to confirm**. Passing the audit does not prove a page is good — the report also includes a by-eye "substance" review.

## Supported stacks

| Stack | Design rules | Tokens export (`--format`) | Logo integration | Audit: source checks | Audit: `--render` | Tested | Date |
|---|---|---|---|---|---|---|---|
| **Laravel** (Blade, Livewire, Inertia, Filament) | ✓ | `tailwind4` (default) | `head-snippet.blade.php` | ✓ `.blade.php` | ✓ on the running app (local URL) or its saved HTML | **partly** — Persian school page (Blade + Alpine): source audit; its frontend built with the 13.x skeleton's Vite setup (Vite 8.3.5) and render-audited, 0 · 0. **Not run on PHP/Laravel** (no PHP on the test machine) — manual test: [`docs/test-on-laravel.md`](docs/test-on-laravel.md) | 2026-10-22 |
| **Next.js 16** App Router (shadcn/ui, next-intl) | ✓ | `tailwind4`, `shadcn` | `next-app/` (file conventions, manifest, viewport) | ✓ `.tsx/.jsx` | ✓ on `next start` (local URL) or the static export | **yes** — Persian shop (Iran, production server) and English SaaS (global, static export): 0 errors · 0 warnings | 2026-10-18 |
| **Static HTML/CSS/JS** | ✓ | `css-variables`, `tailwind4` | `head-snippet.html` | ✓ `.html`, broken links, clean URLs | ✓ on the folder (`--pages`) | **yes** — English two-page portfolio (global): 0 · 0 | 2026-10-18 |
| **WordPress 7.1** (block + classic themes, WooCommerce basics) | ✓ | `wordpress` (theme.json v3 + dark) | `wordpress/` (site icon 512, functions snippet) | ✓ templates, `.php` (`stack: wordpress` only), theme.json colors | ✓ on the running site (local URL) | **runtime-tested in WordPress Playground (PHP in WebAssembly, SQLite) — not on real hosting.** Persian block theme, and Persian classic theme + WooCommerce cart (Iran): 0 · 0 | 2026-10-18/19 |
| Vue/Nuxt, Svelte/SvelteKit, Astro, React + Vite SPA, Next.js Pages Router | ✓ | any (`tailwind4`, `css-variables`, `scss`, `dtcg`) | `head-snippet.html` (in the framework's document head) | best-effort (`.vue`, `.svelte`, `.astro`, `.jsx`) | ✓ on the build output | **no — guided, not tested** | — |
| Shopify, Wix, Webflow, Elementor-only, Squarespace, Framer | ✓ | values to paste (`css-variables`, `dtcg`) | image files | — (detect and warn) | on a page saved locally | **no — detect and warn** | — |

- "Tested" means a real project was built only from the skill, audited, fixed and checked by eye at 375 and 1440 px. A stack is never called supported without that.
- React + Vite SPAs render in the browser: search engines and visitors on slow networks see an empty page until the JavaScript arrives — prefer a server-rendered or static stack for public pages (`references/stacks/tier2-frameworks.md`).
- The adapters (`skills/web-ui-playbook/references/stacks/`) carry the framework versions and the date each fact was checked against the official docs; re-check them when a framework's major version moves on.

## Project profile

`.web-ui-playbook.json` in your project holds three separate switches; every script reads it and command-line flags override it.

```json
{ "stack": "next", "languages": ["fa"], "dir": "rtl", "market": "iran", "marketAssumed": true }
```

- **stack** picks the adapter, the token format, the logo files and the CSS folders the audit reads.
- **languages / dir** switch the Persian/RTL rules on or off.
- **market** switches the Iran rules on or off: foreign hosts are **errors** only for market `iran` (warnings about privacy and speed otherwise), and the Iranian brand-color check and Iran legal notes run only there. A Persian site for the diaspora is `languages: ["fa"]`, `market: "global"`.
- Create it with `node <plugin>/skills/web-ui-playbook/scripts/detect-stack.mjs . --init --market iran|global [--lang fa|en|both]` — it refuses to guess the market. `marketAssumed: true` records that Iran was assumed from a Persian request.

## Install

Requires [Claude Code](https://claude.com/claude-code) and Node.js 18+ for the scripts (developed and tested on Node 24). No `npm install`: the scripts have zero npm dependencies (brand-logo-studio vendors HarfBuzz and resvg as WebAssembly, and bundles 13 open-license fonts).

**Option A — as a plugin (recommended, easy updates).** Inside Claude Code:

```
/plugin marketplace add jpedy/web-ui-playbook
/plugin install web-ui-playbook@web-ui-playbook
```

Update later with `/plugin marketplace update web-ui-playbook`.

**Option B — as plain personal skills.** Copy the three skill folders into your skills directory:

```bash
git clone https://github.com/jpedy/web-ui-playbook.git
cp -r web-ui-playbook/skills/* ~/.claude/skills/
```

On Windows, `~` is `C:\Users\<you>`. Use only one option, so the skills aren't loaded twice.

## Use

Just ask Claude Code — the right skill activates on its own (or start with `/web-ui-playbook`, `/brand-color-system`, `/brand-logo-studio`).

- "Build a Persian landing page for my English language school; users are in Iran."
- "My brand color is #0d9488 — make a palette for light and dark mode."
- "Make a logo and favicon for «زبان‌سرا / Zabansara»."
- "Review `resources/views/welcome.blade.php` and fix the design."

Run the tools yourself (from your project folder; `<plugin>` is where the repo or plugin lives):

```bash
node <plugin>/skills/web-ui-playbook/scripts/audit.mjs resources/views --iran --contrast --css resources/css --slop
node <plugin>/skills/web-ui-playbook/scripts/audit.mjs resources/views --render public/index.html
node <plugin>/skills/web-ui-playbook/scripts/audit.mjs app --contrast --render http://localhost:3000 --pages /,/fa/product/mug
node <plugin>/skills/brand-color-system/scripts/generate-palette.mjs --brand "#2563eb" --format shadcn --out app
node <plugin>/skills/brand-color-system/scripts/generate-palette.mjs --brand "#0d9488" --industry education --lang fa --market iran --out resources/css/brand
node <plugin>/skills/brand-logo-studio/scripts/export-kit.mjs --brief brand/brief.json --direction C --out public/brand
```

All output goes into your project (`--out`); the scripts refuse to write into the plugin folder.

### Audit modes
- **default** — RTL/logical properties, Persian text hygiene, foreign hosts (errors when the project's market is Iran — `.web-ui-playbook.json`, `--market iran` or `--iran`; warnings otherwise), accessibility basics, placeholders; for static sites also broken internal links (error) and links that only work with clean-URL hosting (warning). The output starts with the settings in force and says when the market was assumed.
- **`--contrast`** — every text element against its background in light and dark, from your tokens. Reads Tailwind tokens, plain CSS variables, shadcn tokens and WordPress `theme.json` presets. Pairs it cannot determine are listed as "could not resolve" with a reason (`dynamic-class`, `component`, `css-rule` — colored by a plain-CSS rule, `gradient-or-image-bg`, `unknown-color`) and **never counted as passed**; `--render` then measures them.
- **`--slop`** — generic-page tells as warnings (stock phrases and generic buttons from `scripts/data/fa-slop.json`, layout and motion habits), and the list of claims for you to confirm. Allow a phrase or rule in your project with `.slop-allow.json`.
- **`--render <target>`** — opens built pages in your installed Chrome/Edge (headless, network blocked) and measures what the browser really shows after JS ran: contrast in light and dark, overflow and headline lines at 1440 / 768 / 375 px (each page framed at the exact width), fonts that loaded, requests that tried to leave the machine. The target is a file (`public/index.html`), a folder of built pages (`out`, `dist`, with `--pages /,about`), or a **local** URL of your running dev or production server (`http://localhost:3000` — Laravel, Next.js, WordPress; proxied so nothing leaves the machine, non-local hosts are refused). Also reported:
  - `render-target` — tap targets under 44 px at phone width (warnings; the message names each control and says when it is under the WCAG 2.2 minimum of 24 px — the audit cannot measure the spacing exception, so it never fails the page on its own); links inside running text are exempt.
  - `render-foreign-ref` — references to foreign hosts in the delivered HTML that Chrome never fetched (e.g. an emoji fallback script URL); errors for market Iran.
  - Whether the page was server-rendered, and the measured result for every text the static `--contrast` could not resolve.
  - **Measurement adjustments show an end state.** Headless Chrome renders no frames, so before measuring `--render` routes `requestAnimationFrame` through timers, reports every element as scrolled into view and switches transitions/animations off. Results describe the page *after* every reveal — not what a visitor sees mid-animation.
  - **No-JS view (separate).** The same run also opens the page with JavaScript **off** (sandboxed frame, none of the adjustments above apart from transitions off) and reports text that is visible with JS but hidden without it (`nojs-hidden` — an ungated hide-before-reveal) and content that only JavaScript fills in (`nojs-empty` — empty `x-text`, `<template x-for>`).
- **`--release`** — the pre-launch gate: every PLACEHOLDER marker, visible placeholder text (`[ … ]`), fake sample data (lorem, «شرکت نمونه», example.com, placeholder images, seals without a verification link) and example phone number outside an input hint is an **error**, listed by file and line; no-JS findings become errors too. Without `--release`, fake data and example phones are warnings and placeholders are listed.

### Self-tests
```bash
node skills/web-ui-playbook/scripts/selftest.mjs      # profile, stack detection, audit fixtures per stack, --slop, --release, --render, no-JS view (117 checks; 99 without a browser)
node skills/brand-color-system/scripts/selftest.mjs   # color math, palettes, contrast, 6 token formats (3865 checks)
node skills/brand-logo-studio/scripts/selftest.mjs    # shaping, bidi, validators, kit export per stack (165 checks; 157 without a browser)
```

## What the audit cannot tell you

The audit finds **known mistakes** — low contrast, foreign hosts, missing `lang`/`dir`, small tap targets, placeholders, generic-page tells. A clean result means none of those were found, nothing more:
- **It does not judge whether a page looks good, reads well or is trustworthy.** Layout rhythm, hierarchy, copy, whether the offer is clear and whether a visitor would believe it need a person looking at the page; the skill's report includes a by-eye "substance" review for that, and lists every number and quote for you to confirm.
- **It cannot check truth.** Prices, claims, testimonials, licenses and legal seals are listed for you to confirm, never verified.
- **Static checks see only the source.** Classes built in code, components from other files and colors set by plain CSS are reported as "could not resolve" — `--render` measures them in a real browser, but only in the state shown after load (first tab, closed menus).
- **WordPress results come from WordPress Playground** (PHP in WebAssembly, SQLite). They do not prove behavior on real hosting: MySQL, the host's PHP version and extensions, caching and security plugins, CDNs and server configuration can all change the result.
- **Laravel is partly tested until it has run on a real Laravel app.** The Blade source and the Vite build were checked, the PHP side was not; [`docs/test-on-laravel.md`](docs/test-on-laravel.md) is the manual test that closes the gap.
- **Tier 2 stacks** (Vue/Nuxt, Svelte/SvelteKit, Astro, React SPA) have guidance and best-effort source reading, but no test project.
- macOS and Linux browser paths were not tested.

## Windows notes (tested on Windows 11, Node 24, Chrome)
- Paths with spaces and `&` work (the whole suite was developed in a folder named `UI&UX Skill`).
- **Chrome/Edge are optional.** They are found in `Program Files`, `Program Files (x86)` and `%LOCALAPPDATA%`; set `CHROME_PATH` to use another Chromium-family browser, or `CHROME_PATH=none` to skip every browser step (PowerShell: `$env:CHROME_PATH='none'`). Without a browser, `--render` and the logo shaping check print "skipped", nothing counts as passed, and nothing is downloaded.
- The WebAssembly files load from the plugin folder with no network access (works offline, also inside Iran).
- `favicon.ico` was checked with Windows' own icon decoder (System.Drawing) and in Chrome at 16, 32 and 48 px.
- Headless Chrome never lays a window out narrower than 500 px; `--render` frames the page at the exact width, so 375 px results are real 375 px results.

## Known limitations
- macOS and Linux browser paths are implemented but were **not tested**.
- What a clean audit does and does not prove (Playground, Laravel, Tier 2): [What the audit cannot tell you](#what-the-audit-cannot-tell-you).
- On Windows, `npm run …` breaks in folders whose path contains `&` (cmd.exe); run the tool through `node node_modules/<tool>/…` there (details in the adapters). The skill's own scripts are not affected.
- `--render` measures the state shown after load (first tab, closed menus) and, because of its measurement adjustments, the end state of every reveal — real visitors may see in-between states. Whether content survives without JavaScript is the separate no-JS view.
- `--slop` and `--contrast` read source files statically; they cannot verify truth, judge substance or see components rendered elsewhere. `.vue`, `.svelte` and `.astro` parsing is best-effort.
- brand-logo-studio's bidi handling is for one-line logo strings; calligraphic logotypes (Nastaliq, Shekasteh), mascots and illustrations need a human designer.
- Legal notes about Iranian trademark registration and copyright are dated (Oct 2026), US-centered for copyright, and **not legal advice — verify with an IP attorney**.
- `assets/PersianHelpers.php` is a port of the tested JS helpers but has **not** been run.

## Repository layout
```
.claude-plugin/          plugin.json, marketplace.json
skills/web-ui-playbook/  SKILL.md · references/ (foundations, directions, anti-generic, components, patterns,
                         accessibility, Persian/RTL, Iran market + network, tech, examples, templates, checklist,
                         stacks/ — adapter index + laravel, next, static-html, wordpress, tier2-frameworks, builders)
                         · assets/ (tokens.css, persian-base.css, Persian helpers) · scripts/ (audit.mjs, slop.mjs,
                         render.mjs, profile.mjs, detect-stack.mjs, parsers/, data/, fixtures/, selftest.mjs, serve.mjs)
skills/brand-color-system/ SKILL.md · references/ · scripts/ (generate-palette, formats, check-contrast, engine, selftest)
skills/brand-logo-studio/  SKILL.md · references/ · scripts/ (directions, export-kit, text-to-path, shaping-check,
                         proof-sheet, validate-render, lib/, selftest) · assets/fonts (FONTS.md) · vendor/ (VERSIONS.md)
THIRD_PARTY_NOTICES.md   fonts, WASM libraries, Tailwind palette data, taste-skill ideas (cited by file and line)
CHANGELOG.md
docs/test-on-laravel.md  manual test of a generated Blade page on a real Laravel app (PHP half not run here)
```

## Notes
- Built from deep-research reports dated **October 2026**. Facts about services, providers, prices, licenses and regulations are marked ⏱ "verify before relying".
- Recommendations point to real, licensed resources only; pirated "nulled" themes and fonts are excluded.

## License
[MIT](LICENSE) © 2026 jpedy. Bundled fonts and libraries keep their own licenses — see `THIRD_PARTY_NOTICES.md`.
