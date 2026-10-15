# Color fundamentals for UI

Enough theory to explain a palette to a non-designer in plain words. Facts tested by script are marked "(verified)".

## Contents
1. Why OKLCH (and not HSL)
2. Gamut — why some colors can't exist on screen
3. Proportion: 60-30-10
4. Harmony that works in interfaces
5. Color psychology: what holds up and what doesn't
6. CSS color features and browser support ⏱
7. Common mistakes

---

## 1. Why OKLCH (and not HSL)
`oklch(L C H)` describes a color the way people see it `[Proven]`:
- **L — lightness**, 0 (black) to 1 (white). Two colors with the same L look about equally light, whatever their hue. This is what makes contrast predictable.
- **C — chroma**, how colorful (0 = gray; screen colors stay below ≈ 0.37).
- **H — hue angle** in degrees: ≈ 25 red, 70 amber, 95 yellow, 150 green, 185 teal, 255 blue, 290 violet, 330 pink.

HSL's "lightness" is arithmetic, not perception: pure yellow and pure blue are both `hsl(… 50%)` but yellow looks far lighter (OKLCH L ≈ 0.97 vs ≈ 0.45). Changing HSL values therefore breaks contrast. Tailwind CSS v4 defines its whole palette in OKLCH (verified in tailwindcss 4.3.3, Oct 2026).

Plain-words version for the user: "I build colors by how light they *look*, so text stays readable on every shade."

## 2. Gamut — why some colors can't exist on screen
A normal (sRGB) screen can't show every L/C/H combination. The maximum chroma depends on hue and lightness: yellows are most colorful when light (L ≈ 0.85–0.95), blues when darker (L ≈ 0.45–0.55). The generator keeps L and H fixed and lowers C until the color fits (binary search) — never clipping RGB channels, which shifts hue. (Verified against culori's `clampChroma`.)

Wide-gamut (Display P3) colors look more vivid on new phones but turn into a different, clipped color on older screens. The generator outputs sRGB-safe values on purpose: what you check is what everyone sees.

## 3. Proportion: 60-30-10
A practical rule against "rainbow UI" `[Proven]`:
- **~60%** neutral surfaces (page background, cards).
- **~30%** structure: text, borders, secondary surfaces, subtle brand tints.
- **≤ 10%** strong color: the primary button, active nav item, focus ring, a badge.

If the primary color floods the page, the button no longer stands out and nothing looks clickable. Tell the user: "Most of the page stays calm so the one important button pops."

## 4. Harmony that works in interfaces
Painter's color wheels exaggerate some hue distances; in UI, harmony is about **roles**, not equal amounts `[Proven]`:

| Scheme | Hue relation | Use | Watch out |
|---|---|---|---|
| Monochrome | brand hue + tinted grays | dashboards, docs, calm SaaS | needs a clear action color |
| Analogous | brand ± 30–40° | calm, education, health | accent may be too similar to stand out |
| Complementary | brand + 180° | the 10% accent (e.g. amber on navy) | never equal amounts of both |
| Split | brand + 150° / 210° | consumer, playful | keep one of them small |
| Triadic | ± 120° | charts, kids' categories | not for UI chrome |

The generator picks the accent from `--harmony` (default complementary) and then nudges it ≥ 30° away from "error red" and "success green" so an accent never reads as a status message. Status colors keep their usual hues; if the brand itself is red or green, the generator moves the clashing status hue within its range and warns that icons and words must carry the meaning.

## 5. Color psychology: what holds up and what doesn't
- **Lightness and chroma move feelings more than hue.** Soft, light, low-chroma colors read calm; saturated mid-light colors read energetic `[Proven, color report §5 citing Elliot & Maier; Wilms & Oberfeld]`.
- **"Blue = trust" is not a law.** Trust comes from consistency and fit with the category; navy, deep teal and charcoal all read serious `[Proven that it is context-dependent]`.
- **"Red makes people hungry / buy" is a myth** as a universal rule `[Myth]`.
- **Red and test performance:** some studies found red before an exam lowered scores (Elliot et al.); replications are mixed — treat as *contested*, but avoid red as the main color of quiz/exam screens anyway (it also means "error").
- **No universal "best converting button color"** `[Myth]`. What converts is contrast with the surroundings (the button is the only strongly colored thing) and clarity of the label.

## 6. CSS color features and browser support ⏱
Checked 2026-10-15 against MDN browser-compat-data — verify before relying.

| Feature | Use | Support |
|---|---|---|
| `oklch()` | write tokens | Chrome 111, Firefox 113, Safari 15.4 — safe |
| `color-mix(in oklch, …)` | hover/alpha tints | Chrome 111, Firefox 113, Safari 16.2 — safe |
| `light-dark(a, b)` | one declaration for both modes (needs `color-scheme: light dark`) | Chrome 123, Firefox 120, Safari 17.5 — safe for most audiences |
| Relative color `oklch(from var(--x) calc(l - 0.08) c h)` | derived states | newer; keep a fallback |
| `contrast-color()` | automatic black/white text | Chrome 147, Firefox 146, Safari 26 — new in 2026. Picks only black or white and knows nothing about the Persian house rule. Prefer the generator's fixed `--primary-fg`; if you use it, wrap it in `@supports (color: contrast-color(red))` |

Iranian users often run older Android phones and browsers; prefer the plain `oklch()` values the generator writes over cutting-edge functions.

Tailwind v4 palettes: v4 rebuilt the palette in OKLCH; the tinted neutrals **mauve, olive, mist, taupe** are present in tailwindcss 4.3.3 (checked 2026-10-15; the research report says they arrived in v4.2, Feb 2026). ⏱

## 7. Common mistakes
- Choosing colors in HSL and "darkening by 10%" → uneven contrast. Use the generator.
- Treating a wide-gamut swatch from a design app as the brand color → looks different on most screens. Use the sRGB hex.
- Using the accent as a second button color → two competing actions.
- Explaining colors with myths ("blue builds trust") instead of the real reason (contrast, consistency, category fit).
