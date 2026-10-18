# Performance, modern CSS, SEO and stack choice

Stack-neutral rules for every project. How to apply them in a given stack (files, font loading, build, audit) is in that stack's adapter: `references/stacks/<stack>.md` (index: `references/stacks/README.md`). Sources: report B §4/§5/§11, report C §4.

## Contents
1. Core Web Vitals: thresholds and fixes
2. Images, fonts, JavaScript
3. Modern CSS: what is safe to use
4. Choosing a stack (new projects only)
5. No project yet? Standalone HTML recipe
6. SEO and metadata baseline
7. Common mistakes

---

## 1. Core Web Vitals (p75 of real users, mobile and desktop) `[Proven]`
| Metric | Good | Poor | Usual cause | Fix |
|---|---|---|---|---|
| **LCP** (loading) | ≤ 2.5s | > 4.0s | big or lazy hero image, render-blocking CSS/JS, slow TTFB | AVIF/WebP hero with `fetchpriority="high"` + `loading="eager"` + width/height; preload the font; server-render; cache HTML |
| **INP** (responsiveness) | ≤ 200ms | > 500ms | heavy JS on the main thread, huge DOM, sync third-party scripts | less JS; `defer`; split long tasks; DOM < ~1,500 nodes; `content-visibility: auto` for long off-screen sections |
| **CLS** (stability) | ≤ 0.1 | > 0.25 | images/iframes without size, late banners, font swap | width/height or `aspect-ratio` on all media; reserve slots; `font-display: swap` + `size-adjust` fallback; never insert content above existing content |

⏱ Only ~48% of mobile sites pass all three (HTTP Archive, Jan 2026). Passing them is a real advantage.

## 2. Images, fonts, JavaScript
**Images**
- AVIF/WebP, `srcset` + `sizes`, explicit `width`/`height`.
- `loading="lazy"` **below the fold only**. The hero (LCP image) gets `fetchpriority="high"`.
- Hero ≤ ~150KB, card images ≤ ~60KB (general practice).
- SVG for logos and icons.

**Fonts**
- One variable woff2 per family, self-hosted. At most 2 families.
- Preload the one used above the fold: `<link rel="preload" href="/fonts/…woff2" as="font" type="font/woff2" crossorigin>`.
- Subset when possible (Latin + Arabic-script subsets).
- **No font CDNs** (`iran-network-resilience.md`).

**JavaScript**
- Server-render content. Hydrate only interactive islands (Alpine/Livewire components, React/Vue/Svelte islands — only where needed).
- `defer` third-party scripts. Analytics never inside click handlers.
- Avoid jQuery and giant UI bundles for small interactions.

## 3. Modern CSS: what is safe (as of Oct 2026 report ⏱)
| Feature | Status | Use |
|---|---|---|
| CSS Grid, Flexbox, `gap`, logical properties, `clamp()`, `aspect-ratio`, `:focus-visible`, `dvh` units | Widely available | use freely |
| Container size queries `@container` (Tailwind v4 `@container` + `@md:`) | Widely available | reusable cards/widgets; nest ≤ 3 levels |
| `:has()`, native nesting, `subgrid`, `@layer` | Widely available | `.field:has(input:user-invalid)` error styling; aligned card rows |
| `text-wrap: balance` (headings) / `pretty` (paragraphs) | Widely available (general practice) | headings |
| View Transitions (same- and cross-document) | Newly available | page and filter transitions, with a fallback |
| `interpolate-size: allow-keywords` + `::details-content`, `field-sizing: content` | Newly available | animated `<details>`, auto-grow textarea — must degrade gracefully |
| `text-box-trim` | Newly available (limited) | optional optical centering of buttons and badges |
| Scroll-driven animations `animation-timeline` | Baseline per report; verify on target browsers | decoration only |
| `@scope`, container style queries, `scroll-state()`, `sibling-index()`, `contrast-color()`, `display: grid-lanes` (masonry, renamed) | **Emerging** | don't rely on them; progressive enhancement only |

**Tailwind v4 browser floor:** Chrome 111+, Safari 16.4+, Firefox 128+.
- If analytics show many very old Android browsers (possible in Iran ⏱), consider Tailwind v3.4.
- Either way, test on a budget Android device.

## 4. Choosing a stack (new projects only — an existing project keeps its stack)
| Project type | User default first | Other first-class stacks (Tier 1) | Notes |
|---|---|---|---|
| Brand / company / landing site | Laravel + Blade + Tailwind v4 | Next.js · static HTML · WordPress when the owner edits content themselves | Alpine or a few islands for interaction |
| SaaS app / dashboard (server-driven) | Laravel + Livewire + Tailwind v4 | Next.js App Router | UI kits: `resources-templates.md` |
| SaaS app with rich client UX | Laravel + Inertia + React | Next.js App Router | shadcn/ui in both |
| Admin panel / back-office / CRM | Laravel + Filament | — | |
| E-commerce | Laravel + Livewire or Inertia | WordPress + WooCommerce (owner-run shop) | Shopify is Tier 3 (`stacks/README.md`); Shaparak in Iran |
| Content / blog / docs | Laravel + Blade + `@tailwindcss/typography` | WordPress (block theme) · static HTML | Astro is Tier 2 |
| One-off prototype, no backend | static HTML + Tailwind CLI (§5) | — | |

- Tier 2 stacks (Vue/Nuxt, Svelte/SvelteKit, Astro, React SPA) are guided only; Tier 3 (Shopify, site builders) gets design rules and checks on saved pages — never promise more (`stacks/README.md` §2).
- A client-rendered single-page app (React + Vite, Vue SPA) sends crawlers and slow phones an empty page until JavaScript runs: worse SEO and a late first view on slow networks. Prefer server rendering for anything public.
- For Iranian audiences, avoid Vercel/Netlify hosting ⏱ (`iran-network-resilience.md`).

## 5. No project yet? Standalone HTML recipe
For previews and prototypes that still follow every rule:
```bash
mkdir site && cd site && npm init -y
npm i -D tailwindcss @tailwindcss/cli
npm i @fontsource-variable/vazirmatn @fontsource-variable/inter
```
- `src/app.css` = `@import "tailwindcss";` + `@source "../*.html";` + tokens (+ persian-base).
- Copy the woff2 files you need from `node_modules/@fontsource-variable/<font>/files/` into `fonts/` and declare `@font-face` manually. The CLI does not copy font files, so `@import`ing the fontsource CSS from the CLI would leave broken `url()`s.
- **Copy** `assets/tokens.css` (and `assets/persian-base.css` for Persian) into `src/`, then `@import "./tokens.css";`. Importing them straight from the skill folder fails, because `@import "tailwindcss"` can't resolve there (found in testing).
- Build: `npx @tailwindcss/cli -i src/app.css -o dist/app.css --minify` (add `--watch` while editing; on npm 12+ the watcher's install script may need approval — a plain build works without it).
- HTML links `dist/app.css`. **Never** `<script src="https://cdn.tailwindcss.com">`.
- **Preview over HTTP, not `file://`:** ES modules (`<script type="module">`) are blocked on `file://`. Run `node <skill>/scripts/serve.mjs <folder>` (zero dependencies, http://localhost:4173).
- Verified working in testing: Tailwind v4.3 CLI, Vazirmatn arabic-subset variable woff2 = 46KB (+35KB Latin subset), Inter Latin variable = 48KB, compiled CSS ≈ 26–28KB minified for a full landing page.

## 6. SEO and metadata baseline `[Proven]`
- Server-rendered semantic HTML.
- Unique `<title>` (≤ 60 chars) and meta description (≤ 155).
- Canonical URL; Open Graph + Twitter card image (1200×630).
- `sitemap.xml`, `robots.txt`.
- JSON-LD: `Organization`, plus `Product`/`Course`/`FAQPage`/`LocalBusiness` as relevant.
- Persian specifics: `iran-market.md` §10.
- `/llms.txt` (a Markdown index for AI assistants) `[Emerging]`: neutral for Google ranking, useful for developer tools and docs.

## 7. Common mistakes
- Tailwind Play CDN or Google Fonts `<link>` in production.
- `loading="lazy"` on the hero; images without width/height; 4MB PNG heroes.
- A client-only SPA for a content site (blank HTML for crawlers, slow LCP).
- `@apply` soup recreating Bootstrap instead of components (stack pitfalls: each adapter's "Known pitfalls").
- Using emerging CSS features as if they were universal, without fallbacks.
