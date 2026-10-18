/**
 * brand-logo-studio — integrations.mjs
 * How the finished kit plugs into the user's stack: extra files written next to the kit and the install sentence
 * for kit-report.md. The masters, PNGs, favicon.ico/svg and site.webmanifest are the same for every stack.
 *   laravel   head-snippet.blade.php (copy the kit to public/brand/)
 *   static    head-snippet.html (copy the kit to /brand/)
 *   next      next-app/ — files named for Next.js App Router file conventions (⏱ nextjs.org docs, checked 2026-10-18:
 *             favicon.ico only in the top-level app/, icon.svg, apple-icon.png, opengraph-image.png (+ .alt.txt),
 *             manifest.json in the root of app/, theme color through the `viewport` export)
 * Stack comes from the brief ("stack") or the project's .web-ui-playbook.json; unknown → laravel (the original default).
 */
import fs from 'node:fs';
import path from 'node:path';

/** stack → { files(ctx) → [[name, text|Buffer]], install } ; ctx = { c: brief.colors, brief, out } */
export const INTEGRATIONS = {
  laravel: {
    files: ({ c }) => [['head-snippet.blade.php', [
      '{{-- Copy this kit to public/brand/ and paste inside <head> of your layout --}}',
      `<link rel="icon" href="{{ asset('brand/favicon.ico') }}" sizes="32x32">`,
      `<link rel="icon" href="{{ asset('brand/favicon.svg') }}" type="image/svg+xml">`,
      `<link rel="apple-touch-icon" href="{{ asset('brand/png/apple-touch-icon.png') }}">`,
      `<link rel="manifest" href="{{ asset('brand/site.webmanifest') }}">`,
      `<meta name="theme-color" content="${c.primary}">`,
      `<meta property="og:image" content="{{ asset('brand/png/og-image.png') }}">`, ''].join('\n')]],
    install: 'Copy the folder to `public/brand/` in your Laravel project and paste `head-snippet.blade.php` into the `<head>` of your layout.',
  },
  static: {
    files: ({ c, brief }) => [['head-snippet.html', [
      '<!-- Copy this kit to /brand/ next to index.html and paste inside <head> of every page -->',
      '<link rel="icon" href="/brand/favicon.ico" sizes="32x32">',
      '<link rel="icon" href="/brand/favicon.svg" type="image/svg+xml">',
      '<link rel="apple-touch-icon" href="/brand/png/apple-touch-icon.png">',
      '<link rel="manifest" href="/brand/site.webmanifest">',
      `<meta name="theme-color" content="${c.primary}" media="(prefers-color-scheme: light)">`,
      `<meta name="theme-color" content="${c.darkBg}" media="(prefers-color-scheme: dark)">`,
      `<meta property="og:image" content="https://YOUR-DOMAIN/brand/png/og-image.png"> <!-- absolute URL: replace YOUR-DOMAIN -->`,
      `<meta property="og:image:alt" content="${[brief.name.fa, brief.name.en].filter(Boolean).join(' — ')}">`, ''].join('\n')]],
    install: 'Static site: copy the folder to `/brand/` next to `index.html` and paste `head-snippet.html` into the `<head>` of every page (replace YOUR-DOMAIN in the og:image line — it must be an absolute URL).',
  },
  // ⏱ developer.wordpress.org (2026-10-18): wp_site_icon() prints icon 32/192, apple-touch-icon 180 and the 270 tile from
  // the Site Icon setting, so the theme ships no <link> tags — the owner uploads one 512×512 PNG.
  wordpress: {
    files: ({ c, brief, out }) => [
      ['wordpress/site-icon-512.png', fs.readFileSync(path.join(out, 'png', 'icon-512.png'))],
      ['wordpress/functions-snippet.php', [
        '<?php',
        '// Paste into the theme\'s functions.php (classic themes; block themes use the Site Logo block and need none of this).',
        "add_action( 'after_setup_theme', function () {",
        "\tadd_theme_support( 'custom-logo', array( 'height' => 96, 'width' => 320, 'flex-height' => true, 'flex-width' => true ) );",
        '} );',
        '// Theme color for mobile browser chrome (WordPress prints no theme-color by itself).',
        "add_action( 'wp_head', function () {",
        `\techo '<meta name="theme-color" content="${c.primary}" media="(prefers-color-scheme: light)">' . "\\n";`,
        `\techo '<meta name="theme-color" content="${c.darkBg}" media="(prefers-color-scheme: dark)">' . "\\n";`,
        '} );', ''].join('\n')],
      ['wordpress/README.md', [
        `# Brand files for WordPress — ${[brief.name.fa, brief.name.en].filter(Boolean).join(' / ')}`, '',
        '1. **Site Icon (favicon, app icons):** upload `site-icon-512.png` in Appearance → Editor → Site Icon (block themes) or Customizer → Site Identity (classic). WordPress makes the 32, 180, 192 and 270 px sizes and prints their tags itself.',
        '2. **Logo in the header:** block themes — the Site Logo block, upload `svg/logo-h-rtl.svg` (or the PNG `png/logo-light@2x.png` if SVG uploads are not allowed on the site); classic themes — paste `functions-snippet.php` into functions.php, then upload the logo in Customizer → Site Identity and print it with `the_custom_logo()`.',
        '3. **Social share image:** use `png/og-image.png` in your SEO plugin\'s default image setting (WordPress core has no og:image).',
        '4. Dark backgrounds: `svg/*-reversed.svg`.', ''].join('\n')],
    ],
    install: 'WordPress: upload `wordpress/site-icon-512.png` as the Site Icon (WordPress makes the other sizes), use the Site Logo block (block themes) or `wordpress/functions-snippet.php` + `the_custom_logo()` (classic) — steps in `wordpress/README.md`.',
  },
  next: {
    files: ({ c, brief, out }) => {
      const kit = (rel) => fs.readFileSync(path.join(out, rel));
      const name = brief.name.fa || brief.name.en;
      return [
        ['next-app/favicon.ico', kit('favicon.ico')],
        ['next-app/icon.svg', kit('favicon.svg')],
        ['next-app/apple-icon.png', kit('png/apple-touch-icon.png')],
        ['next-app/opengraph-image.png', kit('png/og-image.png')],
        ['next-app/opengraph-image.alt.txt', `${[brief.name.fa, brief.name.en].filter(Boolean).join(' — ')}\n`],
        ['next-app/manifest.json', JSON.stringify({
          name, short_name: name, start_url: '/', display: 'standalone', background_color: c.lightBg, theme_color: c.primary,
          dir: brief.name.fa ? 'rtl' : 'ltr', lang: brief.name.fa ? 'fa' : 'en',
          icons: [{ src: '/brand/png/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/brand/png/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/brand/png/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
        }, null, 2)],
        ['next-app/viewport.ts.txt', [
          '// Paste into the root layout (app/layout.tsx or app/[lang]/layout.tsx) — theme color for browser chrome:',
          "import type { Viewport } from 'next'",
          `export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '${c.primary}' }, { media: '(prefers-color-scheme: dark)', color: '${c.darkBg}' }] }`, ''].join('\n')],
        ['next-app/README.md', [
          '# Brand files for Next.js (App Router)', '',
          '1. Copy the whole kit to `public/brand/` (logos for `<img>`/`next/image`, and the PNGs `manifest.json` points to).',
          '2. Copy every file in this folder except README.md and viewport.ts.txt into the **top-level** `app/` folder (not `app/[lang]/`): Next.js turns `favicon.ico`, `icon.svg`, `apple-icon.png`, `opengraph-image.png` and `manifest.json` into the right `<head>` tags itself — no `<link>` tags by hand.',
          '3. Paste `viewport.ts.txt` into the root layout, and set `metadataBase: new URL(\'https://your-domain\')` in its `metadata` — without it the og:image URL points to localhost (found in testing).',
          '4. Logo in the header: `<Image src="/brand/svg/logo-h-rtl.svg" alt="…" width={…} height={…} priority />` with a fixed height.', ''].join('\n')],
      ];
    },
    install: 'Next.js: copy the folder to `public/brand/`, then copy the files in `next-app/` into the top-level `app/` folder and paste `next-app/viewport.ts.txt` into the root layout (steps in `next-app/README.md`).',
  },
};

// Tier 2 / Tier 3 stacks (web-ui-playbook references/stacks/README.md) get the plain HTML head tags
const AS_STATIC = ['next-pages', 'nuxt', 'vue', 'sveltekit', 'svelte', 'astro', 'react-spa', 'shopify', 'builder'];

export function integrationFor(stack) {
  if (INTEGRATIONS[stack]) return { stack, ...INTEGRATIONS[stack] };
  if (AS_STATIC.includes(stack)) return { stack, ...INTEGRATIONS.static, install: `${INTEGRATIONS.static.install} (${stack}: put the kit in the framework's static folder — public/ or static/ — and the tags in its document head; web-ui-playbook references/stacks/tier2-frameworks.md or builders.md).` };
  return { stack: 'laravel', ...INTEGRATIONS.laravel };
}
