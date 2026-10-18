# Tier 2 — guided stacks (Vue/Nuxt, Svelte/SvelteKit, Astro, React + Vite SPA, Next.js Pages Router)

**Status: guided, not tested.** The design core applies in full (tokens, components, patterns, accessibility, copy, Persian/RTL, Iran). This page only says where things go. There is no test project for these stacks, so never call them "supported" — say "guided". Facts marked ⏱ were checked on 2026-10-18 against the official docs; ⚠ means not checked.

Versions (npm, ⏱ 2026-10-18): nuxt 4.6.2 · @nuxt/fonts 1.0.1 · vue 3.5 · @sveltejs/kit 3.1.0 · svelte 5.57 · astro 7.4.0 · react 19.3 · tailwindcss 4.3.3.

## Common to all
- **Tokens:** Tailwind v4 projects copy `assets/tokens.css` next to their global CSS and use `generate-palette.mjs --format tailwind4`; projects without Tailwind use `--format css-variables`; SCSS projects `--format scss`. Tailwind v4 in any Vite project: the `@tailwindcss/vite` plugin.
- **Fonts:** self-hosted only. For market Iran, a font helper that downloads at **build time** (Nuxt Fonts' remote providers, Astro's remote providers) still needs the build machine to reach the provider — use local files.
- **Icons:** `export-kit.mjs` writes `head-snippet.html` for these stacks; copy the kit into the static folder (`public/` or `static/`) as `/brand/` and put the tags in the document head the way the framework does it.
- **Audit:** source checks read `.vue` / `.svelte` / `.astro` / `.jsx` at **best-effort** level (class strings and text in templates; anything computed is "could not resolve"). The rendered check works as for Tier 1: build, then `--render dist --pages /,…` (static output) or `--render http://localhost:<port>/` (preview server).

## Nuxt 4 (`nuxt`)
- ⏱ Source lives in `app/` by default (`srcDir`): `app/app.vue`, `pages/`, `components/`, `layouts/`, `assets/`; `public/` and `server/` stay at the project root.
- `lang`/`dir`: ⏱ `useHead({ htmlAttrs: { lang: 'fa', dir: 'rtl' } })` (e.g. in `app.vue`) — `useHead` accepts `htmlAttrs`; `app.head` in nuxt.config does not document it.
- Fonts: ⏱ `@nuxt/fonts` serves fonts from your own app (`/_fonts` in dev, `/_nuxt/fonts` in Vite production builds); disable remote providers with `fonts: { providers: { google: false } }` and point families at local files for market Iran.
- Build/preview: `nuxt build` + `nuxt preview` (⚠ command names not re-checked), or `nuxt generate` for a static site.

## Vue + Vite SPA (`vue`)
`index.html` holds `<html lang dir>`; global CSS imported in `src/main`. A client-rendered SPA shows crawlers and slow phones an empty page until JavaScript runs — the no-JS view will be empty by design. Prefer Nuxt (server rendering) for public sites.

## SvelteKit (`sveltekit`) and Svelte + Vite (`svelte`)
- ⏱ `src/app.html` is the page shell (`%sveltekit.head%`, `%sveltekit.body%` placeholders), `src/routes/` the routes, `static/` the files that keep their exact names (favicons, the brand kit).
- `lang`/`dir`: write them in `src/app.html`; for several languages put a placeholder there and replace it in `src/hooks.server.js` with ⏱ `resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) })`.
- Fonts: `@font-face` with files in `static/fonts/` (no framework font API).
- Svelte classes: `class:name={cond}` and `class={expr}` are dynamic → "could not resolve" in the source audit.

## Astro 7 (`astro`)
- ⏱ `fonts` is a top-level config option (added in astro 6.0.0): `fonts: [{ provider: fontProviders.local(), name, cssVariable, options: { variants: [{ src: ['./src/assets/fonts/…woff2'], weight, style }] } }]` + `<Font cssVariable="…" />` from `astro:assets`; files are copied to `_astro/fonts` at build. ⏱ Static files go in `public/`.
- `lang`/`dir` on `<html>` in the layout `.astro` file.
- `class:list={[…]}` string literals are read by the source audit; expressions are not.
- Build: `astro build` → `dist/` → `--render dist --pages /`.

## React + Vite SPA (`react-spa`)
**Warning to give the user once:** client-rendered pages are empty for crawlers and for slow phones until the JavaScript bundle runs — worse SEO and a late first view on slow networks (common in Iran). For a public site use Next.js (Tier 1) or another server-rendering framework; a SPA is fine behind a login. The JSX reader and `--format shadcn` work as for Next.js.

## Next.js Pages Router (`next-pages`)
Use the Next.js adapter (`next.md`) for tokens, fonts (`next/font/local`), images and the audit; differences: global CSS and `<Html lang dir>` live in `pages/_app.tsx` / `pages/_document.tsx` (⚠ not re-checked for Next.js 16), there is no `app/` icon file convention (use the kit's `head-snippet.html` in `_document`), and no Server Functions (use API routes).
