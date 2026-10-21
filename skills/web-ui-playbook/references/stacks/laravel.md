# Laravel adapter — Blade, Livewire, Inertia, Filament (Tier 1)

## Verified on
Laravel 13.37 (skeleton `laravel/laravel` 13.11) · laravel-vite-plugin 3.2 · Tailwind CSS 4.3.3 (`@tailwindcss/vite`) · Livewire 4.4 · Flux 2.20 · MaryUI 2.9 · Filament 5.10 — ⏱ checked 2026-10-18 against laravel.com/docs/13.x/vite, the `laravel/laravel` 13.x repository, livewire.laravel.com/docs (upgrading, alpine) and filamentphp.com/docs/5.x, versions from Packagist/npm. Tested: the v2 school page (Blade + Alpine) and the audit fixtures.

## Project structure
- Pages and layouts: `resources/views/` (`layouts/app.blade.php`, `components/`, page views). Styles: `resources/css/app.css`. Scripts: `resources/js/app.js`. Built files: `public/build/` (Vite manifest).
- Copy the skill's assets into the project, never import them from the skill folder: `assets/tokens.css` → `resources/css/tokens.css`; Persian: `assets/persian-base.css` → `resources/css/persian-base.css`; `assets/PersianHelpers.php` → `app/Support/PersianHelpers.php` (namespace `App\Support`; a port of the tested JS helpers, **not run** — test it in the project).

## Where tokens live
Tailwind v4 is CSS-first: no `tailwind.config.js`; tokens live in `@theme` (format `tailwind4` of `generate-palette.mjs`, the default).
```css
/* resources/css/app.css */
@import "./tokens.css";            /* contains @import "tailwindcss" — don't import it twice */
@import "./brand/palette.css";     /* generate-palette.mjs --out resources/css/brand */
@import "./persian-base.css";      /* Persian/RTL projects only */
@source "../views";
@source "../js";
```
⏱ The 13.x skeleton's `app.css` also adds `@source` lines for the pagination views and `storage/framework/views/*.php` — keep them.

## Components and templates
- One Blade component per UI primitive in `resources/views/components/ui/` (`button`, `input`, `card`, `badge`, `modal`, `table`, `empty-state`); specs and states: `components-and-states.md`.
- Classes come from tokens only; merge extras with `$attributes->merge([...])` / `->class([...])`. Errors: `@error('mobile') <p id="mobile-error" class="text-sm text-danger">{{ $message }}</p> @enderror` + `aria-invalid` and `aria-describedby`.
```blade
{{-- resources/views/components/ui/button.blade.php --}}
@props(['variant' => 'primary', 'size' => 'md', 'href' => null, 'loading' => false])
@php
$base = 'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:cursor-not-allowed';
$sizes = ['sm' => 'h-8 px-3 text-sm', 'md' => 'h-10 px-4 text-sm', 'lg' => 'h-12 px-6 text-base'];
$variants = ['primary' => 'bg-primary text-primary-fg hover:bg-primary-hover', 'secondary' => 'border border-border bg-surface text-text hover:bg-surface-subtle', 'ghost' => 'text-text hover:bg-surface-subtle', 'danger' => 'bg-danger text-white hover:opacity-90'];
$classes = "$base {$sizes[$size]} {$variants[$variant]}";
@endphp
@if ($href)
  <a href="{{ $href }}" {{ $attributes->class($classes) }}>{{ $slot }}</a>
@else
  <button {{ $attributes->merge(['type' => 'button'])->class($classes) }} @disabled($loading) @if($loading) aria-busy="true" @endif>{{ $slot }}</button>
@endif
```
Persian buttons: the `h-*` heights work because Persian text inherits line-height 1.55 from persian-base.css; don't add `leading-none`.

**Livewire 4** ⏱ — ships Alpine ("no need to install it separately"; never add an Alpine CDN `<script>`). Validate on blur with `wire:model.live.blur` (v4 changed `.blur`: without `.live` it only syncs on the client). Elements that send a request get a `data-loading` attribute (style it, or use `wire:loading`). Component tags must be closed (`<livewire:cart />`). `wire:transition` now uses View Transitions (its `.opacity/.scale/.duration` modifiers are gone). `wire:navigate` remains; re-initialize vanilla widgets after navigation (⚠ the `livewire:navigated` event name was not re-checked for v4).
**Flux UI** (official Livewire kit; free core + paid Pro ⏱ prices in `resources-templates.md`) and **MaryUI** (MIT, on DaisyUI): logical classes work in RTL; date pickers are Gregorian — use your own Jalali picker for Iran.
**Filament 5** ⏱ — panel font: `$panel->font('Vazirmatn', url: asset('css/fonts.css'), provider: LocalFontProvider::class)`; the **default provider is Bunny Fonts (remote)**, so always switch to `LocalFontProvider` for the Iran market. RTL: ⚠ unverified for v5 — the docs page did not cover it; community reports set the direction through the locale (`fa`) and a published panel translation. Check the panel in `fa` before promising RTL.
**Inertia + React** (official React starter kit ships shadcn/ui ⏱): set `<html dir>` in `app.blade.php`, wrap the app in Radix `<DirectionProvider dir={…}>`, replace physical classes in copied shadcn components (`left-*`, `ml-*`, `pl-*`, `text-left`…), remove `tracking-tight` on Persian headings; Jalali pickers: `react-multi-date-picker`.

## RTL and i18n
```blade
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'fa' ? 'rtl' : 'ltr' }}">
```
Translations in `lang/fa/*.php` or `lang/fa.json`; `config/app.php` `locale=fa`; display timezone `Asia/Tehran`, database in UTC. Logical utilities only (`ms-/me-/ps-/pe-/start-/end-/text-start`) — rules in `persian-rtl.md`.

## Fonts (self-hosted)
- ⏱ Laravel 13's Vite plugin self-hosts fonts: `fonts: [...]` in `laravel({...})` with helpers from `laravel-vite-plugin/fonts` (`google`, `bunny`, `fontsource`, `local`), printed by Blade `@fonts`. Files are downloaded **at build time** and served from the app. The 13.x skeleton uses `bunny('Instrument Sans')` — replace it.
- **Market `iran`: use `local()` (files in `resources/fonts/`) or a Fontsource package**, never `google()`/`bunny()`: the build machine and CI must reach those hosts, which fails or is slow from Iran (our inference from how the plugin works). `local('Vazirmatn', { alias: 'fa', src: 'resources/fonts/vazirmatn/*.woff2' })`; ⚠ whether `local()` reads a variable font's weight range from the file was not verified — list `variants` explicitly if weights come out wrong.
- Tested alternative (v2 school page): `npm i @fontsource-variable/vazirmatn @fontsource-variable/inter` and `@import "@fontsource-variable/vazirmatn";` in `app.css` — Vite bundles the woff2 files.
- Preload only the font used above the fold; at most 2 families.

## Icons and favicons
`export-kit.mjs` (brand-logo-studio) writes `head-snippet.blade.php`: copy the kit to `public/brand/` and paste the snippet in the layout `<head>`. Icons: one self-hosted SVG set as Blade components (`components-and-states.md` §9).

## Images
`public/` or `storage/app/public` (`php artisan storage:link`); always `width`/`height`, `loading="lazy"` below the fold only, the hero `fetchpriority="high"` (rules: `performance-and-tech.md` §2).

## Forms
Laravel validation (`$request->validate()` / Form Requests) + `@error` with the ARIA wiring above; keep `old()` values on error; mobile/OTP specifics for Iran in `iran-market.md` §2/§6. Livewire: `wire:model.live.blur` + `#[Validate]` attributes.

## Motion baseline
Put the `html.js` gate in the layout `<head>` before styles: `<script>document.documentElement.classList.add('js')</script>`; Alpine: `x-cloak` with `[x-cloak]{display:none}` only for things that are useless without JS (menus), never for content (`components-and-states.md` §12).

## Accessibility specifics
Blade components own the ARIA (labels, `aria-describedby` for errors, `aria-expanded` on Alpine toggles); Livewire re-renders must keep focus — after a validation error move focus to the first invalid field.

## Build and test
`npm run dev` (Vite) + `php artisan serve` (needs PHP), or `composer run dev` for both · `npm run build` → `public/build/` (with `manifest.json`). Alpine without Livewire: `npm i alpinejs` and `import Alpine from 'alpinejs'; window.Alpine = Alpine; Alpine.start();` in `resources/js/app.js` — no copied `alpine.min.js`. No PHP on the machine: build with Vite and preview static Blade output saved as HTML (`scripts/serve.mjs`). The full manual test of a generated page on a real Laravel app is `docs/test-on-laravel.md` in the plugin repository (frontend half run with Vite 8.3.5 on 2026-10-22; PHP half ⚠ not run).

## Audit and render recipe
- Source: `node <skill>/scripts/audit.mjs resources/views --contrast --slop` (CSS folders come from `.web-ui-playbook.json`; add `--css resources/css` without a profile). Before launch: `--release`.
- Rendered: point `--render` at the running app — `--render http://127.0.0.1:8000/ --pages /,/courses` (local URLs only; the audit proxies it and blocks every other host). Without a running server: save the served page into `public/` so `/build/...` resolves (`curl -s http://127.0.0.1:8000/ -o public/__audit.html`, then `--render public/__audit.html`, delete it afterwards).
- Blade parsing reads `class`, `:class`, `x-bind:class`, `->class()`; classes built in PHP, `@class([...])` conditions and components rendered elsewhere are reported as **could not resolve** and need `--render`.

## Known pitfalls
- Tailwind Play CDN or a font CDN `<link>` left from a starter kit; Filament's default Bunny font in an Iran panel.
- Alpine added twice (CDN + Livewire) → double-initialized components.
- A page with a form posts to a named route (`route('placement.store')`): Blade throws "Route [...] not defined" until `routes/web.php` has it — list them with `grep -n "route(" resources/views/*.blade.php` and add each one (a stub is fine for a design test).
- A standalone preview links `build/app.css`, a font and `alpine.min.js` by hand; in the Laravel app those three tags become one `@vite([...])` line, or the page loads stale or missing assets.
- The 13.x skeleton's `vite.config.js` loads `bunny('Instrument Sans')` at build time — remove it when the page does not use that font (and always for market `iran`).
- `wire:model.blur` copied from v3 docs → no server validation on blur in Livewire 4 (use `.live.blur`).
- Vanilla JS widgets (Preline/Flowbite `autoInit`) not re-initialized after `wire:navigate`.
- `tailwind.config.js` + `@apply` soup recreating Bootstrap; CSS Modules mixed with Tailwind v4 (slow builds).
