# Visual Direction — pick one, then commit

The user has no design background, so **you** choose the direction. Pick exactly one from the table below, state it in one sentence ("Direction: Playful EdTech — friendly, bright turquoise, rounded, illustrated"), and apply its values everywhere from hero to footer. A single defended direction beats a mix of trends `[Proven, report B §1]`.

Values not taken from the reports are general practice and marked as such.

## Contents
1. The 8 directions (values)
2. Building a palette from one brand color
3. Dark mode
4. Font pairing (English and Persian)
5. Imagery, illustration, icons
6. Generic-page tells (→ anti-generic.md)

---

## 1. The 8 directions

| # | Direction | Use for | Avoid for | Reference sites (see examples files) |
|---|---|---|---|---|
| 1 | **Calm SaaS** | B2B SaaS marketing, startup sites, product sites | luxury, kids | Linear (light parts), Vercel, Clerk, Cal.com, PayPing |
| 2 | **Dense Pro Tool** | dashboards, admin panels, CRM, internal tools | marketing pages | Linear app, Attio, Retool, Dub.co, Didar CRM |
| 3 | **Trust / Fintech** | banking, payments, insurance, government, healthcare, legal | playful brands | Stripe, Wise, BluBank, ZarinPal, Azki |
| 4 | **Warm Consumer** | lifestyle shops, crafts, food, cosmetics, handmade goods | developer tools | Aesop, Basalam, Khanoumi, Allbirds |
| 5 | **Playful EdTech** | language schools, course platforms, kids/teen education, gamified apps | finance, enterprise | Duolingo, Brilliant, Sabzlearn, Filimo School |
| 6 | **Editorial** | blogs, magazines, docs, long reading, publishers | dense apps | Virgool, Stripe Press, NYT, The Pudding, Roocket |
| 7 | **Bold Campaign** | product launches, seasonal campaigns, events, single-offer pages | daily-use apps | Apple product pages, Tapsi campaigns, Digikala seasonal landings |
| 8 | **Dark Developer** | tools whose audience is developers (APIs, CLIs, infrastructure) | general public, Persian consumer sites | Linear, Vercel, Resend, Supabase |

### Values per direction
Radius: sm/md/lg. Density: control height and card padding. "Signature" is the one memorable detail to add — no more than one.

| # | Base colors | Radius | Shadow vs border | Density | Motion | Signature detail |
|---|---|---|---|---|---|---|
| 1 Calm SaaS | white/`#FAFAFA` bg, slate neutrals, one blue or indigo primary, ≤1 accent | 6/8/12 | 1px borders, `sm` shadow only on raised cards | buttons 40px, cards p-6 | 150–200ms, subtle | live product UI in the hero instead of a screenshot; 1px hairline grid |
| 2 Dense Pro Tool | neutral grays, primary only for actions and selection, status colors for pills | 4/6/8 | borders only | rows 36–40px, controls 32–36px, 13–14px text | ≤150ms, no decorative motion | keyboard hints (`<kbd>`), Cmd/Ctrl+K palette |
| 3 Trust / Fintech | white surfaces, deep navy or teal primary, green success, generous whitespace | 8/10/16 | soft `sm`/`md` shadows | buttons 44–48px | restrained | big clear numbers (balances, amounts) with `tabular-nums`; security microcopy next to sensitive fields |
| 4 Warm Consumer | warm off-white bg (≈ `#FFFDF7`), earthy or terracotta accent, dark brown-gray text | 4/8/12 or 0 (luxury) | almost none; photography carries depth | airy, big images | slow fades 250–300ms | sensory attribute strips instead of star ratings (Aesop) |
| 5 Playful EdTech | white bg, one saturated friendly primary (turquoise/teal/green), one warm accent (yellow/orange) for highlights | 10/12/20 | "chunky" buttons: `border-b-4` darker shade that compresses on `:active` | buttons 44–48px | bouncy but ≤250ms, motion-reduce honored | progress bars, streaks, illustrated mascots/spot illustrations |
| 6 Editorial | white or paper `#FCFBF8`, near-black text, one link color | 0–6 | none | 65ch column, 18–20px body (EN) | almost none | strong headline hierarchy, pull quotes, reading-time badges |
| 7 Bold Campaign | 1 strong brand color at large scale + black/white, high contrast | 0/8/24 (pick one) | none | huge type (display 56–72px+) | scroll reveals, ≤1 hero animation, reduced-motion fallback | one oversized number or headline; countdown only if the offer is real |
| 8 Dark Developer | near-black bg (≈ `#08090A`–`#0B0F14`), `white/10` borders, one emerald/blue accent | 6/8/12 | borders + faint top glow | medium | 120–200ms | code snippet + rendered output side by side |

### Default dials per direction (plain words — meaning in `anti-generic.md` §4)
| Direction | Variance | Motion | Density |
|---|---|---|---|
| 1 Calm SaaS | balanced | subtle | balanced |
| 2 Dense Pro Tool | calm | still | dense |
| 3 Trust / Fintech | calm | subtle | balanced |
| 4 Warm Consumer | balanced | subtle | airy |
| 5 Playful EdTech | balanced | subtle (lively only on non-Iran audiences) | balanced |
| 6 Editorial | bold (type) | still | airy |
| 7 Bold Campaign | bold | lively | airy |
| 8 Dark Developer | balanced | subtle | balanced |

Write the chosen values into the user's `docs/design-commitment.md` (`anti-generic.md` §3).

**Choosing when unsure:**
- Persian consumer site → 3, 4 or 5.
- Any app or dashboard → 2.
- Language school → 5.
- Corporate → 1 or 3.
- Blog → 6.

Default to **light mode first** for Persian and Iranian consumer audiences and for regulated sectors. *(Report B: "regulated → high-contrast light-first".)*

## 2. Building a palette from one brand color
Use the **brand-color-system** skill (same plugin) — don't build ramps by hand. It keeps the user's exact brand color, builds Tailwind-like scales in OKLCH, chooses every token by measured contrast (light and dark), and writes a `palette.css` that drops in after `assets/tokens.css`:
```bash
node <brand-color-system>/scripts/generate-palette.mjs --brand "#0f766e" [--lang fa --market iran] --out resources/css/brand
node <brand-color-system>/scripts/generate-palette.mjs --feel calm --out resources/css/brand   # no brand color yet
```
What it decides for you (and explains in plain words):
- **Brand hue when there is none:** from the direction — trust/fintech = navy/cobalt, Playful EdTech = teal/turquoise (also an Iranian heritage color), Warm Consumer = coral/terracotta, Calm SaaS = blue or indigo (avoid the purple-to-blue cliché).
- **Buttons:** the exact brand color if white text passes; otherwise a dark label or a darker shade, with the exact color kept as `--brand` for logo and illustrations.
- **Links and brand-colored text:** `text-primary-ink` (always readable); labels on buttons: `text-primary-fg`.
- **Neutrals:** grays with a faint brand tint. **Status colors:** fixed hues, moved away from the brand hue if they clash; always shown with an icon and a word.
- **Proportion:** about 60% neutral surfaces, 30% secondary surfaces and text, ≤ 10% primary/accent. The primary color marks *actions*; if everything is blue, nothing is clickable.

Then verify pages with `scripts/audit.mjs … --contrast` (§ step 6 of SKILL.md).

## 3. Dark mode
- Background is never pure `#000`: use ≈ `oklch(0.17–0.20 0.01–0.02 H)` (e.g. `#0B0F17`).
- **Elevation = lighter surface:** each level adds about +0.03–0.05 L. Use 1px `white/8–12%` borders instead of shadows.
- **Body text:** ≈ `#E5E7EB`, not pure white (reduces glare). Muted text ≈ `#9CA3AF`, which passes on a dark background.
- **Primary in dark mode:** raise L to about 0.68–0.72 and switch `primary-fg` to dark text if white fails 4.5:1.
- Desaturate large color areas by ~10–20%.
- **Implementation:**
  - Use semantic CSS variables redefined under `.dark` (already set up in `assets/tokens.css`).
  - Follow `prefers-color-scheme` on first visit and store the user's choice in `localStorage`.
  - Set the class before first paint with a tiny inline script in `<head>`, to avoid a white flash.
- Test both modes. A template that only works in light mode is unfinished `[Proven, report E red flags]`.

## 4. Font pairing
All the fonts below are free (SIL OFL) and must be **self-hosted** (npm `@fontsource-variable/*`, or woff2 files in `public/fonts`). Never use a Google Fonts or Bunny Fonts `<link>` — see `iran-network-resilience.md`.

| Need | English | Persian (same role) |
|---|---|---|
| Neutral UI / SaaS (default) | **Inter** | **Vazirmatn** |
| Technical / developer | Geist or IBM Plex Sans + JetBrains Mono | Vazirmatn |
| Friendly / EdTech / consumer | Plus Jakarta Sans, DM Sans or Manrope | Vazirmatn or **Estedad** (wider, geometric) |
| Editorial / reading | Source Serif 4 or Fraunces (headings) + Inter (UI) | Vazirmatn body; headings Estedad or a licensed display face |
| Trust / fintech | Inter or IBM Plex Sans | Vazirmatn; IRANSansX if licensed |

**Bilingual pages:**
- Vazirmatn ships Roboto-harmonized Latin glyphs. That's fine for occasional English words.
- When English is substantial (an English-learning site, a bilingual UI), put the Latin font first and Vazirmatn after it in `font-family`. The browser takes Latin glyphs from the Latin font and falls through to Vazirmatn for Persian.
- Alternatively, use Vazirmatn's "NL" (non-Latin) build with a Latin font.
- Mark English fragments `lang="en"` so screen readers switch voices.

**Commercial Persian fonts:** IRANSansX, Yekan Bakh, Dana, Peyda, Morabba (Fontiran). Use them only if the user owns a domain license — see `resources-templates.md` §5.

## 5. Imagery, illustration, icons
- **Photos:**
  - Real (product, team, classroom) beats stock.
  - One consistent treatment: same aspect ratios (16:9 hero, 4:3 or 1:1 cards), same color grading.
  - Always set `width`/`height` or `aspect-ratio`.
- **Persian/Iran sites:** people imagery must follow domestic modesty rules for eNamad/Shaparak compliance. Western stock photos often fail. `(⏱ as of Oct 2026 report — verify before relying)`
- **Illustrations:** one style per site (flat, line or 3D, never mixed). Spot illustrations work well for empty states and EdTech. Don't use cartoon illustrations in Trust/Fintech heroes.
- **No images available?** Use solid color blocks with an icon, simple inline SVG shapes, or a real UI mock built in HTML. Never use hot-linked stock URLs.
- **Icons:**
  - One set: Lucide, Heroicons, Tabler or Phosphor. Installed through npm and inlined as SVG, or via a Blade icon package.
  - No icon fonts from a CDN, and **no emoji as UI icons**.
  - Decorative icons get `aria-hidden="true"`; icon-only buttons get `aria-label`.
- **Placeholders:** never ship lorem ipsum or "John Doe". Write real copy in the page's language from what the owner told you (microcopy rules: `persian-rtl.md` §13); where a fact, number, quote or photo is missing, show a visible PLACEHOLDER — never an invented "realistic" one (`anti-generic.md` §2).

## 6. Generic-page tells → `anti-generic.md`
The anti-slop list moved to `anti-generic.md` §5 (one registry, merged with the taste-layer rules; `audit.mjs --slop` checks the objective ones). The short version: say the concrete outcome ("English classes for adults, online, from ۱٬۹۰۰٬۰۰۰ تومان per month", not "Unlock the power of…"), use only the owner's real proof, and give the page one signature detail from the client's own world.
