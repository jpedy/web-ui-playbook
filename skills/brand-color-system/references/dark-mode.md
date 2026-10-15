# Dark mode

The generator writes dark values for every token (`.dark { … }` in `palette.css`) and checks them like the light ones. This file explains the choices and how to judge the result.

## Contents
1. Why inverting the light palette fails
2. What the generator does
3. Implementation (Laravel + Tailwind v4)
4. Checking dark mode
5. Common mistakes

---

## 1. Why inverting the light palette fails
`[Proven, color report §4; general practice]`
- **Shadows vanish on dark pages.** Depth comes from **lighter surfaces** instead: page < card < popover.
- **Saturated colors glow** (halation) on near-black and look blurry, especially thin text.
- **Pure white text on pure black** is harsh for long reading; pure `#000` backgrounds also smear on OLED screens when scrolling.
- **The light-mode button shade often sinks** into a dark page (a mid-dark teal on near-black) — it needs a lighter shade.

## 2. What the generator does
| Element | Dark choice | Why |
|---|---|---|
| Page / card / raised | base-950 / base-900 / base-800 (L ≈ 0.13 / 0.21 / 0.28) | elevation = lighter; never `#000` |
| Text | base-100 (≈ L 0.97, slightly tinted) | not pure white |
| Muted text | first base shade from 400 upward that passes T (4.5:1, or 5.5:1 Persian) on page, card and raised | measured, not guessed |
| Borders | base-800 hairlines; input borders ≥ 3:1 | WCAG 1.4.11 for inputs |
| Button | exact brand if it stands out (≥ 3:1 vs page) and carries a label; otherwise the nearest lighter shade; chroma −15% when > 0.18 | visible, not glowing |
| Links / focus | first brand shade from 500 up passing T on page, card and selected background | readable small text |
| Status | light shades (≈ 300–400) on 950 tints | readable on dark |

APCA Lc values in the report (negative numbers = light text on dark) are informational. Dark pairs that pass WCAG 2.2 can still feel weak below about Lc 60 for body text — if dark muted text looks faint in the preview, say so and offer a lighter muted shade.

## 3. Implementation (Laravel + Tailwind v4)
web-ui-playbook's `assets/tokens.css` already has `@custom-variant dark (&:where(.dark, .dark *));` and the before-paint script in its footer (no white flash). With `palette.css` imported after it:
- Templates use semantic classes only — they switch automatically. `dark:` utilities are needed only for rare exceptions (an illustration, a photo overlay).
- Respect the system setting on first visit, remember the user's choice (`localStorage`), offer a toggle in the header or settings.
- Alternative for simple sites: `light-dark()` in CSS variables with `color-scheme: light dark` (support ⏱ in `color-fundamentals.md` §6). The generator's class-based output works everywhere and is easier to audit.

## 4. Checking dark mode
1. `check-contrast.mjs palette.css` checks every dark pair; `audit.mjs --contrast` checks pages in both modes (it evaluates `dark:` classes).
2. Look at `palette-preview.html` (right panel) and at real pages with `.dark` on `<html>`: the button should be clearly the most colorful thing; cards should be distinguishable from the page; nothing should glow.
3. Persian text on dark: weight ≥ 400 (no `font-light`), line-height ≥ 1.75 — thin strokes and dots disappear first (`persian-iran-color.md` §3).

## 5. Common mistakes
- `bg-black` page with `text-white` body → harsh; use the tokens.
- Keeping a vivid light-mode accent in dark mode at full chroma → glows.
- Hard-coding `text-white` on `bg-primary`: in dark mode the primary is often light and needs a **dark** label — always use `text-primary-fg` (the audit catches this).
- Forgetting images: a photo with a white background becomes a white box; put it in a padded, rounded container or use a dark-friendly version.
- Shipping a dark mode nobody tested — offer it only if both modes are checked.
