# Fonts for logos

Which font to use for the Persian name, the Latin name and the monogram. Licenses, sources and hashes: `assets/fonts/FONTS.md`. List them with `node <skill>/scripts/text-to-path.mjs --list-fonts`.

## 1. Bundled fonts (all OFL 1.1, unmodified, safe to outline into a logo)
| Spec | Script | Character | Good for |
|---|---|---|---|
| `vazirmatn-bold` / `-extrabold` / `-black` | Persian | modern, clear, neutral | tech, services, education — the default; `-black` is the monogram font |
| `estedad:<100–900>` | Persian | geometric, wide, friendly | consumer apps, shops, kids, food |
| `noto-naskh:<400–700>` | Persian | classic Naskh, book-like | education, publishing, formal |
| `parastoo-bold` | Persian | literary Naskh style | law, books, academia |
| `sahel-bold` | Persian | clean sans | clinics, services |
| `samim-bold` | Persian | soft sans | general small business |
| `shabnam-bold` | Persian | geometric sans | modern small business |
| `katibeh` | Persian | calligraphic display, wedge serifs | food, culture, heritage — **large sizes only** |
| `inter:<100–900>` | Latin | neutral grotesk | SaaS, corporate, finance |
| `plus-jakarta-sans:<200–800>` | Latin | friendly geometric | education, startups, consumer |
| `lora:<400–700>` | Latin | warm serif | publishing, heritage, premium, law |

Variable fonts take a weight (`estedad:800`). The **monogram** (R1) needs a **static** font — `vazirmatn-black`, `vazirmatn-extrabold`, `vazirmatn-bold`, or another static TTF — because variable fonts overlap contours and break the cut-out; the script refuses a variable font there.

## 2. Weight [Proven]
Logo wordmarks use **SemiBold (600) to Black (900)**. Light and Regular weights break up when the header logo is 28–36 px tall. Katibeh has one weight; use it only for large display.

## 3. Pairing Persian and Latin
Defaults per industry are in decision-table.md. Rules:
- Same structure: geometric with geometric (Estedad + Plus Jakarta Sans), neutral with neutral (Vazirmatn + Inter), Naskh with serif (Parastoo/Noto Naskh + Lora).
- Matching stem weight (bilingual-lockups.md §2): if the Latin looks heavier, take its weight down 100.
- Latin case: all caps feels formal/institutional (add +0.03–0.08 em tracking); lowercase or title case feels friendly (no tracking).

## 4. Display fonts — not bundled, verify by hand ⏱ (tested 2026-10-15)
Lalezar, Reem Kufi, Lemonada, Aref Ruqaa and Rakkas (OFL, Google Fonts) look tempting for food, culture and cafés, but in the test they lacked ZWNJ support, and Aref Ruqaa and Rakkas draw the three dots of پ چ ژ as a caret (^). Use one only if the user asks, for one word without ZWNJ, downloaded by the user, passed as a file path — and check the proof sheet letter by letter.

## 5. Commercial fonts
A licensed commercial font (e.g. a Fontiran family) can be used by path: `--font "C:/fonts/MyFont-Bold.ttf"` (or `"fonts": {"fa": "<path>"}` in the brief). Ask the user to confirm the license covers logo/trademark use; never bundle or share the file. Avoid legacy `Mj_`, `B_`, `F_` fonts: broken Unicode mappings and unclear rights.

## Common mistakes
- Picking a font from a screenshot of a competitor.
- A Persian font without ZWNJ for a compound name.
- Mixing two Persian fonts in one logo.
