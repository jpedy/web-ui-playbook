# Run a generated Blade page on a real Laravel project

Step-by-step test for a page web-ui-playbook generated in Blade (example: the Persian school landing page `landing.blade.php`). Use it on your own machine or server to check what this repository could not: Laravel itself running the page.

**What was verified, and how (2026-10-22):**
- ✓ **checked against the source** — commands and file contents taken from laravel.com/docs/13.x (installation, vite, deployment) and the `laravel/laravel` 13.x skeleton on GitHub (`composer.json`, `package.json`, `vite.config.js`, `resources/css/app.css`).
- ✓ **run here** — the frontend half: the 13.x skeleton's `package.json` + the files below, `npm install`, `vite build` (Vite 8.3.5, laravel-vite-plugin 3.2.0, Tailwind 4.3.3). The built CSS/JS/fonts were loaded into the page as `@vite` would print them, then audited with `--render` (96/96 contrast checks in light and dark, 0 errors · 0 warnings, Vazirmatn loaded from `/build/assets/`, Alpine tabs switch, 0 requests to other hosts, every control ≥ 44px at 375px).
- ⚠ **not run** — everything that needs PHP: `composer`, `artisan`, Blade compiling `@vite`/`@csrf`/`asset()`/`route()`, the form POST. There is no PHP on the test machine. Steps marked ⚠ below are standard Laravel usage, unverified here.

## 0. Requirements
| Tool | Version | Check |
|---|---|---|
| PHP | ≥ 8.3 (`"php": "^8.3"` in the 13.x skeleton) with ctype, curl, dom, fileinfo, filter, hash, mbstring, openssl, pcre, pdo, session, tokenizer, xml | `php -v` · `php -m` |
| Composer | 2.x | `composer -V` |
| Node.js | `^20.19.0 \|\| >=22.12.0` (Vite 8's `engines`) | `node -v` |

PHP + Composer + the Laravel installer in one step: `php.new` (commands on laravel.com/docs/13.x/installation), or Laravel Herd on Windows/macOS.

## 1. Create the app ⚠
```bash
composer create-project laravel/laravel zabansara
cd zabansara
```
(or `laravel new zabansara` with the installer — pick **no starter kit**.) The default database is SQLite (`database/database.sqlite` is created and migrated); this page needs no database.

## 2. Frontend packages ✓ run here
```bash
npm install
npm install alpinejs @fontsource-variable/vazirmatn
```
Alpine comes from npm (bundled by Vite) instead of a copied `alpine.min.js`; Vazirmatn comes from npm instead of a font CDN, so the page works inside Iran.

## 3. Copy the files
From the folder where web-ui-playbook built the page:

| Copy | To (in the Laravel app) | Note |
|---|---|---|
| `resources/views/landing.blade.php` | `resources/views/landing.blade.php` | its `<head>` must use `@vite` — see step 4 |
| `resources/css/tokens.css`, `resources/css/persian-base.css` | `resources/css/` | `tokens.css` does `@import 'tailwindcss'` |
| `resources/css/brand/palette.css` | `resources/css/brand/palette.css` | from brand-color-system |
| `public/brand/` (whole folder) | `public/brand/` | logo kit from brand-logo-studio (favicons, logos, manifest) |
| `.web-ui-playbook.json` (optional) | project root | lets the audit read stack / language / market |

**Do not copy** `public/build/`, `public/js/`, `public/fonts/` or any `public/index.html` from a standalone preview — Vite now builds the CSS, JS and fonts, and a stray `public/index.html` can be served instead of Laravel.

Then **replace** these three skeleton files:

**`resources/css/app.css`**
```css
/* Self-hosted Vazirmatn from npm (no font CDN — works inside Iran) */
@import '@fontsource-variable/vazirmatn';
/* web-ui-playbook tokens (this file does @import 'tailwindcss'), brand palette, Persian base */
@import './tokens.css';
@import './brand/palette.css';
@import './persian-base.css';

@source '../views';
@source '../../vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php';
@source '../../storage/framework/views/*.php';

@theme {
    --font-sans: 'Vazirmatn Variable', Tahoma, ui-sans-serif, system-ui, sans-serif;
}

/* Motion baseline: hidden-before-reveal only under html.js */
@media (prefers-reduced-motion: no-preference) {
    .js [data-reveal] { opacity: 0; transform: translateY(12px); transition: opacity .3s ease-out, transform .3s ease-out; }
}
@media (prefers-reduced-motion: reduce) {
    .js [data-reveal] { opacity: 0; transition: opacity .2s linear; }
}
.js [data-reveal].is-in { opacity: 1; transform: none; }
```

**`resources/js/app.js`**
```js
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();
```

**`vite.config.js`** — the skeleton's file with its font helper removed. The 13.x skeleton loads `bunny('Instrument Sans')`, which the build downloads from fonts.bunny.net (it then self-hosts it); a build machine inside Iran may not reach that host, and this page does not use Instrument Sans.
```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
```

## 4. The page's `<head>`
A page built as a standalone preview links its CSS, font and Alpine by hand. In Laravel, replace those three tags with one `@vite` line (keep the `html.js` script **before** it):
```blade
<script>document.documentElement.classList.add('js')</script>
@vite(['resources/css/app.css', 'resources/js/app.js'])
<link rel="icon" href="{{ asset('brand/favicon.ico') }}" sizes="32x32">
```
Remove: `<link rel="preload" … vazirmatn….woff2>`, `<link rel="stylesheet" href="{{ asset('build/app.css') }}">`, `<script defer src="{{ asset('js/alpine.min.js') }}">`.

## 5. Routes ⚠
The page posts its form to a named route; Blade throws "Route [placement.store] not defined" until it exists. `routes/web.php`:
```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('landing');
});

// Test stub for the page's form: sending the SMS code is not part of this page.
Route::post('/placement', function (Request $request) {
    $request->validate(['mobile' => ['required', 'string', 'max:20']]);

    return back();
})->name('placement.store');
```
(For a different page: `grep -n "route(" resources/views/*.blade.php` lists the routes it needs.)

## 6. Build and run
```bash
npm run build
php artisan serve
```
Open http://127.0.0.1:8000. For development with hot reload instead: `composer run dev` (⚠ the 13.x skeleton runs `php artisan dev` for this) — the docs give http://localhost:8000.

Windows: `npm run …` fails in a folder whose path contains `&`; there use `node node_modules/vite/bin/vite.js build`.

## 7. Check it
By eye, at a phone width (DevTools device mode, 375px) and on desktop:
1. Persian text is in Vazirmatn (DevTools → Network → Font shows `vazirmatn-arabic-…woff2` from `/build/assets/`).
2. Network panel, reload: **no request to any other host**.
3. «روزهای فرد» switches the timetable (Alpine runs from the bundle).
4. The FAQ rows open; buttons, tabs and the logo are easy to tap.
5. Submit the form with a mobile number: the page reloads without a **419** error (`@csrf` works) — an empty field shows no message (this test stub has no error display).
6. View source: the `<head>` has `<link rel="stylesheet" href="…/build/assets/app-….css">` and `<script type="module" src="…/build/assets/app-….js">` where `@vite` was.

Then the audit on the running site (from the project folder; `<plugin>` is where web-ui-playbook lives):
```bash
node <plugin>/skills/web-ui-playbook/scripts/audit.mjs resources/views --contrast --slop --render http://127.0.0.1:8000/
node <plugin>/skills/web-ui-playbook/scripts/audit.mjs resources/views --release --render http://127.0.0.1:8000/
```
Expected: the first run 0 errors · 0 warnings. `--release` fails with one error per placeholder the owner has not filled yet — that is correct until the real content is in.

## 8. On a production server ⚠
From laravel.com/docs/13.x/deployment:
- Point the web server's document root at **`public/`** (nginx: `root /srv/example.com/public;`), never the project root.
- `storage/` and `bootstrap/cache/` writable by the web server user.
- `.env`: `APP_ENV=production`, **`APP_DEBUG=false`**, `APP_URL=https://your-domain`.
- After each deploy: `php artisan optimize` (caches config, events, routes, views).
- Health check: `/up` returns 200 when the app boots.

Usual deploy commands (standard Composer/npm usage, not from that page):
```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan optimize
```
If npm is slow or blocked from the server, run `npm run build` on another machine and upload `public/build/` — the server only needs PHP.

## 9. Report back
Send the results of step 7 (and any error text). When the page runs on Laravel with these results, the README support matrix changes Laravel from "partly" to "tested" with the date and the PHP/Laravel versions you used.
