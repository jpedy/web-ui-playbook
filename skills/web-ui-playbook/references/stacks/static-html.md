# Static HTML/CSS/JS adapter — no framework (Tier 1)

## Verified on
Plain HTML5 + CSS custom properties (no build) or Tailwind CSS 4.3.3 via `@tailwindcss/cli` — ⏱ checked 2026-10-18 (npm versions; the Tailwind CLI recipe was tested in v1.0 and again here). Browser features used are Baseline / widely available (`performance-and-tech.md` §3). Tested: test project #4 (English portfolio, market global) — results in the README support matrix.

## Project structure
`index.html` and one HTML file (or `folder/index.html`) per page; `css/`, `fonts/`, `img/`, `js/` beside them; a logo kit in `brand/`. No build step is needed; with Tailwind add `src/app.css` → `dist/app.css`. Keep every asset path root-relative (`/css/site.css`) or consistently relative; the audit's folder mode serves the folder as the site root.

## Where tokens live
- **No Tailwind (default for small sites):** `generate-palette.mjs --format css-variables --out css` writes `css/palette.vars.css` (light in `:root`, dark from the visitor's system setting, `.dark` / `data-theme="dark"` forces it). Link it first, then your own `css/site.css` that only uses the variables: `color: var(--text)`, `background: var(--surface)`, buttons `var(--primary)` + `var(--primary-fg)`, links `var(--primary-ink)`. Spacing, type and radius values: `design-foundations.md` (write them as variables in `site.css`).
- **With Tailwind CLI:** copy `assets/tokens.css` to `src/tokens.css`, `src/app.css` = `@import "./tokens.css";` + `@source "../*.html";` (+ palette `--format tailwind4`, + `persian-base.css` for Persian). Build: `npx @tailwindcss/cli -i src/app.css -o dist/app.css --minify`. Copy the token files into the project — importing them from the skill folder fails (`@import "tailwindcss"` cannot resolve there).

## Components and templates
No templating: repeat the header/footer markup on each page (or generate pages with a script) and keep it identical. Component specs and states: `components-and-states.md`; one class per component in `site.css` (`.btn`, `.btn--secondary`, `.card`), never inline `style` colors. Interactive parts (menu, tabs, dialog) as small vanilla JS modules (`<script type="module" src="/js/menu.js">`) — prefer `<details>`, `<dialog>` and `popover` first.

## RTL and i18n
`<html lang="fa" dir="rtl">` (or `lang="en" dir="ltr"`) on every page; one HTML file per language (`/fa/…`, `/en/…`) with `<link rel="alternate" hreflang>`. Logical properties only in `site.css` (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`) — rules in `persian-rtl.md`.

## Fonts (self-hosted)
Copy the woff2 files (e.g. `node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2`, Vazirmatn's `…arabic-wght-normal.woff2`) into `fonts/` once, then:
```css
@font-face { font-family: "Inter Variable"; src: url("/fonts/inter-latin-wght-normal.woff2") format("woff2"); font-weight: 100 900; font-style: normal; font-display: swap; }
```
Preload the one above the fold: `<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>`. Persian: the commented `@font-face` pair in `assets/persian-base.css` (Arabic + Latin subsets with `unicode-range`). Never a font CDN `<link>`.

## Icons and favicons
`export-kit.mjs` with stack `static` writes `head-snippet.html`: copy the kit to `/brand/`, paste the snippet into every page's `<head>`, and replace `YOUR-DOMAIN` in `og:image` (it must be an absolute URL). Icons: inline SVG from one set, `aria-hidden="true"` unless the icon is the only content of a control (then `aria-label` on the control).

## Images
`<img src width height alt loading="lazy" decoding="async">` below the fold; the hero `fetchpriority="high"` and no `lazy`; `<picture>` with AVIF/WebP + `srcset`/`sizes`. Rules: `performance-and-tech.md` §2.

## Forms
Static hosting has no server: point `<form action>` to the owner's form endpoint (their backend, a form service they choose — for market Iran a domestic one, `iran-network-resilience.md`) and keep native validation (`required`, `type="email"`, `inputmode`, `autocomplete`). Never fake a success message that nothing sends.

## Motion baseline
`<script>document.documentElement.classList.add('js')</script>` as the first thing in `<head>`; hide-before-reveal styles only under `.js`; one small module adds `.is-visible` with `IntersectionObserver` (`components-and-states.md` §12).

## Accessibility specifics
A skip link (`<a href="#main" class="skip">`), one `<h1>` per page, landmarks (`header`, `nav`, `main`, `footer`), `<button>` for actions and `<a>` for navigation; a hand-made menu needs `aria-expanded` and Escape to close.

## Build and test
- Preview over HTTP, not `file://` (ES modules are blocked there): `node <skill>/scripts/serve.mjs <folder>` → http://localhost:4173.
- Tailwind: `npm i -D tailwindcss @tailwindcss/cli`, then `npx @tailwindcss/cli -i src/app.css -o dist/app.css --minify` (`--watch` while editing; on npm 12+ the watcher's install script may need approval — a plain build works without it). The CLI does not copy font files: `@import`ing a fontsource CSS from the CLI leaves broken `url()`s, so copy the woff2 files and write `@font-face` yourself. **Never** `<script src="https://cdn.tailwindcss.com">`.
- Measured in testing: Vazirmatn Arabic-subset variable woff2 46 KB (+35 KB Latin subset), Inter Latin variable 48 KB, compiled Tailwind CSS ≈ 26–28 KB minified for a full landing page.

## Audit and render recipe
- Source: `node <skill>/scripts/audit.mjs . --contrast --slop` (CSS folders from `.web-ui-playbook.json`; or `--css css`). Plain-CSS classes that set colors (`.card { color: … }`) are reported as **could not resolve (css-rule)** — the static check only reads Tailwind utilities and inline styles — and are measured by `--render`.
- Rendered: `--render . --pages index,work/harbor` (the folder is served as the site root, clean URLs `/about` → `about.html` or `about/index.html`). Before launch: `--release`.

## Known pitfalls
- Copied CDN links from tutorials (Google Fonts, jsDelivr, unpkg, the Tailwind Play CDN).
- Header/footer drifting between pages (copy-paste); different `<title>` missing on sub-pages.
- `file://` previews that hide broken module scripts; root-relative paths that break when the site lives in a sub-folder.
- Unsized images (layout shift) and multi-MB hero PNGs.
