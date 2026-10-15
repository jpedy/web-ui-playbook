# Gradients, shadows and text over images

## Contents
1. Gradients without the muddy middle
2. Mesh gradients and grain (use sparingly)
3. Text over gradients and photos
4. Tinted shadows
5. Common mistakes

---

## 1. Gradients without the muddy middle
Mixing two different hues in sRGB passes through gray in the middle (blue→yellow turns brownish-gray). Interpolating in OKLCH keeps the colors alive `[Proven]`:
```css
.hero { background: linear-gradient(135deg in oklch, var(--color-brand-600), var(--color-accent-500)); }
```
- `in oklch` support follows `oklch()` support (`color-fundamentals.md` §6); older browsers fall back to sRGB mixing, which is acceptable.
- Two stops are enough. Keep gradients for hero areas and illustrations, not for buttons or body backgrounds.
- Avoid the purple→blue "AI startup" gradient as the brand look (web-ui-playbook `visual-direction.md` §6).

## 2. Mesh gradients and grain (use sparingly)
Several soft `radial-gradient(...)` layers make a "mesh"; long dark gradients can show visible banding steps. A tiny inline SVG `feTurbulence` noise layer at 3–5% opacity hides banding without loading an image `[Proven, color report §7]`:
```css
.mesh { position: relative; isolation: isolate; background-color: var(--bg);
  background-image: radial-gradient(at 15% 20% in oklch, var(--color-brand-700) 0, transparent 55%),
                    radial-gradient(at 85% 30% in oklch, var(--color-accent-600) 0, transparent 50%); }
.mesh::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .045; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
```
Mesh and grain are for hero/login backdrops only — never behind tables, forms or long Persian text. On low-end phones large blurred layers cost frames; test on a mid-range Android (general practice — not from reports).

## 3. Text over gradients and photos
Automated checks can't see what is under text on a gradient or photo — `audit.mjs --contrast` reports these as **"could not resolve"**, never as passed. Make them safe by construction:
1. **Gradient:** check the text color against **every stop** under the text box with `check-contrast.mjs --pair "#fff on <stop>"`; all must pass (5.5:1 for small Persian text).
2. **Photo:** put a solid or near-solid scrim between photo and text (e.g. `bg-black/60` or a token-colored panel) and check text against the scrim composited over the **lightest** part of the photo (worst case). The simplest safe pattern: text on a card (`bg-surface/90` + `backdrop-blur`) over the photo.
3. **Persian text** over images needs a stronger scrim than Latin: dots and thin joins vanish first. The color report suggests a dark scrim ≈ `oklch(0.15 0.01 250 / 0.72)`; treat it as a starting point and check.
4. Never place small text (captions, prices, legal notes) directly on a photo.

## 4. Tinted shadows
In light mode, shadows tinted toward the page's own dark tone look more natural than pure black `[Proven, color report §7]`:
```css
--shadow-md: 0 4px 12px -2px oklch(from var(--color-base-950) l c h / 0.10), 0 2px 4px oklch(from var(--color-base-950) l c h / 0.05);
```
Relative color syntax is newer (`color-fundamentals.md` §6) — keep web-ui-playbook's plain `rgb(0 0 0 / …)` shadows as the default and use tinted shadows only when the user wants extra polish. Keep to 3 shadow levels. In dark mode use lighter surfaces instead of shadows (`dark-mode.md`).

## 5. Common mistakes
- Gradient buttons → hover and disabled states get messy and contrast varies across the button. Use solid `bg-primary`.
- White text on a photo with no scrim "because it looks fine on my screen".
- Gradient text (`bg-clip-text text-transparent`) for body or Persian text — unreadable and unauditable; headings only, checked against the lightest stop.
- Heavy colored glows on cards in light mode.
