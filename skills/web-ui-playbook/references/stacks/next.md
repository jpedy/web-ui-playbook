# Next.js adapter — App Router, TypeScript (Tier 1)

## Verified on
Next.js 16.4.2 (the `create-next-app@16.4.2` scaffold) · React 19.3 · Tailwind CSS 4.3.3 · next-intl 4.14.9 · shadcn 4.22 — ⏱ checked 2026-10-18 against nextjs.org/docs (Font, app icons, manifest, opengraph-image, proxy.js, Internationalization, generateViewport, generateStaticParams), the docs Next.js ships in `node_modules/next/dist/docs/` (accessibility, preventing flash before hydration), next-intl.dev (App Router setup), ui.shadcn.com/docs (theming, RTL) and react.dev (`useActionState`). Tested: production builds of test project #1 (Persian shop, market Iran) and #2 (English SaaS, global) — results in the README support matrix.

## Project structure
- `app/` holds routes: `layout.tsx` (the root layout with `<html>`), `page.tsx`, `globals.css`; locales live under `app/[lang]/`. Shared UI in `components/`, static files in `public/`.
- ⏱ The 16.4 scaffold (`create-next-app --yes`) turns on `cacheComponents: true` and `partialPrefetching` in `next.config.ts`, wires Tailwind through the `@tailwindcss/turbopack` loader (no `postcss.config`), and writes an `AGENTS.md` that points to `node_modules/next/dist/docs/` — the docs for exactly the installed version; read them before using an API you are unsure of. (The manual-install docs use `@tailwindcss/postcss` instead; both work.)
- Server Components by default; add `'use client'` only to the interactive island (menu, carousel, form with state), never to a whole page.

## Where tokens live
- Copy `assets/tokens.css` to `app/tokens.css` and replace the scaffold's `@import "tailwindcss";` in `app/globals.css` with `@import "./tokens.css";` (it already imports Tailwind). Palette: `generate-palette.mjs --format tailwind4 --out app/brand` → `@import "./brand/palette.css";` after the tokens. Persian: copy `assets/persian-base.css` → `app/persian-base.css`, import it last.
- **shadcn/ui projects:** `--format shadcn` writes `palette.shadcn.css` with shadcn's variable names (`--background`, `--primary-foreground`, `--muted-foreground`…, ⏱ OKLCH, `:root` + `.dark`, `@theme inline`); every pair maps onto a pair the generator checked, and it warns when white text on `--destructive` is too faint. Replace the color variables in `globals.css` with its blocks. It also keeps the plugin's `--success`, `--warning`, `--info`, `--primary-ink`, `--brand`.

## Components and templates
- Specs and states: `components-and-states.md`; classes from tokens only. Compose classes with `cn()` (shadcn `lib/utils`) — the audit reads string literals inside `cn()/clsx()/cva()/twMerge()`.
- shadcn/ui ⏱: set `"rtl": true` in `components.json` before adding components — the CLI then writes logical classes (`start-*`/`end-*`), mirrors slide animations and flips supported icons (new styles such as `base-nova`/`radix-nova`); existing components: `npx shadcn migrate rtl <path>`. Calendar, Pagination and Sidebar are **not** converted — fix them by hand (`persian-rtl.md`, mirroring). The direction provider: `npx shadcn add direction`.
- Content, prices and copy render on the server so they exist without JavaScript; interactive state lives in small client components.

## RTL and i18n
- ⏱ Locale routing: `app/[lang]/layout.tsx` is the root layout; redirect bare URLs in **`proxy.ts`** (Next.js 16 renamed `middleware.ts` to `proxy.ts` and its function to `proxy`; codemod `npx @next/codemod@canary middleware-to-proxy .`; proxy does not run with `output: 'export'`).
- Set both attributes in the root layout — the Next.js guide shows `lang` only:
```tsx
export async function generateStaticParams() { return [{ lang: 'fa' }, { lang: 'en' }] } // ≥ 1 param with cacheComponents
export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  return <html lang={lang} dir={lang === 'fa' ? 'rtl' : 'ltr'}><body>{children}</body></html>
}
```
- ⏱ With Cache Components, `generateStaticParams` must return at least one param (an empty array is a build error). Read the locale anywhere on the server with `next/root-params` (`import { lang } from 'next/root-params'`).
- next-intl (optional) ⏱: `src/i18n/routing.ts` (`defineRouting`), `src/proxy.ts` (`createMiddleware(routing)`), `src/i18n/request.ts` (`getRequestConfig`, locale from `next/root-params`), `src/i18n/navigation.ts`; it sets no `dir` — compute it as above. Persian strings live in `messages/fa.json`: run the audit's copy checks on that folder too.

## Fonts (self-hosted)
- Always `next/font/local` with the woff2 files in the repo (`app/fonts/`), one CSS variable per family, mapped in Tailwind (tested in project #1):
```tsx
import localFont from 'next/font/local'
const vazirmatn = localFont({ src: '../fonts/vazirmatn-arabic-wght-normal.woff2', weight: '100 900', variable: '--font-vazirmatn', display: 'swap' })
const inter = localFont({ src: '../fonts/inter-latin-wght-normal.woff2', weight: '100 900', variable: '--font-inter', display: 'swap' })
// <html className={`${vazirmatn.variable} ${inter.variable}`}>
```
```css
/* globals.css, after the tokens: tokens.css already defines --font-fa/--font-sans, so the next/font variables get other names */
@theme inline { --font-fa: var(--font-vazirmatn), Tahoma, ui-sans-serif, sans-serif; --font-sans: var(--font-inter), var(--font-vazirmatn), ui-sans-serif, system-ui, sans-serif; }
```
  Copy the files once from `node_modules/@fontsource-variable/vazirmatn/files/` and `…/inter/files/` (Persian glyphs come from Vazirmatn's Arabic subset, Latin from Inter).
- **Why not `next/font/google`:** ⏱ it downloads the font at **build time** and self-hosts it ("no requests are sent to Google by the browser") — but the build machine and CI must reach Google. For market Iran that build fails or hangs; local files keep builds reproducible and offline everywhere.
- At most 2 families; ⏱ `preload` defaults to true for the routes the font's layout wraps.

## Icons and favicons
⏱ File conventions in the **top-level** `app/`: `favicon.ico` (only there), `icon.svg|png`, `apple-icon.png`, `opengraph-image.png` (+ `opengraph-image.alt.txt`), `manifest.json`; Next.js writes the `<head>` tags. Theme color: `export const viewport: Viewport = { themeColor: … }` (not in `metadata`). Set ⏱ `metadataBase: new URL('https://your-domain')` in the root layout's `metadata` — without it the generated `og:image` URL points to `http://localhost:3000` (found in testing). `export-kit.mjs` with stack `next` writes all of these to `next-app/` (+ README). Icons: one self-hosted SVG set as React components — `components-and-states.md` §9.

## Images
`next/image` with `width`/`height` (or `fill` + a sized parent) and `sizes`; the hero gets `priority`; for market Iran no `remotePatterns` pointing to foreign image hosts. Rules: `performance-and-tech.md` §2.

## Forms
Server Functions (`'use server'`) + ⏱ `useActionState(action, initialState, permalink?)` from `react` (returns `[state, dispatchAction, isPending]`); with a server function the form posts even before JavaScript loads. Keep native `required`/`type`/`inputmode`/`autocomplete` validation and show server errors next to fields with `aria-describedby`. OTP/mobile rules for Iran: `iran-market.md` §2/§6.

## Motion baseline
The `html.js` gate (`components-and-states.md` §12) as an inline script in `<head>` of the root layout — ⏱ an inline `<script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />` runs before first paint (Next.js guide "preventing flash before hydration"); add `suppressHydrationWarning` to `<html>` because the class changes before React hydrates. Reveal styles only under `.js`.

## Accessibility specifics
⏱ Next.js announces client-side route changes using `document.title`, then the `<h1>`, then the path — give every page a unique `title` in `metadata` and one `<h1>`. Client islands handle focus (`aria-expanded`, focus return on close). Never put text only into client state — the no-JS view must show it.

## Build and test
- `npx next build` then `npx next start` (production server, port 3000) — **test the production build**, not only `next dev`.
- Static export (`output: 'export'`, writes `out/`) only for sites without proxy, Server Functions or dynamic routes lacking `generateStaticParams`. Remove the scaffold's `cacheComponents: true` first — with it the build fails with "PPR cannot be enabled in export mode" (found in testing, 16.4.2).
- ⚠ Windows: a folder path containing `&` (e.g. `UI&UX Skill`) breaks every `npm run …` script (cmd.exe splits the path; found in testing); run `node node_modules/next/dist/bin/next build` directly or rename the folder.

## Audit and render recipe
- Source: `node <skill>/scripts/audit.mjs app components --contrast --slop` (+ `messages` for translated copy). The JSX reader sees `className="…"`, `className={'…'}`, template strings without `${}`, and string literals in `cn()/clsx()/cva()/twMerge()`; visible text is only the text between JSX tags. Conditional classes, props from other files and CSS-in-JS are **could not resolve** → `--render`.
- Rendered (production server running): `--render http://localhost:3000/fa` — the audit proxies the local server, measures at 1440/768/375 in light and dark with every other host blocked, and runs the no-JS view. Static export: `--render out --pages /,/about`.
- A server-rendered page counts its initial dynamic classes as applied (they are in the HTML); client-only states (an opened menu) are measured only as shown on load.

## Known pitfalls
- `next/font/google` (the build needs Google) or a Google Fonts `<link>`; remote images from foreign CDNs for market Iran.
- `'use client'` at the top of a page → the no-JS view is empty and the bundle grows.
- `middleware.ts` copied from an old tutorial (Next.js 16: `proxy.ts`); `generateStaticParams` returning `[]` with Cache Components.
- Copied shadcn components with `left-*`/`ml-*` (set `"rtl": true` first); Sidebar/Calendar/Pagination not mirrored.
- Dates or Persian digits formatted only on the client → hydration mismatch; format on the server (`persian-helpers.js`).
