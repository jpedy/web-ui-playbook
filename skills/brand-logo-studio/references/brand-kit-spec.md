# Brand kit specification

## 1. The brief (`brief.json`, in the user's project)
```json
{
  "name": { "fa": "زبان‌سرا", "en": "Zabansara" },
  "tagline": { "fa": "…from the user…", "en": "…" },
  "industry": "education",
  "monogram": "ز",
  "palette": "resources/css/brand/palette.json",
  "fonts": { "fa": "vazirmatn-black", "en": "plus-jakarta-sans:800", "letter": "vazirmatn-black" },
  "tracking": 0,
  "market": "iran"
}
```
| Field | Required | Notes |
|---|---|---|
| `name.fa` / `name.en` | at least one | exactly as the user writes it (copy, don't retype); normalized to Persian letters with each change reported |
| `tagline` | no | **only the user's own words**; used on the OG image. Never invent one |
| `industry` | no | a key of decision-table.md; sets the default recipes and fonts |
| `monogram` | no | defaults to the first letter of the Persian name (else the Latin) |
| `palette` | one of `palette` / `colors` | path (relative to the brief) to `palette.json` from brand-color-system — preferred |
| `colors` | | explicit hexes: `primary` (required), `ink`, `accent`, `onDark`, `accentOnDark`, `onDarkMuted`, `lightBg`, `darkBg` |
| `fonts` | no | font specs (fonts.md) or paths to licensed TTFs; `letter` must be static |
| `tracking` | no | em, Latin only (e.g. 0.05 for an all-caps name) |

Logo colors are derived and checked automatically: icon shapes ≥ 3:1 on the light background, wordmark ink ≥ 4.5:1 on light and dark; a faint brand color is replaced by a darker brand shade *for the logo only* (the exact brand color stays in the palette); the accent keeps its own color on dark when it reads there. Every substitution is reported.

## 2. Files the kit writes (`export-kit.mjs --out public/brand`)
| File | Size | Notes |
|---|---|---|
| `svg/logo-h-rtl.svg` (or `logo-fa-only.svg` / `logo-h-ltr.svg` for one-language names) | vector | primary lockup, outlines only, viewBox, no fixed size |
| `svg/logo-<primary>-reversed.svg`, `svg/logo-mono-black.svg`, `svg/logo-mono-white.svg` | vector | dark backgrounds; one-color print, stamps, engraving |
| `svg/logo-h-ltr.svg`, `svg/logo-stacked.svg`, `svg/logo-stacked-reversed.svg` | vector | bilingual names only |
| `svg/logo-fa-only.svg`, `svg/logo-fa-only-mono-black.svg` | vector | **Persian-only** (legal-iran.md §3) |
| `svg/wordmark-fa.svg`, `svg/wordmark-en.svg` | vector | name only |
| `svg/logo-icon.svg`, `-reversed`, `-mono-black` | vector | icon alone |
| `favicon.svg` | vector | switches to the reversed icon in dark mode (`prefers-color-scheme`) |
| `favicon.ico` | 16, 32, 48 | BMP entries — read by every browser and by Windows |
| `png/favicon-16.png`, `png/favicon-32.png` | 16, 32 | |
| `png/apple-touch-icon.png` | 180 | **opaque** (iOS shows transparency as black), icon at 140 |
| `png/icon-192.png`, `png/icon-512.png` | 192, 512 | web manifest, transparent |
| `png/icon-maskable-512.png` | 512 | opaque; art at 56% so it stays inside the 80% safe circle (checked: farthest ink ≤ 40% of the size from the center) |
| `png/logo-light@2x.png`, `png/logo-dark@2x.png` | 1600 wide | light = transparent; dark = on the dark background |
| `png/og-image.png` | 1200 × 630 | link previews (Telegram, WhatsApp, X, LinkedIn); content inside the central safe area |
| `png/avatar-640.png` | 640 | Instagram, Telegram, WhatsApp, Eitaa, Bale — icon at 60%, survives a circular crop |
| `png/email-signature.png` | 320 × 80 | show at 160 × 40 in HTML email; never SVG in email |
| `site.webmanifest`, `head-snippet.blade.php` | | copy the kit to `public/brand/` and paste the snippet into the `<head>` |
| `brand-sheet.png` | 1920 × 1080 | lockup + clear space, reversed, icon sizes and avatar, colors, type, don'ts |
| `proof/proof-wordmark.png` | 2400 wide | letter-by-letter proof of the Persian name |
| `kit-report.md` | | decisions, colors, validation findings, legal notes, what to check by eye |

Every SVG master is validated (no live text, no images or scripts, no external references, nothing clipped, contrast, one-color survival). `export-kit.mjs` exits 1 if a blocking finding remains.

## 3. Laravel integration
1. Run from the project root: `node <skill>/scripts/export-kit.mjs --brief brief.json --direction C --out public/brand`.
2. Paste `public/brand/head-snippet.blade.php` into the `<head>` of `resources/views/layouts/app.blade.php` (or `@include` it).
3. Header logo: `<img src="{{ asset('brand/svg/logo-h-rtl.svg') }}" alt="زبان‌سرا" class="h-8 w-auto">` — the SVG has no fixed size, so set the height. Dark mode: swap to the reversed file.
4. Commit `public/brand/`. The skill writes nothing into its own folder (the scripts refuse).

## Common mistakes
- Using `logo-light@2x.png` on a dark section (use the reversed SVG).
- A transparent apple-touch-icon (black square on iPhone).
- SVG in an email signature (blocked by most mail clients).
