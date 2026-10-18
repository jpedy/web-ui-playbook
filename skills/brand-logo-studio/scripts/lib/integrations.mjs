/**
 * brand-logo-studio — integrations.mjs
 * How the finished kit plugs into the user's stack: extra files written next to the kit and the install sentence
 * for kit-report.md. The masters, PNGs, favicon.ico/svg and site.webmanifest are the same for every stack.
 *   laravel   head-snippet.blade.php (copy the kit to public/brand/)
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

export function integrationFor(stack) {
  return INTEGRATIONS[stack] ? { stack, ...INTEGRATIONS[stack] } : { stack: 'laravel', ...INTEGRATIONS.laravel };
}
