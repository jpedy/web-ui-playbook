# Industry and feel → starting colors

Use when the user has **no brand color yet**, or asks "what colors suit a …". These are starting points, not rules: a real brand color always wins, and standing apart from competitors matters more than matching an industry cliché.

## Contents
1. Feels (the `--feel` presets)
2. Industry → feel
3. Example palettes (generated, verified)
4. Standing apart from competitors
5. Common mistakes

---

## 1. Feels (the `--feel` presets)
The seed lightness and chroma matter more than the hue: soft and low-chroma reads calm, saturated mid-light reads energetic (`color-fundamentals.md` §5).

| `--feel` | Says | Seed (OKLCH) | Accent | Neutrals |
|---|---|---|---|---|
| `trust` | serious, safe, established | navy/cobalt H 255, C 0.15, L 0.48 | complementary amber | cool |
| `calm` | caring, clean, unhurried | teal H 182, C 0.10, L 0.55 | analogous sky/cyan | cool |
| `playful` | friendly, energetic, fun | coral/orange H 35, C 0.19, L 0.64 | split (teal) | warm |
| `premium` | restrained, exclusive | deep plum H 330, C 0.08, L 0.36 | gold H 85 | warm |
| `tech` | modern, precise | indigo H 277, C 0.20, L 0.52 | analogous violet | cool |
| `heritage` | Iranian, cultural, crafted | feroozeh turquoise H 205, C 0.12, L 0.55 | saffron-gold H 88 | cool |
| `minimal` | neutral, content-first | near-black H 260, C 0.02, L 0.25 | blue H 255 | cool |

Hue ranges behind these choices (from the color report §5, which cites Labrecque & Milne and similar work; treat them as tendencies): trustworthy 235–265 or deep teal 160–185; playful 25–55 or 320–350; premium = low chroma (< 0.12) with very dark or gold; calm 145–235 at low chroma; tech 265–295; heritage feroozeh 195–210 or brick 15–30.

## 2. Industry → feel and accent
Pass `--industry` to let the generator choose the accent the usual way for that kind of site (precedence: `--accent` > `--harmony` > `--industry` > the feel). Every derived accent stays ≥ 45° away from error red and success green, so a badge is never mistaken for a message.

| `--industry` | Accent policy | Why |
|---|---|---|
| `education`, `kids`, `food`, `consumer`, `travel`, `culture` | **warm**: saffron-gold (hue 88°); if the brand itself is warm-yellow, its complementary instead | friendly and inviting; far from the status hues (the warning color moves to orange) |
| `finance`, `government`, `health`, `legal` | **restrained**: brand hue + 35°, chroma ≤ 0.07 | trust comes from calm; the accent only marks small highlights |
| `saas` | analogous (brand + 35°) | coherent, technical |
| `ecommerce` | complementary (brand + 180°) | badges and offers must stand out from the brand |
| `luxury` | soft gold (hue 85°, low chroma) | restraint |

These are conventions (general practice — not from research), not rules; a real accent from the user always wins.

| Industry | Usual feel | Notes |
|---|---|---|
| Language school, courses, tutoring | `calm` or `playful` (kids/teens) | avoid red as the main color on quiz/exam screens (it means "error"; see fundamentals §5) |
| Fintech, bank, insurance, payments | `trust` | a deep teal or green also reads safe; status colors must stay distinct from the brand |
| Health, clinic, wellness, therapy | `calm` | low chroma; avoid alarm reds |
| SaaS, developer tool, AI product | `tech` (or `minimal`) | avoid the purple-to-blue "AI gradient" as identity |
| E-commerce, marketplace | `playful` or one strong color | in Iran, red/orange are crowded (Digikala, Divar, Torob, Tapsi) — check `--market iran` |
| Food, delivery, kids' apps | `playful` | dark label on light, warm brand colors |
| Luxury, hotel, jewellery, fashion | `premium` | lots of neutral space, small gold accent |
| Culture, tourism, crafts, universities in Iran | `heritage` | see `persian-iran-color.md` for associations |
| Portfolio, agency, magazine | `minimal` | the work and photos carry the color |
| Government, civic | `trust` + `--neutral pure` | maximum legibility, light mode first |

## 3. Example palettes (generated, verified)
Produced by `generate-palette.mjs --feel <name> --industry <industry> --lang fa` on 2026-10-16; every pair passes in light and dark (Persian house rule on). Re-run instead of copying hex values — results improve when the generator does.

| Feel + industry | Fits | Seed | Button / label | Links (`primary-ink`) | Accent | Dark-mode button |
|---|---|---|---|---|---|---|
| trust + finance | fintech, banking, B2B | `#0e5caf` | `#0e5caf` / `#ffffff` | `#0e5caf` | `#9d99b9` | `#0e5caf` |
| calm + health | health, clinics | `#008476` | `#008476` / `#ffffff` | `#08675e` | `#72adbd` | `#008476` |
| playful + kids | kids, food, consumer | `#e8542f` | `#d83c1a` / `#ffffff` | `#b32f19` | `#e7b400` | `#e8542f` |
| premium + luxury | luxury, hospitality | `#542c51` | `#542c51` / `#ffffff` | `#542c51` | `#d7b775` | `#9f559d` |
| tech + saas | SaaS, dev tools | `#5252d8` | `#5252d8` / `#ffffff` | `#4544bc` | `#b464e0` | `#5252d8` |
| heritage + culture | Iranian culture, travel | `#00818c` | `#00818c` / `#ffffff` | `#0f6670` | `#d9b863` | `#00818c` |
| minimal | portfolio, editorial | `#1c222b` | `#1c222b` / `#ffffff` | `#1c222b` | `#5d8dcb` | `#646c77` |

Note the `playful` row: white text on the seed coral is below 4.5:1, so buttons use a darker coral and the exact seed stays as `--brand` (rule in `palette-algorithm.md` §3).

## 4. Standing apart from competitors
In a crowded market the best color is the one competitors **don't** use:
1. List 3–5 direct competitors and their main colors (ask the user; for Iran, `--market iran` checks the well-known brands in `iran-brand-colors.md` ⏱).
2. The generator warns when the brand is within 25° of hue **and** similar in lightness (≤ 0.12) and chroma (≤ 0.08) to a listed brand. Same category → change the hue ≥ 25° or the lightness clearly. Different category → usually fine.
3. Never copy a competitor's palette, logo colors or color pairing "for inspiration".

## 5. Common mistakes
- Picking the industry default when the main competitor already owns it (another red marketplace in Iran).
- Choosing a feel, then overriding it with a bright saturated color "to pop" — the calm is gone.
- Copying the example hex values instead of running the generator (they are examples, not brand assets).
- Presenting these tendencies as science ("blue = trust"); explain them as conventions.
