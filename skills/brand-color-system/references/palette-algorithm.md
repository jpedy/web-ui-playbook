# Palette algorithm — what generate-palette.mjs does and why

Read this when you need to explain a decision, override one, or change the code. Code: `scripts/palette-engine.mjs` (pure logic), `scripts/color-core.mjs` (math), `scripts/token-pairs.mjs` (the pairs that must pass).

## Contents
1. Why not the usual recipe
2. Step by step
3. Token rules (light and dark)
4. Overrides
5. Common mistakes

---

## 1. Why not the usual recipe
The October 2026 color research report proposed a fixed recipe. Running it showed four problems, so this generator does it differently (all tested on 2026-10-14/15):

| Report claim | What testing showed | What the generator does instead |
|---|---|---|
| "Stops ≥ 500 apart always pass 4.5:1" (e.g. 100 vs 600) | False: gray 100/600 = 4.09:1, 50/600 = 4.46:1; amber 400/900 = 4.48:1 | No "safe pair" table. Every token is **chosen by measuring** contrast, and every pair is re-checked |
| Listed hex + OKLCH pairs | 113 of 199 pairs disagree (e.g. `#1D4ED8` is 0.488 0.217 264.4, not "0.51 0.21 262") | All OKLCH values are computed from hex |
| Generator "anchors" the brand color | The brand hex appeared in none of 5 test scales | The **exact brand hex sits in the scale** at its natural stop |
| Minimum chroma 0.14 for every brand | Turned slate `#64748b` into vivid blue, a dusty rose into saturated red | Peak chroma comes **from the brand itself**; muted brands stay muted |

Its OKLab math and APCA code were correct and match culori / apca-w3 exactly; `color-core.mjs` reproduces them and `selftest.mjs` proves it.

## 2. Step by step
1. **Seed.** `--brand` hex → OKLCH. Without a brand: `--feel` (or `--hue/--chroma/--lightness`) gives a starting color (`industry-feel-lookup.md`).
2. **Lightness curve per hue.** Lightness, relative chroma and hue drift for each of the 11 stops (50…950) are interpolated from Tailwind CSS 4.3.3's own color families (measured 2026-10-15). So a blue brand gets blue-like steps, a yellow brand gets yellow-like steps (lighter mid-tones, darker shades rotating toward amber instead of turning olive).
3. **Anchor.** The stop whose lightness is closest to the brand gets the **exact brand hex**. The other stops' lightness shifts smoothly toward it (full shift at the anchor, none at 50 and 950), so steps stay in order. `--anchor-stop 600` forces a stop.
4. **Chroma.** Peak chroma = brand chroma ÷ the curve's value at the anchor stop (capped at 0.37); each stop = peak × its relative chroma. Then each color is pulled inside sRGB by lowering chroma only (L and H kept). Near-gray brands (C < 0.02) produce a gray scale.
5. **Neutrals ("base").** Tailwind-gray lightness with a faint tint of the brand hue: chroma ≤ 0.018 (cool brands) / 0.012 (warm brands). `--neutral pure|warm|cool` overrides.
6. **Accent.** `--accent` hex is anchored like the brand. Otherwise hue = brand + 180° (complementary, default), + 35° (analogous) or + 150° (split), or the feel's fixed accent; then nudged ≥ 30° away from danger red (27°) and success green (150°).
7. **Status scales.** success 150°, warning 70°, danger 27°, info 250° by default. If the brand or accent hue is within 25°, the status hue moves inside its range (success 135–172, warning 52–88, danger 12–38, info 215–268) to the most distant hue; if still < 20° apart, a warning says icons and words must carry the meaning.
8. **Tokens.** Light and dark tokens are picked by searching the scales for the first shade that passes (section 3).
9. **Checks.** Every pair in `token-pairs.mjs`, both modes, plus: color-vision simulation of status/primary pairs (Machado 2009, full severity), competitor distance (`--market iran`, `--competitor`).

## 3. Token rules (light and dark)
T = 4.5:1 for English, **5.5:1 for Persian** (`--lang fa|both`, house rule). Button labels always use 4.5:1 (they are ≥ 14px semibold in web-ui-playbook's component spec). UI parts (borders, focus) use 3:1.

| Token | Light mode | Dark mode |
|---|---|---|
| `--bg` / `--surface` / `--surface-subtle` | base-50 / white / base-100 | base-950 / base-900 / base-800 |
| `--border` | base-200 (decorative) | base-800 |
| `--border-strong` | first base shade from 400 down with ≥ 3:1 on surface and bg | first from 600 up with ≥ 3:1 |
| `--text` | base-900 | base-100 (not pure white) |
| `--muted` | first base shade from 500 down with ≥ T on bg, surface, surface-subtle | first from 400 up |
| `--primary` + `--primary-fg` | see "button decision" below | first brand shade (from the anchor toward lighter) that is ≥ 3:1 against the dark page and carries a label ≥ 4.5:1; chroma −15% if > 0.18 (less glow) |
| `--primary-hover` | next shade away from the label color (white label → darker), label still passes | same rule |
| `--primary-subtle` | brand-50 | brand-950 |
| `--primary-ink` (links, brand-colored text) | first brand shade ≥ T on bg, surface and primary-subtle | first from 500 up |
| `--brand` | the exact brand hex, always | same |
| `--accent` + `--accent-fg` | accent-500 (or the user's exact accent) with the more readable of white/dark; moves if neither passes | lighter shade, ≥ 3:1 on the dark page |
| `--success/-warning/-danger/-info` | first shade from 500 down with ≥ T on surface, bg and its own subtle bg | first from 400 up |
| `--*-subtle` | 50 | 950 |
| `--focus` | = primary-ink | = primary-ink |

**Button decision (light mode)** — the user's rule: keep the exact brand color; if white text fails, keep it for decoration and choose a safe alternative, and explain.
1. White label on the exact brand ≥ 4.5:1 and the brand is visible on a white card → buttons use the exact brand.
2. Otherwise, if the brand is light (L ≥ 0.65) and a dark label reaches 4.5:1 → buttons keep the exact brand with a dark label (typical for yellow, amber, light teal).
3. Otherwise → buttons use the nearest darker shade where white passes; the exact brand stays in `--brand`. The report offers the alternative (`--on-primary dark`) when a dark label would also work.

A brand too close to white (e.g. `#ffffff`) can't be a button on a white card; the nearest visible shade is used.

## 4. Overrides
| Want | Flag |
|---|---|
| keep the exact brand on buttons with a dark label | `--on-primary dark` |
| always white labels (darker button) | `--on-primary white` |
| a specific accent | `--accent "#f59e0b"` |
| no accent (monochrome) | `--harmony none` |
| pure / warm / cool grays | `--neutral pure|warm|cool` |
| brand at a specific stop | `--anchor-stop 500` |
| stay away from a rival | `--competitor "#ff5722:Rival"` (repeatable), `--market iran` |

After any override, re-read the report: the generator still guarantees every pair, so a forced choice may move other tokens.

## 5. Common mistakes
- Editing hex values in `palette.css` by hand → the guarantees are gone. Re-run the generator with flags instead, then `check-contrast.mjs`.
- Using `text-primary` for links when the report says `text-primary-ink`.
- Using `bg-brand` for buttons because "it's the real brand color" — it may fail with white text; that is why `--primary` exists.
- Changing a scale's middle shade and expecting the others to follow — scales are generated together.
