# Persian text and Iranian audiences — color

⏱ Cultural notes and tool availability come from the Oct 2026 color research report (§6, §8) and were **not independently verified** — confirm associations with a few real users from the audience, and check tool access before relying on it.

## Contents
1. Color associations in Iran (tendencies, not rules)
2. The 5.5:1 house rule for small Persian text
3. Persian typography on colored backgrounds
4. Tools and access from inside Iran ⏱
5. Common mistakes

---

## 1. Color associations in Iran (tendencies, not rules)
| Color | Persian name | Associations reported | Practical use |
|---|---|---|---|
| Turquoise | فیروزه‌ای | Iranian craft and architecture (Isfahan domes, Nishapur turquoise), protection, clarity | education, travel, culture, health — the `heritage` feel |
| Lapis / navy | لاجوردی / سرمه‌ای | manuscripts and tilework; seriousness, authority | finance, universities, institutions |
| Pomegranate / madder red | اناری / روناسی | carpets, Yalda, warmth, bazaar | very common in Iranian e-commerce — crowded, check competitors |
| Saffron / gold | زعفرانی / طلایی | hospitality, prosperity | accents, loyalty tiers — never as small text on white |
| Green | سبز | Nowruz renewal; also religious meaning (Sadat, shrines) | fine for fintech, transport, growth; avoid dark ceremonial green + black + calligraphy in commercial or entertainment UI |
| Black | مشکی | mourning (Muharram, Safar, condolence banners) | avoid pure-black page backgrounds in general consumer UI (dark mode uses near-black tints anyway). The report says a major retailer's brand guideline discourages pure black backgrounds — unverified |

These are conventions with real exceptions; explain them to the user as "people may associate…", not as facts about everyone.

## 2. The 5.5:1 house rule for small Persian text
- **What:** Persian text under about 14px (captions, helper text, badges, table cells, links inside body text) should reach **≥ 5.5:1**, above WCAG's 4.5:1.
- **Why:** many Persian letters differ only by dots (ب پ ت ث, ج چ ح خ); at small sizes and low contrast, anti-aliasing merges or drops dots, and Persian counters (ص ط ف ق م ه) are smaller than Latin ones at the same font size.
- **Status:** a **house rule** of this skill (a readability choice) — **not** a WCAG requirement and not a legal standard. The research report presents it as standard practice; no standard says so.
- **Where it's applied:** `generate-palette.mjs --lang fa|both` targets 5.5:1 for all text tokens except button labels (≥ 14px semibold → WCAG 4.5:1). `check-contrast.mjs --fa` and `audit.mjs --contrast` report small Persian text between 4.5:1 and 5.5:1 as a **warning** ("house rule"), not an error.

## 3. Persian typography on colored backgrounds
`[Line-height and tracking: proven, see web-ui-playbook persian-rtl.md; the other values come from the color report — verify visually]`
- **Weight:** no Thin/ExtraLight/Light (100–300) Persian text on colored or dark backgrounds; body 400–500, headings and buttons 600–700.
- **Line-height ≥ 1.75** for body; zero letter-spacing (tracking breaks the joins).
- **Slightly larger than English** for the same role helps (+1px is a common starting point; check visually).
- **Badges and pills:** 12–13px Persian on a saturated pill is the most fragile case — use the generator's `*-subtle` background with the status text color, not white text on a mid-tone.
- **Over images:** always a scrim (`gradients-shadows.md` §3).

## 4. Tools and access from inside Iran ⏱
As reported in Oct 2026 (verify before relying):
- Figma and Adobe web apps are reported as blocked for Iranian IPs (sanctions); some users reach them through anti-sanction DNS or a VPN. Don't make the user's workflow depend on them.
- Client-side web tools (palette generators, contrast checkers) usually work; their paid tiers often can't be paid from Iran.
- npm can be slow or unreachable at times.
- **This skill needs none of them:** the generator, contrast checker and audit run offline with plain Node (no `npm install`, no downloads).

## 5. Common mistakes
- Light gray Persian captions (e.g. `text-gray-400`) — the most common failure in Persian UIs; use `text-muted`.
- Thin Persian weights in dark-mode headers.
- White Persian text on bright yellow, amber or green badges.
- Calling the 5.5:1 house rule "WCAG" to the user or a client.
- A black + green + calligraphy look for a shop or entertainment app (reads as religious or mourning).
