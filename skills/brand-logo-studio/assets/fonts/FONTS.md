# Bundled fonts — licenses, Reserved Font Names, sources

All fonts here are **unmodified** files (no subsetting, no instancing, no renaming), so no Reserved Font Name (RFN) clause is triggered. The scripts read them only to draw outlines into logo SVGs; the font files themselves are never copied into a user's project.

**Outlining text from an OFL font into a logo is allowed.** The SIL OFL governs the font *software*; a logo built from glyph outlines is a document made with the font, not a derivative font (OFL 1.1 FAQ — verify before relying for your case). If you ever subset or modify one of these files, the RFN column applies: a modified file must not keep a reserved name.

Downloaded 2026-10-15. Checked: each license file read in full for an RFN clause (the only RFN in the bundled set is Lora's).

| File | Version (name table) | License | Reserved Font Name | Source | sha256 |
|---|---|---|---|---|---|
| Vazirmatn-Bold.ttf | 33.003 | OFL 1.1 (`OFL-Vazirmatn.txt`) | none | npm `vazirmatn@33.0.3` (github.com/rastikerdar/vazirmatn) | `f635fdbea28f265de395ba83b4b1570dcf2f58d13c65469e61903b1c2d2ae723` |
| Vazirmatn-ExtraBold.ttf | 33.003 | OFL 1.1 | none | same | `5181c2e436cf1d5cf1c5631821b43d81881dca040a12c9a442ef5dc0007001cf` |
| Vazirmatn-Black.ttf | 33.003 | OFL 1.1 | none | same | `df4e257be9de1574d11ba2970c69228a7db24174913ff7f776bbf00a9aa5dc1b` |
| Estedad[wght].ttf | 8.5 | OFL 1.1 (`OFL-Estedad.txt`) | none | google/fonts `main/ofl/estedad` (github.com/aminabedi68/Estedad) | `6e745beeeb0cae5eea7f38d3132597089548a622d87997b58944e5b1edfec5a1` |
| Katibeh-Regular.ttf | 1.0010g | OFL 1.1 (`OFL-Katibeh.txt`) | none | google/fonts `main/ofl/katibeh` | `334eeadb58eb442734fe7dea87412cbbd8c3fd00294252723aadf19a850cf11f` |
| NotoNaskhArabic[wght].ttf | 2.021 | OFL 1.1 (`OFL-NotoNaskhArabic.txt`) | none | google/fonts `main/ofl/notonaskharabic` (github.com/notofonts/arabic) | `67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f` |
| Sahel-Bold.ttf | 3.4.0 | OFL 1.1 (`OFL-Sahel.txt`); Latin glyphs from Open Sans under Apache-2.0 (`Apache-2.0.txt`) | none | npm `sahel-font@3.4.0` (github.com/rastikerdar/sahel-font) | `d714fa224c92bc51d0e477337ef69e8818c2eff8f41e6698de35639e3857ae7b` |
| Samim-Bold.ttf | 4.0.5 | OFL 1.1 (`OFL-Samim.txt`); Latin glyphs from Open Sans under Apache-2.0 | none | npm `samim-font@4.0.5` (github.com/rastikerdar/samim-font) | `b14a43607588f1d8f64a9eb7f70b7fc91e52484f6c93c47d0b59ea14aa3a7d79` |
| Shabnam-Bold.ttf | 5.0.0 | OFL 1.1 (`OFL-Shabnam.txt`); Latin glyphs from Roboto under Apache-2.0 | none | npm `shabnam-font@5.0.0` (github.com/rastikerdar/shabnam-font) | `b0429995230d7d01647b97a23fa433e5f9dac995e203f4033d82ffc63b58a11f` |
| Parastoo-Bold.ttf | 2.0.1 | OFL 1.1 (`OFL-Parastoo.txt`); Latin glyphs from Lora (OFL) | none in Parastoo's own license (its Latin part comes from Lora, whose RFN is "Lora") | npm `parastoo-font@2.0.1` (github.com/rastikerdar/parastoo-font) | `25f5eb2039739759a1666ce1a7a1b5dd3f08e6be5b9114f453b52e35aa08b104` |
| Inter[opsz,wght].ttf | 4.001 | OFL 1.1 (`OFL-Inter.txt`) | none | google/fonts `main/ofl/inter` (github.com/rsms/inter) | `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031` |
| PlusJakartaSans[wght].ttf | 2.071 | OFL 1.1 (`OFL-PlusJakartaSans.txt`) | none | google/fonts `main/ofl/plusjakartasans` (github.com/tokotype/PlusJakartaSans) | `89b3fb38aa0d275d7a731d0d817a4f1622b316b4d7fbdedcf02ee9099ff68bc8` |
| Lora[wght].ttf | 3.008 | OFL 1.1 (`OFL-Lora.txt`) | **"Lora"** — bundled unmodified, so allowed; a subset or instance must be renamed | google/fonts `main/ofl/lora` (github.com/cyrealtype/Lora-Cyrillic) | `822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7` |

Sahel, Samim, Shabnam and Parastoo also credit DejaVu/Bitstream Vera in their name tables ("DejaVu changes are in public domain"); their author publishes them under OFL 1.1.

## Why these and not others
Each bundled Persian font passed: full Persian alphabet including پ چ ژ گ, ZWNJ (U+200C) support, correct joining in HarfBuzz compared against Chrome (`scripts/shaping-check.mjs`), and dots detected on the proof sheet.

**Display only — not bundled, verify by hand** (all OFL, from google/fonts): Lalezar, Reem Kufi, Lemonada, Aref Ruqaa, Rakkas. In the 2026-10-15 test they lacked ZWNJ support (so «زبان‌سرا» can join wrongly or show a box), and Aref Ruqaa and Rakkas draw the three dots of پ چ ژ as a caret (^) shape. Reem Kufi's license reserves "Josefin Sans" (its Latin part) and Aref Ruqaa's reserves "EURM10" — never subset or modify them without renaming. Use them only for one word without ZWNJ, at large sizes, after checking the proof sheet.

**Commercial Persian fonts** (e.g. from Fontiran) work too: pass the path of a TTF the user is licensed to use (`--font path/to/font.ttf`). Check that the license covers logo/trademark use. Never use legacy `Mj_`, `B_` or `F_` font packs (broken Unicode mappings, unclear rights).
