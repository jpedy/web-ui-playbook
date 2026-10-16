# Persian wordmarks

How a Persian name becomes a correct, outlined wordmark, and how to check it. Source: Version 1.2 logo research report §4–§5 (rewritten), plus this skill's own tests against Chrome.

## 1. Never put live text in a logo [Proven]
`<text font-family="Vazirmatn">` renders with whatever font the viewer has — often disconnected letters, boxes, or reversed order. Every wordmark here is **shaped by HarfBuzz** (the same OpenType engine browsers use) and saved as `<path>` outlines. `validate-render.mjs` fails any SVG with `<text>`.

```bash
node <skill>/scripts/text-to-path.mjs --text "زبان‌سرا" --font vazirmatn-black --out brand-kit/wordmark-fa.svg
```

## 2. Spell it right first [Proven]
`normalizePersian` (run automatically) and the console notes handle:
- Arabic **ي ك ى ة** → Persian **ی ک ی ه**; Arabic-Indic digits ٠–٩ → Persian ۰–۹. Each change is printed — confirm it with the user.
- **ZWNJ (نیم‌فاصله, U+200C)** in compound names: «زبان‌سرا», «شیرینی‌پزی», «می‌خواهم». A plain space where a ZWNJ is meant (`کتاب ها`) prints a warning; a missing ZWNJ (`زبانسرا`) joins letters that must not join — ask the user how the name is written.
- The name comes **from the user, letter by letter**. Never "correct" a brand's spelling yourself.

## 3. Mixed Persian, Latin and digits — bidi runs [Proven]
Shaping a whole mixed string as right-to-left reverses Latin words and numbers («کلاس IELTS ۱۲۳» would show "STLEI" and "۳۲۱"). `bidi.mjs` splits the text into direction runs, shapes each in its own direction, and places them in visual order — a simplified Unicode bidi algorithm for one-line logo strings (no embeddings). The console prints the visual order, e.g. `[ltr: IELTS ۱۲۳] [rtl: کلاس ]`.

`selftest.mjs` checks the run order of «زبان‌سرا», «کلاس IELTS ۱۲۳», «Zabansara 2026», «Shop ایران» and «آموزشگاه «پارس» ۲», and compares «زبان‌سرا», «کلاس IELTS ۱۲۳», «Zabansara» and «شیرینی‌پزی» with Chrome (all ≥ 94% ink overlap on 2026-10-15). For anything more complex (several sentences, nested quotes) do not use a logo — use live HTML text.

## 4. Letter-spacing: always 0 in Persian [Proven]
Tracking breaks the joins between letters. `--tracking` is applied **only to Latin runs**; Persian runs ignore it (the selftest checks this). Make a Persian word longer only by a real kashida (ـ) chosen with the user, at most one or two in a word.

## 5. Make it ownable without breaking letters
Safe, durable moves (report §5):
- **One accent-colored dot** (direction C): the real dot of one letter takes the accent color; letterforms stay untouched. Implemented with `accentDots: 'first'` (the dot(s) of the first letter in reading order).
- A carefully chosen **weight** and **font** (fonts.md), matched to the Latin name.

Moves that need a human designer, not code: reshaping dots into circles or bars, stretching a sarkesh (the top stroke of ک/گ) over neighbouring letters, custom kashida curves. Never join a right-joining letter (ا د ذ ر ز ژ و) to the next letter — it turns into a different letter.

Script styles: modern geometric (Vazirmatn, Estedad) for tech, retail, services; Naskh (Noto Naskh, Parastoo) for education, law, publishing; calligraphic display (Katibeh) for food, culture, heritage at large sizes. **Nastaliq, Shekasteh and Thuluth logotypes must be made by a calligrapher** — no font or code imitates them well.

## 6. Check it — two tests, one by machine and one by eye
1. **Shaping check** — `node <skill>/scripts/shaping-check.mjs --text "…" --font …` renders the outline and the same text in the installed Chrome/Edge with the same font file and compares the ink. `pass` = ≥ 80% overlap and width within ±6%. No browser → `skipped` (exit 0); it never downloads one. Set `CHROME_PATH` to point at a browser, or `CHROME_PATH=none` to skip.
2. **Proof sheet** — `node <skill>/scripts/proof-sheet.mjs --text "…" --font …` writes `proof-wordmark.png`: the wordmark very large, the browser rendering under it, and every letter alone with its Persian name, code point, and **dots found / dots expected**. Some fonts draw two or three dots as one shape, so 1/2 or 1/3 is accepted — look at it.

The proof sheet is the final check. Open it, and ask the user to confirm every letter, dot and join before using the logo.

## Common mistakes
- Typing the name from memory or from a transliteration instead of copying it from the user.
- Using a font without ZWNJ support for a name with ZWNJ (see fonts.md "display only").
- Aligning Persian and Latin by their box bottoms (bilingual-lockups.md §3).
- Trusting the automated check alone — a 95% overlap can still hide one wrong dot.
