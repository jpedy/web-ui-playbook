# Performance & Tech Stack (Laravel + Tailwind first)

The user's main stack is **Laravel + Tailwind CSS**. Default to it unless the project says otherwise. Sources: report B §4/§5/§11, report E (Laravel libraries), and report C §4. Laravel-specific steps not covered by the reports are marked "(not from reports — verify)".

## Contents
1. Core Web Vitals: thresholds and fixes
2. Images, fonts, JavaScript
3. Modern CSS: what is safe to use
4. Stack decision table
5. Laravel + Tailwind v4 setup
6. Blade component conventions
7. Livewire, Alpine, Flux, MaryUI, Filament
8. Inertia + React (shadcn) and RTL
9. No project yet? Standalone HTML recipe
10. SEO and metadata baseline
11. Common mistakes

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
- Server-render content. Hydrate only interactive islands (Alpine/Livewire components, or React only where needed).
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

## 4. Stack decision table
| Project type | Recommended stack (user default first) | Interactive layer | UI kit (see `resources-templates.md`) |
|---|---|---|---|
| Brand / company / landing site | **Laravel + Blade + Tailwind v4** (+ a small CMS: Filament resources or Statamic — not from reports, verify) | Alpine.js | Preline, HyperUI, Flowbite, DaisyUI blocks; Tailwind Plus if licensed |
| SaaS app / dashboard (server-driven) | **Laravel + Livewire 3 + Tailwind v4** | Livewire + Alpine | **Flux UI** (free core, Pro paid) or **MaryUI** (free) |
| SaaS app with rich client UX | **Laravel + Inertia + React + Tailwind v4** (official React starter kit ships shadcn/ui ⏱) | React | shadcn/ui, Radix; Tremor for charts |
| Admin panel / back-office / CRM | **Laravel + Filament** | Livewire | Filament (native RTL + `fa` locale ⏱) |
| E-commerce (Iran) | Laravel + Livewire or Inertia, Shaparak gateway; or WooCommerce with a native Persian theme if WordPress is acceptable | — | Preline Pro / Tailwind Plus e-commerce blocks; Bakala (WP) ⏱ |
| Content / blog / docs | Laravel + Blade + `@tailwindcss/typography` (or Astro/Starlight per report B) | none or Alpine | typography plugin |
| One-off prototype, no backend | static HTML + Tailwind CLI (§9) | Alpine (bundled locally) | — |

Report B's alternatives (Next.js, SvelteKit, Astro, Shopify Hydrogen) are valid, but prefer Laravel to match the user's skills. For Iranian audiences, avoid Vercel/Netlify hosting ⏱.

## 5. Laravel + Tailwind v4 setup
(Laravel 11/12 + Vite; not from reports — verify.)
```bash
npm install tailwindcss @tailwindcss/vite @fontsource-variable/vazirmatn @fontsource-variable/inter
```
`vite.config.js`:
```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [laravel({ input: ['resources/css/app.css', 'resources/js/app.js'], refresh: true }), tailwindcss()],
});
```
Copy `assets/tokens.css` → `resources/css/tokens.css` (and `assets/persian-base.css` → `resources/css/persian-base.css` for Persian). `resources/css/app.css`:
```css
@import "./tokens.css";            /* already contains @import "tailwindcss" — don't import it twice */
@import "./persian-base.css";      /* Persian/RTL projects only */
@import "@fontsource-variable/inter";
@import "@fontsource-variable/vazirmatn";
@source "../views";                /* Blade files */
@source "../js";
/* project edits: :root { --primary: …; }  @theme { --radius-…; } */
```
- **Tailwind v4 is CSS-first:** there's no `tailwind.config.js`; tokens live in `@theme`.
- Don't mix CSS Modules with Tailwind v4 (it slows builds badly) `[Proven, report B]`.
- **Layout `<head>`:**
  ```blade
  <html lang="{{ str_replace('_','-',app()->getLocale()) }}" dir="{{ app()->getLocale() === 'fa' ? 'rtl' : 'ltr' }}" class="scroll-smooth">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  @vite(['resources/css/app.css','resources/js/app.js'])
  ```
- Delete any `fonts.bunny.net` `<link>` that came with the starter kit.
- **Persian helpers:** copy `assets/PersianHelpers.php` to `app/Support/PersianHelpers.php` (namespace `App\Support`) and use it in Blade: `{{ \App\Support\PersianHelpers::toman($price) }}`. Or register a Blade directive.
- **Localization:** `lang/fa/*.php` or JSON; `config/app.php` `locale=fa`, `timezone=Asia/Tehran` (display), DB stays UTC.

## 6. Blade component conventions
(General practice.)
- One component per UI primitive in `resources/views/components/ui/`:
  - `button.blade.php` (props: `variant`, `size`, `href`, `loading`)
  - `input.blade.php` (label, error, hint, dir)
  - `card`, `badge`, `modal`, `table`, `empty-state`
- Classes come from tokens only. Merge extra classes with `$attributes->merge(['class' => …])` or `->class([...])`.
- Errors: `@error('mobile') <p id="mobile-error" class="text-sm text-danger">{{ $message }}</p> @enderror` + `aria-invalid` and `aria-describedby` on the input.
- Pages compose components; no raw hex, no arbitrary pixel values in page templates.

```blade
{{-- resources/views/components/ui/button.blade.php --}}
@props(['variant' => 'primary', 'size' => 'md', 'href' => null, 'loading' => false])
@php
$base = 'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:cursor-not-allowed';
$sizes = ['sm' => 'h-8 px-3 text-sm', 'md' => 'h-10 px-4 text-sm', 'lg' => 'h-12 px-6 text-base'];
$variants = [
  'primary' => 'bg-primary text-primary-fg hover:bg-primary-hover',
  'secondary' => 'border border-border bg-surface text-text hover:bg-surface-subtle',
  'ghost' => 'text-text hover:bg-surface-subtle',
  'danger' => 'bg-danger text-white hover:opacity-90',
];
$classes = "$base {$sizes[$size]} {$variants[$variant]}";
@endphp
@if ($href)
  <a href="{{ $href }}" {{ $attributes->class($classes) }}>{{ $slot }}</a>
@else
  <button {{ $attributes->merge(['type' => 'button'])->class($classes) }} @disabled($loading) @if($loading) aria-busy="true" @endif>{{ $slot }}</button>
@endif
```
Persian buttons: the `h-*` heights are fine because Persian text inherits line-height 1.55 from persian-base.css. Don't add `leading-none`.

## 7. Livewire, Alpine, Flux, MaryUI, Filament
- **Livewire 3:**
  - `wire:model.blur` for validation-on-blur forms.
  - `wire:loading` for button spinners.
  - `wire:navigate` for SPA-like navigation. Re-initialize vanilla JS plugins (Preline/Flowbite `autoInit`) on `livewire:navigated` `[Proven, report E]`.
- **Alpine:** modals, dropdowns, tabs, the countdown timer for OTP. Install via npm/Livewire, never a CDN `<script>` (it ships with Livewire 3).
- **Flux UI** (official Livewire kit) ⏱:
  - Free core; Pro **$149 per project / $299 unlimited / $799 team** (verified Oct 2026).
  - Logical classes work in RTL; custom date pickers need overrides (Gregorian only → for Jalali, use your own Alpine picker or format inputs).
- **MaryUI** (MIT, Livewire + DaisyUI): free alternative to Flux; inherits DaisyUI's RTL.
- **Filament** (MIT) ⏱:
  - Native RTL and the `fa` locale.
  - Set the panel font to a **locally served** Vazirmatn (the default provider is remote — not from reports, verify).
  - For Jalali display, pick a maintained plugin from the Filament plugin directory (search "jalali") — not from reports, verify.

## 8. Inertia + React (shadcn) and RTL `[Proven, report C/E]`
- Wrap the app in Radix `<DirectionProvider dir={locale==='fa'?'rtl':'ltr'}>` and set `<html dir>`.
- Audit copied shadcn components: replace `left-*`/`right-*`/`ml-*`/`mr-*`/`pl-*`/`pr-*`/`text-left` with logical equivalents; remove `tracking-tight` on Persian headings.
- **Jalali pickers:** `react-multi-date-picker` (`calendar={persian}`, `locale={persian_fa}`).
- **Charts:** Tremor/Recharts. Persian digits in tick formatters; keep the axis direction consistent.

## 9. No project yet? Standalone HTML recipe
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
- **Preview over HTTP, not `file://`:** ES modules (`<script type="module">`) are blocked on `file://`. Run `node <skill>/scripts/serve.mjs <folder>` (zero dependencies, http://localhost:4173). Laravel: `php artisan serve` + `npm run dev`.
- Verified working in testing: Tailwind v4.3 CLI, Vazirmatn arabic-subset variable woff2 = 46KB (+35KB Latin subset), Inter Latin variable = 48KB, compiled CSS ≈ 26–28KB minified for a full landing page.

## 10. SEO and metadata baseline `[Proven]`
- Server-rendered semantic HTML.
- Unique `<title>` (≤ 60 chars) and meta description (≤ 155).
- Canonical URL; Open Graph + Twitter card image (1200×630).
- `sitemap.xml`, `robots.txt`.
- JSON-LD: `Organization`, plus `Product`/`Course`/`FAQPage`/`LocalBusiness` as relevant.
- Persian specifics: `iran-market.md` §10.
- `/llms.txt` (a Markdown index for AI assistants) `[Emerging]`: neutral for Google ranking, useful for developer tools and docs.

## 11. Common mistakes
- Tailwind Play CDN or Google Fonts `<link>` in production.
- `loading="lazy"` on the hero; images without width/height; 4MB PNG heroes.
- A client-only SPA for a content site (blank HTML for crawlers, slow LCP).
- `tailwind.config.js` + `@apply` soup recreating Bootstrap; CSS Modules mixed with Tailwind v4.
- Vanilla JS widgets that break after Livewire `wire:navigate` because they're never re-initialized.
- Using emerging CSS features as if they were universal, without fallbacks.
