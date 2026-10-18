# Stack adapters — how the design core reaches each stack

The rules (tokens, components, patterns, accessibility, copy, Persian/RTL, Iran) live **once**, in the core reference files. An adapter only says **how** to apply them in one stack: where files go, which API loads fonts, how `lang`/`dir` are set, how to build and audit. An adapter never restates a rule; it links to it.

## 1. The project profile — `.web-ui-playbook.json`
One file in the user's project holds three separate switches. Every script reads it (`audit.mjs`, `generate-palette.mjs`, `export-kit.mjs`); command-line flags override it.

| Field | Values | Switches on |
|---|---|---|
| `stack` (+ `subtype`, `tier`) | see §2 | this adapter, the token format, the logo integration, the audit's CSS folders |
| `languages`, `dir` | `["fa"]`, `["en"]`, `["fa","en"]`; `rtl` / `ltr` | `persian-rtl.md`, `persian-base.css`, Persian copy lists, the 5.5:1 house rule, RTL source checks |
| `market` (+ `marketAssumed`) | `iran` / `global` | `iran-market.md`, `iran-network-resilience.md`, foreign hosts as **errors**, the Iranian brand-color check, Iran legal notes |

- Language rules follow **language**, Iran rules follow **market**. A Persian site for the diaspora is `languages: ["fa"]`, `market: "global"`; an English site for Iranian users is `languages: ["en"]`, `market: "iran"`.
- Create it after the intake: `node <skill>/scripts/detect-stack.mjs <project> --init --market iran|global [--assumed] [--lang fa|en|both] [--stack <s>]`. `--init` refuses to guess the market.
- `marketAssumed: true` means Iran was assumed from a Persian request. Say so to the user in one line ("Assuming the audience is inside Iran — tell me if not.") and change the file when they answer.
- Other fields (`paths.css`, `paths.templates`, `paths.output`, `tailwind`, `detected`) are filled by `--init`; edit `paths` if the project keeps CSS elsewhere.

## 2. Tiers — what each stack gets
| Tier | Stacks (`stack` value) | What the skill provides |
|---|---|---|
| **1 — first-class** | Laravel Blade (`laravel`: Livewire, Inertia, Filament as subtypes) · Next.js App Router (`next`) · WordPress (`wordpress`: block, classic, WooCommerce basics) · static HTML/CSS/JS (`static`) | a full adapter, tokens in the native format, logo integration files, source checks, a render recipe, a test project and selftests. Called **supported** only after its test project passed (README support matrix). |
| **2 — guided** | Vue/Nuxt (`vue`, `nuxt`) · Svelte/SvelteKit (`svelte`, `sveltekit`) · Astro (`astro`) · React + Vite SPA (`react-spa`) · Next.js Pages Router (`next-pages`) | `tier2-frameworks.md`: where tokens and fonts go, `lang`/`dir`, icons, build/preview; source checks at best-effort level; `--render` on the build output works as in Tier 1. No test project. |
| **3 — detect and warn** | Shopify (`shopify`) · Wix, Webflow, Elementor-only, Squarespace, Framer (`builder`) | `builders.md`: which parts apply (design rules, token values to paste, logo files, checks on a locally saved page) and what cannot be done (templates, RTL guarantees, the builder's own foreign requests). No source audit. |

An adapter that is not written yet: follow the core files, tell the user plainly that this stack has no adapter (design rules apply; files, fonts and build steps are their stack's usual ones), and never call it supported.

## 3. Adapter template (every adapter uses these headings; the selftest checks them)
`Verified on` (versions + date + sources) · `Project structure` · `Where tokens live` · `Components and templates` · `RTL and i18n` · `Fonts (self-hosted)` · `Icons and favicons` · `Images` · `Forms` · `Motion baseline` · `Accessibility specifics` · `Build and test` · `Audit and render recipe` · `Known pitfalls`

- Each framework fact carries ⏱ and the date it was checked against the official docs (or the GitHub README / npm page when the docs site was down). A fact that could not be checked is marked **⚠ unverified** — never guessed.
- When the framework's major version moves past "Verified on", re-check the adapter before relying on it.

## 4. Adapters
| File | Stack | Status |
|---|---|---|
| `laravel.md` | Laravel 13 · Blade, Livewire 4, Inertia, Filament 5 | Tier 1 |
