# WordPress adapter — block themes, classic themes, WooCommerce basics (Tier 1)

## Verified on
WordPress 7.1.3 · theme.json version 3 · WooCommerce 11.2.1 · WordPress Playground CLI 3.1.58 (PHP 8.3 in WebAssembly, SQLite) — ⏱ checked 2026-10-18/19 against developer.wordpress.org (theme.json v3 reference, typography and color settings, style variations, `get_locale_stylesheet_uri`, `is_rtl`, `wp_style_add_data`, `wp_site_icon`, Playground CLI and blueprint steps), the Gutenberg theme.json schema, `wp-includes/default-filters.php`, developer.woocommerce.com and woocommerce.com docs. **Runtime-tested in WordPress Playground, not on real hosting** (no MySQL, Apache/nginx, object cache or host plugins): test projects #3 (Persian block theme, market Iran) and #3b (Persian classic theme + WooCommerce) — results in the README support matrix.

## Project structure
- **Block theme:** `style.css` (theme header), `theme.json`, `templates/*.html` (`index.html` required; `front-page.html`, `page.html`…), `parts/*.html` (header, footer), optional `patterns/*.php`, `styles/*.json` (style variations), `functions.php`, `assets/`.
- **Classic theme:** `style.css`, `functions.php`, `header.php` (with `<html <?php language_attributes(); ?>>`, `wp_head()`), `footer.php` (`wp_footer()`), `index.php` and template files, optional `rtl.css`.
- A theme is a folder in `wp-content/themes/<slug>/`. Profile: run `detect-stack.mjs` inside the theme folder (it detects block / classic / WooCommerce).

## Where tokens live
- **Block theme:** `generate-palette.mjs --format wordpress --out <theme>` writes `theme.palette.json` (merge its `settings.color` and `styles` into `theme.json`, version 3), `styles/dark.json` (a "Dark" style variation users can pick) and `palette.wp-dark.css`. ⏱ WordPress turns each palette entry into `--wp--preset--color--{slug}` and the classes `has-{slug}-color` / `has-{slug}-background-color`; `theme.json` styles reference presets as `var:preset|color|{slug}`; `styles.elements` has `button`, `link`, `heading` with `:hover` and `:focus-visible`. The text color's slug is `contrast` — a slug named `text` would collide with WordPress's own `has-text-color` marker class.
- ⏱ theme.json has **no automatic light/dark switch**: to follow the visitor's system setting, enqueue `palette.wp-dark.css` after the global styles — `wp_enqueue_style('…', get_theme_file_uri('palette.wp-dark.css'), ['global-styles'])` (the `global-styles` handle exists; tested).
- **Classic theme:** `--format css-variables --out assets/css` → enqueue `palette.vars.css` before `style.css` and use `var(--text)`, `var(--primary)`…

## Components and templates
Build pages from core blocks with the palette classes (`backgroundColor` / `textColor` attributes); templates are HTML files with block comments (`<!-- wp:group {"backgroundColor":"surface"} -->`). Spacing set in the editor is saved as `padding-left`/`padding-right` inline styles — keep both sides equal (direction-neutral; the audit flags only unequal pairs). Specs and states: `components-and-states.md`. Core's table block draws borders on every cell; restyle it with `.wp-block-table table :where(th, td)` (weaker selectors lose against core's — found in testing).

## RTL and i18n
- With a right-to-left site language (Settings → General → Site Language, e.g. `fa_IR`), WordPress prints `<html dir="rtl" lang="fa-IR">` itself — block themes automatically, classic themes through `language_attributes()` (tested in #3 and #3b).
- ⏱ Classic themes: WordPress **loads the theme's `rtl.css` by itself** for RTL languages (`get_locale_stylesheet_uri()` → `<link rel="stylesheet" href="…/rtl.css" media="screen">`, printed **after** the theme's `style.css` in `<head>`) — proven on a running page (test #3b). For enqueued styles, `wp_style_add_data($handle, 'rtl', 'replace')` swaps in `style-rtl.css`; `is_rtl()` for PHP branches.
- Write logical CSS anyway (`margin-inline-start`, `text-align: start`) so most rules need no `rtl.css` — `persian-rtl.md`.
- WooCommerce loads its own `*-rtl.css` files (tested). Its pages were created with **English titles** ("Cart", "Checkout", "Shop", "My account") when WooCommerce was installed before its Persian translation — rename them in Persian (found in testing).

## Fonts (self-hosted)
- **Block theme:** ⏱ `settings.typography.fontFamilies[].fontFace` with `"src": ["file:./assets/fonts/vazirmatn-arabic-wght-normal.woff2"]` (relative to theme.json), `fontWeight: "100 900"`, `fontDisplay: "swap"` and `unicodeRange` (in the schema): WordPress prints the `@font-face` rules itself (tested). Use two faces — Arabic and Latin Vazirmatn subsets — as in test #3.
- **Classic theme:** an enqueued `fonts.css` with `@font-face` and relative `url("../fonts/…")`.
- Never a Google Fonts `<link>` — and check plugins: many add one (the audit reports `render-external` / `render-foreign-ref`).

## Icons and favicons
⏱ `wp_site_icon()` prints the icon (32, 192), apple-touch-icon (180) and tile (270) tags from the Site Icon setting, so a theme ships no `<link>` tags: `export-kit.mjs` with stack `wordpress` writes `wordpress/site-icon-512.png` to upload, `wordpress/functions-snippet.php` (`add_theme_support('custom-logo')` + a `theme-color` meta — core prints none, tested) and a README. Core prints no `og:image` either (tested) — set the share image in the SEO plugin.

## Images
Use the Image block or `wp_get_attachment_image()`, which output `srcset`/`sizes` and dimensions for uploaded images (general practice — ⚠ not re-checked in this test); upload sizes close to the display size. Rules: `performance-and-tech.md` §2.

## Forms
Core has no form block: use a licensed form plugin the owner chooses (for market Iran, one whose spam protection is not Google reCAPTCHA — `iran-network-resilience.md`) or a custom block posting to `admin-post.php` with a nonce (`wp_nonce_field` / `check_admin_referer`). WooCommerce: ⏱ stores created on 8.3 or later get the **Cart and Checkout blocks** by default — confirmed on a fresh 11.2.1 install, even with a classic theme (the empty cart is rendered by JavaScript); classic shortcodes are still supported. Iranian gateways (Shaparak) come as WooCommerce payment plugins — `iran-market.md` §7.

## Motion baseline
Print the `html.js` gate early in `<head>`: `add_action('wp_head', function () { echo "<script>document.documentElement.classList.add('js')</script>\n"; }, 1);` (tested). Reveal styles only under `.js` (`components-and-states.md` §12); enqueue the observer script with `'strategy' => 'defer'`.

## Accessibility specifics
One `<h1>` per template (the post title on singular templates). A paragraph of links in the header needs 44px targets by CSS; WooCommerce's empty-cart "back to shop" link is a plain 26px link — enlarge it from the theme (`.wp-block-woocommerce-empty-cart-block a`) (both found in testing). ⚠ Not verified here: the automatic skip link in block themes and the Navigation block's `aria-expanded` — check them in the theme you build.

## Build and test
- No build step for themes (only for a theme's own JS/CSS). Local runtime without PHP or Docker: ⏱ **WordPress Playground CLI** (Node ≥ 20.18): `npx @wp-playground/cli@latest server --port=9400 --mount-dir "<theme-folder>" "/wordpress/wp-content/themes/<slug>" --blueprint=blueprint.json`, blueprint steps `setSiteLanguage` (`{"language":"fa_IR"}`), `activateTheme` (`{"themeFolderName":"<slug>"}`), `installPlugin` (`{"pluginData":{"resource":"wordpress.org/plugins","slug":"woocommerce"},"options":{"activate":true}}`), `setSiteOptions`. On Windows use `--mount-dir` (not `--mount host:vfs`) and a folder path **without `&`**; the first boot downloads WordPress and the language pack (60–90 s in testing). wp-env needs Docker.
- WooCommerce: ⏱ new stores start in **coming-soon mode** — visitors see a placeholder page (which referenced `ajax.googleapis.com` in testing) until the store is live: WooCommerce → Settings → Site visibility, or the option `woocommerce_coming_soon` = `no` (tested).

## Audit and render recipe
- Source (inside the theme folder; the profile says stack `wordpress`): `node <skill>/scripts/audit.mjs . --contrast --slop`. It reads `.php` templates (only for this stack), block templates and parts, takes colors from `theme.json` presets (`has-*-color` classes) plus the theme's CSS, and treats `<html <?php language_attributes(); ?>>` as setting `lang` and `dir`. Text inside PHP calls (`esc_html_e('…')`), content saved in the database and plugin output are seen only by `--render`.
- Rendered: `--render http://localhost:9400/` (and `/shop/`, `/cart/`…) — the audit proxies the local site, rewrites WordPress's absolute `http://127.0.0.1:9400/…` asset URLs so fonts load same-origin, and reports foreign hosts the page **references** in scripts, styles and media (`render-foreign-ref`) even when this browser did not fetch them; JSON lists of registered `.js`/`.css` files (WordPress still registers prototype.js on ajax.googleapis.com) are not counted.

## Known pitfalls
- **Market Iran: core's emoji fallback** references `s.w.org` (fetched on devices without emoji fonts). Remove it: `remove_action('wp_head', 'print_emoji_detection_script', 7); remove_action('wp_enqueue_scripts', 'wp_enqueue_emoji_styles');` (⏱ hooks from `default-filters.php`; tested — 0 references after).
- Plugins that inject Google Fonts, reCAPTCHA or CDN scripts; a store left in coming-soon mode; WooCommerce pages with English titles.
- A block theme's `style.css` is not loaded on the front end unless the theme enqueues it (⏱ Theme Handbook, "Including assets": its examples enqueue it with `get_stylesheet_uri()`).
- Unequal left/right spacing in block settings; a palette slug named `text`.
- Playground is not hosting: test caching, MySQL and the host's PHP version on the real server before launch.
