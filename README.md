# web-ui-playbook

A self-contained [Claude Code](https://claude.com/claude-code) plugin that lets Claude design and build professional web interfaces — and the brand behind them — for people with no design background. Tuned for **Laravel + Tailwind CSS v4** and for **Persian (Farsi) / RTL** sites used **inside Iran**.

Three skills that work together (and replace any other design skill):

| Skill | What it does |
|---|---|
| **web-ui-playbook** | Pages, landing pages, dashboards, forms and components: intake questions, one of 8 style directions, a written design commitment, tokens first, tested component specs and page patterns, Persian/RTL and Iran rules, then an audit of its own output. |
| **brand-color-system** | Brand palettes: keeps your exact brand color, builds Tailwind-style scales in OKLCH, picks an accent by industry, and writes light + dark tokens in which every text/background pair passes WCAG 2.2 (plus a 5.5:1 house rule for small Persian text). |
| **brand-logo-studio** | Logos and brand kits in code: three directions, then outlined SVG masters (Persian + Latin, Persian-only, icon, reversed, one-color), favicons, app/social/email images, a brand sheet and a letter-by-letter proof sheet of the Persian name. |

What web-ui-playbook does, every time:
1. Asks up to 6 short questions (audience, goal, feel, language, devices, inside Iran?) and asks you for **real content** — numbers, testimonials and logos come only from you.
2. Picks a style direction, names 1–2 real reference sites, and writes `docs/design-commitment.md` **in your project** (type, color roles, layout rhythm, one signature detail, motion budget) so later sessions stay consistent.
3. Defines tokens (via brand-color-system) before markup, then builds.
4. Applies Persian/RTL and Iran rules: Vazirmatn, Persian digits, ZWNJ, bidi, Jalali, Toman, SMS-OTP, Shaparak, eNamad, no foreign CDNs.
5. Audits its own output (`scripts/audit.mjs`), fixes what it finds, and reports what it fixed, the placeholders you must fill, and **every number and quote on the page for you to confirm**. Passing the audit does not prove a page is good — the report also includes a by-eye "substance" review.

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
node <plugin>/skills/brand-color-system/scripts/generate-palette.mjs --brand "#0d9488" --industry education --lang fa --market iran --out resources/css/brand
node <plugin>/skills/brand-logo-studio/scripts/export-kit.mjs --brief brand/brief.json --direction C --out public/brand
```

All output goes into your project (`--out`); the scripts refuse to write into the plugin folder.

### Audit modes
- **default** — RTL/logical properties, Persian text hygiene, foreign hosts (errors when the project's market is Iran — `.web-ui-playbook.json` or `--iran`; warnings otherwise), accessibility basics, placeholders.
- **`--contrast`** — every text element against its background in light and dark, from your tokens. Pairs it cannot determine (dynamic classes, components, background images) are listed as "could not resolve" and **never counted as passed**.
- **`--slop`** — generic-page tells as warnings (stock phrases and generic buttons from `scripts/data/fa-slop.json`, layout and motion habits), and the list of claims for you to confirm. Allow a phrase or rule in your project with `.slop-allow.json`.
- **`--render <page.html>`** — opens a built page in your installed Chrome/Edge (headless, local server, network blocked) and measures what the browser really shows after Alpine/JS ran: contrast in light and dark, overflow and headline lines at 1440 / 768 / 375 px, fonts that loaded, requests that tried to leave the machine. Blade must be rendered to HTML first (save the page Laravel serves).
  - **Measurement adjustments show an end state.** Headless Chrome renders no frames, so before measuring `--render` routes `requestAnimationFrame` through timers, reports every element as scrolled into view and switches transitions/animations off. Results describe the page *after* every reveal — not what a visitor sees mid-animation.
  - **No-JS view (separate).** The same run also opens the page with JavaScript **off** (sandboxed frame, none of the adjustments above apart from transitions off) and reports text that is visible with JS but hidden without it (`nojs-hidden` — an ungated hide-before-reveal) and content that only JavaScript fills in (`nojs-empty` — empty `x-text`, `<template x-for>`).
- **`--release`** — the pre-launch gate: every PLACEHOLDER marker, visible placeholder text (`[ … ]`), fake sample data (lorem, «شرکت نمونه», example.com, placeholder images, seals without a verification link) and example phone number outside an input hint is an **error**, listed by file and line; no-JS findings become errors too. Without `--release`, fake data and example phones are warnings and placeholders are listed.

### Self-tests
```bash
node skills/web-ui-playbook/scripts/selftest.mjs      # audit fixtures, --slop, --release, --render, no-JS view (106 checks; 89 without a browser)
node skills/brand-color-system/scripts/selftest.mjs   # color math, palettes, contrast, token formats (3860 checks)
node skills/brand-logo-studio/scripts/selftest.mjs    # shaping, bidi, validators, kit export (163 checks; 155 without a browser)
```

## Windows notes (tested on Windows 11, Node 24, Chrome)
- Paths with spaces and `&` work (the whole suite was developed in a folder named `UI&UX Skill`).
- **Chrome/Edge are optional.** They are found in `Program Files`, `Program Files (x86)` and `%LOCALAPPDATA%`; set `CHROME_PATH` to use another Chromium-family browser, or `CHROME_PATH=none` to skip every browser step (PowerShell: `$env:CHROME_PATH='none'`). Without a browser, `--render` and the logo shaping check print "skipped", nothing counts as passed, and nothing is downloaded.
- The WebAssembly files load from the plugin folder with no network access (works offline, also inside Iran).
- `favicon.ico` was checked with Windows' own icon decoder (System.Drawing) and in Chrome at 16, 32 and 48 px.
- Headless Chrome never lays a window out narrower than 500 px; `--render` frames the page at the exact width, so 375 px results are real 375 px results.

## Known limitations
- macOS and Linux browser paths are implemented but were **not tested**.
- `--render` measures the state shown after load (first tab, closed menus) and, because of its measurement adjustments, the end state of every reveal — real visitors may see in-between states. Whether content survives without JavaScript is the separate no-JS view.
- `--slop` and `--contrast` read source files statically; they cannot verify truth, judge substance or see components rendered elsewhere.
- brand-logo-studio's bidi handling is for one-line logo strings; calligraphic logotypes (Nastaliq, Shekasteh), mascots and illustrations need a human designer.
- Legal notes about Iranian trademark registration and copyright are dated (Oct 2026), US-centered for copyright, and **not legal advice — verify with an IP attorney**.
- `assets/PersianHelpers.php` is a port of the tested JS helpers but has **not** been run.

## Repository layout
```
.claude-plugin/          plugin.json, marketplace.json
skills/web-ui-playbook/  SKILL.md · references/ (foundations, directions, anti-generic, components, patterns,
                         accessibility, Persian/RTL, Iran market + network, tech, examples, templates, checklist)
                         · assets/ (tokens.css, persian-base.css, Persian helpers) · scripts/ (audit.mjs, slop.mjs,
                         render.mjs, data/, fixtures/, selftest.mjs, serve.mjs)
skills/brand-color-system/ SKILL.md · references/ · scripts/ (generate-palette, check-contrast, engine, selftest)
skills/brand-logo-studio/  SKILL.md · references/ · scripts/ (directions, export-kit, text-to-path, shaping-check,
                         proof-sheet, validate-render, lib/, selftest) · assets/fonts (FONTS.md) · vendor/ (VERSIONS.md)
THIRD_PARTY_NOTICES.md   fonts, WASM libraries, Tailwind palette data, taste-skill ideas (cited by file and line)
CHANGELOG.md
```

## Notes
- Built from deep-research reports dated **October 2026**. Facts about services, providers, prices, licenses and regulations are marked ⏱ "verify before relying".
- Recommendations point to real, licensed resources only; pirated "nulled" themes and fonts are excluded.

## License
[MIT](LICENSE) © 2026 jpedy. Bundled fonts and libraries keep their own licenses — see `THIRD_PARTY_NOTICES.md`.
