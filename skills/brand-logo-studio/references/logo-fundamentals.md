# Logo fundamentals

What a small-business logo must do, how to find the idea, and where code-built logos stop being good enough.
Sources: the Version 1.2 logo research report (§1, §5, §7, §10) and taste-skill `skills/brandkit/SKILL.md` at commit `f624f37` (cited by line; ideas rewritten, not copied — see `THIRD_PARTY_NOTICES.md` at the plugin root).

## 1. Pick the logo type [Proven]
| Type | Use when | Built here with |
|---|---|---|
| **Combination mark** (icon + name) | Default for a new small business: people learn the icon *through* the name | any recipe + `h-rtl` / `stacked` lockup |
| **Wordmark** (name only) | Short name (≤ 10 letters), the name itself is distinctive | `wordmark-fa` / `wordmark-en`, direction C |
| **Monogram** (initial in a shape) | Long or multi-word name; the app icon / avatar must carry the brand alone | R1 |
| **Emblem / badge** | Institutions, crafts, heritage — when the frame itself means something | R4, R5 |
| **Mascot / illustration** | **Never in code.** Recommend a human illustrator (§6) | — |

A new business almost always needs the combination mark *plus* a Persian-only version (legal-iran.md) *plus* an icon that works alone at 16 px.

## 2. Find the idea before drawing [Proven]
A logo identifies; it does not illustrate everything the business does. Before choosing a recipe, write one sentence for each (adapted from brandkit `SKILL.md` L57–70 "Core principle" and L132–164 "Brand strategy first"):
1. **What is the brand's one promise?** ("Speak English with confidence.")
2. **What is the one metaphor?** (speech, a door opening, a path)
3. **How does the mark show that metaphor?** If you cannot say it in one sentence over the phone, the mark is too complex.

**One metaphor per mark.** A globe + graduation cap + book + torch inside a seal becomes a grey smudge below 64 px (report §5, language-school example). Pick one, or fuse two at most (brandkit L198–200 "use one or combine two maximum").

Ways to turn the idea into a shape (brandkit L198–283, mapped to our recipes):
| Method | Meaning | Recipes |
|---|---|---|
| Initial + meaning | the first letter with one cut, fold or dot that carries the idea | R1 (accent dot), R5 |
| Product action | what the customer *does*: speak, move, protect, connect | R3, R6, R4, R2 |
| Fusion of two ideas | book + speech; shield + check | R3, R4 |
| Negative space | the idea is the cut-out, not the ink | R1, R5, R6 |
| Construction geometry | a clear rule (two squares, rings, a grid) | R2, R7, R8 |

## 3. Tests every mark must pass
| Principle | Test (automated where possible) | Pass |
|---|---|---|
| Simplicity | count shapes (`validate-render.mjs` complexity) + the one-sentence test | ≤ ~12 shapes; describable in one sentence |
| Small sizes | look at the 16 / 32 px renders (`brand-sheet.png`, `*-sizes.png`) | cut-outs still open; the shape still reads |
| One color | `validate-render.mjs` one-color check + `logo-mono-black.svg` by eye | nothing depends on color alone — separations are real gaps |
| Contrast | wordmark ≥ 4.5:1, icon shapes ≥ 3:1 on its background | automated (WCAG exempts logos, but a faint logo is still a bad logo) |
| Distinct | blur the 64 px icon (squint test): it is not a generic blob or a known brand's shape | by eye + similarity search (legal-iran.md §2) |
| Timeless | no gradients, glows, glass, shadows or hairlines needed to define the form | automated: no `<image>`; effects are listed as don'ts |

Passing all automated checks does not make a logo good. Always look at the proof sheet and the brand sheet.

## 4. Geometry rules the recipes follow [Proven]
- 100 × 100 grid for filled marks; whole or half units.
- At most two stroke weights; a secondary detail ≥ half the main stroke.
- Every gap or cut-out ≥ 6% of the icon height (smaller gaps fill in when printed or shown on phone screens).
- Optical centering: a triangle or arrow is shifted toward its point (≈ 1/6 of its width); round shapes overshoot flat ones by 1.5–2.5%.
- Golden-ratio overlays are mostly decoration after the fact [Opinion — report §1 labels it hype]; do not force curves to φ.

## 5. Clichés and things that must never be in a mark
- **Avoid** (report §5; brandkit L184–192): turquoise domes, Persepolis columns or Faravahar on unrelated businesses, saffron-flower clip art, fake "Nastaliq" brush swooshes under Latin text, random lightning bolts, sparkles, random animals, fake luxury crests, glowing purple-blue "AI" gradients, overlapping translucent polygons.
- **R5 (taaq arch) and R8 (shamsa)** only when the subject is related (architecture, hospitality, crafts, heritage) — never as a generic "Iranian" sign.
- **Never** (rejected at registration in Iran — legal-iran.md §3): national flags, state or military emblems, the Red Crescent, sacred words or names (e.g. «الله») used commercially.
- **Never copy** a known logo, its colors or its composition. An unmodified open-source icon (Lucide, Heroicons, Tabler…) is not a logo: it is not distinctive and cannot be owned.

## 6. Honest limits — when to recommend a human designer [Proven]
This skill builds clean geometric marks and correctly shaped wordmarks. It cannot:
1. draw calligraphic logotypes (Nastaliq, Shekasteh, Thuluth, Eslimi monograms) — a calligrapher must;
2. draw mascots or organic illustrations;
3. replace art direction for a large rebrand, packaging system or custom typeface;
4. invent a truly memorable double meaning — it can only execute a clear one.

Say so plainly when the request needs one of these, and point to the price ranges in legal-iran.md §5. A code-built kit is still a good start: the user gets a usable logo today and a precise brief for a designer later.

## Common mistakes
- Starting from a recipe instead of the one-sentence idea.
- Showing ten variations — show **three directions** (A container, B symbol, C wordmark-led) and let the user pick.
- Changing a supplied logo. If the user already has a logo, reuse it as-is and only build the missing files (brandkit L119–128, "build on existing brand").
- Inventing a tagline. Taglines, claims and numbers come from the user.
