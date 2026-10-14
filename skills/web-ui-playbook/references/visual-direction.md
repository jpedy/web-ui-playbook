# Visual Direction — pick one, then commit

The user has no design background, so **you** choose the direction. Pick exactly one from the table below, state it in one sentence ("Direction: Playful EdTech — friendly, bright turquoise, rounded, illustrated"), and apply its values everywhere from hero to footer. A single defended direction beats a mix of trends `[Proven, report B §1]`.

Values not taken from the reports are general practice and marked as such.

## Contents
1. The 8 directions (values)
2. Building a palette from one brand color
3. Dark mode
4. Font pairing (English and Persian)
5. Imagery, illustration, icons
6. Anti-"AI slop" list

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

**Choosing when unsure:**
- Persian consumer site → 3, 4 or 5.
- Any app or dashboard → 2.
- Language school → 5.
- Corporate → 1 or 3.
- Blog → 6.

Default to **light mode first** for Persian and Iranian consumer audiences and for regulated sectors. *(Report B: "regulated → high-contrast light-first".)*

## 2. Building a palette from one brand color
(General practice, aligned with report B's oklch guidance.)

1. **Take one brand hue.** If the user has no brand color, pick it from the direction: blue 255–265 (trust/SaaS), teal/turquoise 190–200 (education, travel; turquoise also has Iranian heritage associations per report C), green 150 (finance, settlement), terracotta 40 (warm), violet 290 (creative — avoid the cliché purple-to-blue gradient).
2. **Make a 10-step ramp in `oklch(L C H)`:**
   - Keep H fixed.
   - L: 0.97, 0.93, 0.87, 0.78, 0.68, 0.58 (≈500), 0.50 (≈600), 0.43 (≈700), 0.36 (≈800), 0.27 (≈900).
   - C: lowest at the ends (≈0.02–0.05) and highest in the middle (≈0.14–0.22). Lower it if the color looks neon.
3. **Make a neutral ramp:** same hue, chroma 0.005–0.02 (tinted grays feel designed; pure grays feel default).
4. **Map to semantic tokens:**
   - `primary` = step 600 (white text must reach ≥ 4.5:1; if not, use 700)
   - `primary-hover` = 700
   - `primary-subtle` = 50–100
   - `text` = neutral 900
   - `text-muted` = neutral 600
   - `border` = neutral 200
   - `surface-subtle` = neutral 50
5. **Status colors are fixed and do not follow the brand hue:**
   - success = green-700 `#15803D`
   - warning = amber-700 `#B45309`
   - danger = red-600 `#DC2626`
   - info = blue-600 `#2563EB`
   - Use their 50-step tints as pill backgrounds.
6. **Proportion:** about 60% neutral surfaces, 30% secondary surfaces and text, ≤10% primary/accent. The primary color marks *actions*; if everything is blue, nothing is clickable.
7. **Verify every text/background pair** against `design-foundations.md` §3 before building.

**Ready-made primaries** (white text passes 4.5:1):
- blue `#2563EB`
- indigo `#4F46E5`
- teal `#0F766E`
- turquoise-dark `#0E7490`
- green `#15803D`
- terracotta `#C2410C`
- navy `#1E3A8A`

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
- **Placeholders:** never ship lorem ipsum or "John Doe". Write realistic copy in the page's language (Persian copy for Persian pages — see the microcopy rules in `persian-rtl.md` §13).

## 6. Anti-"AI slop" list — remove on sight
(Report B §8/§12 plus general practice.)
- Purple-to-blue neon gradients, glowing orbs and generic "AI" sparkle icons with no reason.
- Random radii (4px button inside a 24px card with no padding math), random spacing, 3+ shadow styles.
- 45 hardcoded hex colors instead of tokens; gray-400 body text.
- Emoji as icons; mixed icon sets.
- Vague hero copy: "Unlock the power of…", "Revolutionize your workflow", "Learn More" ghost buttons. Say the concrete outcome: "English classes for adults, online, from ۱٬۹۰۰٬۰۰۰ تومان per month".
- Fake social proof (made-up logos, "Trusted by 10,000+" without a source). Use real data or clearly mark placeholders for the user to fill.
- Centered body paragraphs longer than 2 lines; centered table text.
- Everything is a card in a card in a card.
- Hero carousels and auto-playing background video.
- Glassmorphism text on busy images without a solid tint (needs `rgba(255,255,255,.85)` or `rgba(0,0,0,.6)` behind it).
- Identical three-column "feature" icons-and-text rows repeated three times down the page.
