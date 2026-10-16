# Bilingual lockups (Persian + Latin)

How the icon, the Persian name and the Latin name are put together (`lockup()` in `scripts/lib/marks.mjs`). Source: Version 1.2 logo research report §5 (rewritten); numbers are starting values — check visually.

## 1. Which layouts the kit contains
| Layout | Visual order (left → right) | Use |
|---|---|---|
| `h-rtl` | Latin · Persian · icon | **Primary for Iran**: the eye starts at the right, on the icon and the Persian name |
| `h-ltr` | icon · Latin · Persian | Export / international pages, Latin-first documents |
| `stacked` | icon, Persian below, Latin below that | Square spaces: avatars, packaging, splash screens |
| `fa-only` | Persian · icon | **Persian-only** — for domestic trademark filing without a commercial card (legal-iran.md §3) and Persian-only pages |
| `wordmark-fa`, `wordmark-en` | name only | Tight spaces, footers, documents |
| `icon` | icon only | Favicons, app icons, avatars; also anything under 24 px tall |

## 2. Sizing [Proven — starting values]
- **Persian nominal size = 1.12 × Latin** (title-case Latin). Persian fonts give vertical room to deep bowls and tall strokes, so the letter bodies look ~15% smaller at the same size. For all-caps Latin use up to 1.20 ×.
- **Stems should match within ±5%**: the Persian alef and the Latin "I"/"l" should look equally heavy. If not, change the Latin weight (e.g. `plus-jakarta-sans:700` instead of `:800`) — never fake-bold an outline.
- **Icon height = 1.4 × the height of the words** in horizontal layouts; the gap between words and icon = 0.28 × icon height; outer padding = 0.1 × icon height.
- **Stacked:** the Latin line is set at ≈ 0.57 × the Persian size and is never wider than the Persian line (scaled down if needed).

## 3. Alignment — one shared baseline [Proven]
All scripts sit on **one baseline**: the Persian writing line (khat-e korsi) on the Latin baseline. **Never align by box bottoms** — deep Persian descenders (ن ی ر و) would push the Persian name up and the lockup looks broken. The lockup code uses each font's baseline (y = 0 from HarfBuzz) for this.

## 4. Spacing and minimum sizes [Proven]
- Clear space: **X = ¼ of the lockup height** free on every side (½ X in tight mobile headers). Shown on `brand-sheet.png`.
- Minimum on screen: bilingual lockup 28 px tall; one-language lockup 24 px; below that, use the icon alone. Icon minimum 16 px.
- A Latin name in all caps may get +0.03 to +0.08 em tracking (`"tracking"` in the brief); lowercase usually needs none. Persian: always 0.

## Common mistakes
- Equal font sizes for both scripts → the Persian name looks weak.
- Putting the Latin name first in an Iran-first layout.
- Tracking applied to the whole lockup (breaks Persian joins).
- No Persian-only file — the owner may not be able to register the bilingual logo.
