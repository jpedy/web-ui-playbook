# Design Foundations — default values

Use these numbers unless the chosen style direction (`visual-direction.md`) overrides them. Every value here maps to a token in `assets/tokens.css`. Write markup only after the tokens are set, so that no magic numbers end up in templates.

Sources: reports A (general UI/UX) and B (modern web design), plus general practice where marked. Root size: `1rem = 16px`.

## Contents
1. Spacing
2. Type scale (English/Latin)
3. Color and contrast
4. Radius, borders, shadows
5. Motion
6. Layout grid and breakpoints
7. Touch targets, focus, z-index, icons
8. Common mistakes

---

## 1. Spacing — 4px base `[Proven]`
| Token step | px | Tailwind | Typical use |
|---|---|---|---|
| 1 | 4 | `1` | icon–label gap in dense UI |
| 2 | 8 | `2` | gap between related items, min gap between touch targets |
| 3 | 12 | `3` | input inner padding, mobile bento gap |
| 4 | 16 | `4` | card padding (mobile), mobile page gutter |
| 6 | 24 | `6` | card padding (desktop), grid gap, form field gap |
| 8 | 32 | `8` | large card padding, group separation |
| 12 | 48 | `12` | sub-section spacing |
| 16 | 64 | `16` | section spacing (mobile) |
| 24 | 96 | `24` | section spacing (desktop) |
| 32 | 128 | `32` | hero breathing room |

- Vertical section padding: `clamp(3rem, 6vw, 7rem)` (48→112px).
- Bento or card grid gap: 16–24px on desktop, 12–16px on mobile.
- Use only values from this scale. 13px, 19px or `p-[22px]` are defects.
- Proximity rule (general practice): space inside a group must be smaller than space between groups, ideally at most half.

## 2. Type scale — English/Latin `[Proven]`
| Role | Size | Line-height | Weight | Notes |
|---|---|---|---|---|
| Display / hero H1 | `clamp(2.25rem, 1.5rem + 3.5vw, 4.25rem)` (36→68px) | 1.05–1.12 | 700–800 | letter-spacing −0.02 to −0.03em (Latin only), max 20ch per line |
| H2 section | `clamp(1.75rem, 1.3rem + 2vw, 2.75rem)` (28→44px) | 1.15–1.2 | 700 | |
| H3 card/subsection | 20–24px | 1.3 | 600 | |
| Body | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` (16→18px) | 1.5–1.6 | 400 | line length 60–75ch (`max-w-prose` ≈ 65ch) |
| Lead/subheadline | 18–20px | 1.5 | 400 | 55–65ch |
| UI controls | 14px (13px in dense apps) | 1.4 | 500 | |
| Caption/meta | 12–13px | 1.4 | 400–500 | never below 12px; **Persian ≥ 13px** (`text-caption`, house rule) |
| Table header | 12px | 1.4 | 600 | letter-spacing 0.04em in Latin only; no uppercase in Persian |

- Use at most 2 font families: one sans for UI/body, plus an optional display or serif. A monospace font only for code or IDs.
- Weights: 400 body, 500–600 UI and labels, 700 headings. Skip weights below 300 entirely, and below 400 under 16px.
- Persian text uses a **different** table (bigger line-heights, no tracking). See `persian-rtl.md` §3.

## 3. Color and contrast `[Proven]`
**Token structure (3 tiers):** primitive (raw ramp, e.g. `blue-600`) → semantic (`--color-primary`, `--color-text-muted`) → component (`--button-bg`). Templates use **semantic** names only (`bg-primary`, `text-muted`), never `bg-[#3b82f6]`.

**Minimum semantic set:** `bg`, `surface`, `surface-subtle`, `border`, `text`, `text-muted`, `primary`, `primary-hover`, `primary-fg`, `accent` (optional), `success`, `warning`, `danger`, `info`, `focus`. All of them are defined in `assets/tokens.css`.

**Contrast minimums (WCAG 2.2 AA):**
- Normal text: **≥ 4.5:1**. Large text (≥24px, or ≥18.66px bold): **≥ 3:1**.
- UI boundaries (input borders, icons, focus rings) against their neighbors: **≥ 3:1**.
- Aim for ≥ 7:1 on body text when it costs nothing.
- Persian microcopy under 14px: ≥ 5.5:1 — a **house rule** of this skill for dot legibility, not a WCAG requirement (`brand-color-system` → `persian-iran-color.md` §2).
- Don't compute ratios by eye: `brand-color-system/scripts/check-contrast.mjs --pair "#fg on #bg"` for one pair, `audit.mjs --contrast` for whole pages.
- Placeholder text is still text. Keep it ≥ 4.5:1, or make sure it isn't the only label.

**Known-safe pairs on white (computed, approximate):**
| Foreground | Ratio on #FFF | Use |
|---|---|---|
| `#111827` gray-900 | 17.7:1 | headings, body |
| `#374151` gray-700 | 10.3:1 | body |
| `#4B5563` gray-600 | 7.6:1 | muted text (preferred) |
| `#6B7280` gray-500 | 4.8:1 | muted text — the lightest allowed for small text |
| `#9CA3AF` gray-400 | 2.5:1 ✗ | disabled or decorative only, never readable text |
| `#2563EB` blue-600 | 5.2:1 | links; white text on it passes |
| `#3B82F6` blue-500 | 3.7:1 ✗ small text | large text or icons only |
| `#DC2626` red-600 | 4.8:1 | error text on white only — on a red-50 tint it drops to 4.35:1; use red-700 there |
| `#15803D` green-700 | 5.0:1 | success text (green-600 `#16A34A` is only 3.3:1 ✗) |
| `#B45309` amber-700 | 5.0:1 | warning text (amber-500 fails) |

- Never use color alone to show status: add an icon or text ("Paid", a red border **plus** an error message).
- Define new colors in `oklch()` (perceptually even lightness, so light/dark ramps behave predictably) `[Proven]`. Hex is acceptable in primitives.
- Palette and dark mode: generate them with the **brand-color-system** skill (`visual-direction.md` §2 summarizes it); dark-mode rules in `visual-direction.md` §3.

## 4. Radius, borders, shadows
**Radius scale:** `sm` 6px (badges, small inputs), `md` 8–10px (buttons, inputs), `lg` 12–16px (cards, modals), `full` (pills, avatars). Pick one personality per project (sharp 4–6 / standard 8–12 / soft 12–20) and keep it.
- **Concentric rule** `[Proven]`: outer radius = inner radius + padding. A 16px card with 8px padding needs an 8px radius on the inner image or button. Mismatched nested radii look amateur.

**Borders:** 1px, at 8–12% foreground opacity (`border-black/10` light, `border-white/10` dark), or the `border` token.

**Shadows** (general practice — not from reports): 3 levels only.
- `sm`: `0 1px 2px rgb(0 0 0 / 0.05)` — inputs, small cards
- `md`: `0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px rgb(0 0 0 / 0.04)` — raised cards, dropdowns
- `lg`: `0 12px 32px -8px rgb(0 0 0 / 0.16)` — modals, popovers
- Use a border **or** a shadow on a card, not a heavy version of both. In dark mode, replace shadows with lighter surfaces and borders.

## 5. Motion `[Proven]`
| Interaction | Duration | Easing |
|---|---|---|
| Hover, press, toggle (micro) | 150–200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Dropdown, tooltip, command palette open | 120–150ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal, sheet, page transition | 250–300ms | `cubic-bezier(0.16, 1, 0.3, 1)` on enter, ~200ms on exit |
| Scroll reveal (marketing only) | 300–500ms, once | ease-out; translate 8–16px plus fade |

- Animate only `transform` and `opacity` (compositor-friendly). Never animate `width`, `height`, `top` or `left`.
- UI motion never exceeds 300ms. Anything slower feels sluggish.
- Always add `@media (prefers-reduced-motion: reduce)` and turn off non-essential motion there (`motion-reduce:` in Tailwind).
- No 0ms state changes on interactive elements either; a 150ms transition makes them feel finished.

## 6. Layout grid and breakpoints `[Proven]`
| Breakpoint | Min width | Grid | Gutter / page padding |
|---|---|---|---|
| base (mobile) | 0 (test at **320px**) | 4 columns | 16px |
| `sm` | 640px | 4–8 columns | 16–24px |
| `md` | 768px | 8 columns | 24px |
| `lg` | 1024px | 12 columns | 24–32px |
| `xl` | 1280px | 12 columns | 32px |
| `2xl` | 1536px | 12 columns | 32px, content stays capped |

- Container max-width: marketing 1200–1280px, apps 1280–1440px, reading column ~65ch (≈ 680–720px).
- Mobile-first: write base styles for 360px, then add `md:` and `lg:`.
- No horizontal scroll at 320px or at 200% zoom.
- Use `100dvh`, not `100vh` (`min-h-dvh` in Tailwind), because mobile browser bars change the viewport height.
- Set `scrollbar-gutter: stable` on `html` to stop layout jumps when a scrollbar appears.
- Reusable components that may sit in narrow slots: use container queries (`@container`, `@md:` in Tailwind v4). Page shells use viewport breakpoints.
- Any grid/flex child containing `truncate` text, an SVG chart or a wide table gets `min-w-0`. Otherwise it forces horizontal scroll on phones.

## 7. Touch targets, focus, z-index, icons
- **Touch target:** 44×44px default, with ≥ 8px between targets. WCAG 2.2 AA (2.5.8) requires 24×24px as the minimum — use that floor for dense desktop tables only. Set the size with `min-h-11` (44px), not with padding (`components-and-states.md` §2). *Conflict:* report A says 48px minimum, report B says 24px floor with 44–48 recommended → 44px chosen.
- **Focus ring:** `outline: 2px solid var(--color-focus); outline-offset: 2px;` on `:focus-visible`, with ≥ 3:1 contrast. `outline-none` without a replacement ring is a defect.
- **Sticky headers:** set `scroll-padding-top` (logical: `scroll-padding-block-start`) to the header height + 16px, so focused or anchored items aren't hidden.
- **z-index scale** (general practice): sticky table column 10, sticky table header 20, dropdown/popover 30, site header 40, overlay 50, modal/sheet 60, toast 70. No `z-[9999]`.
- **Icons:** one icon set per project; sizes 16 (dense), 20 (default UI), 24 (navigation, mobile); stroke 1.5–2px; same color as the adjacent text.

## 8. Common mistakes
- Arbitrary spacing (`mt-[13px]`, `p-5` next to `p-6` with no reason) — snap to the scale.
- Gray-400 text on white for "subtle" copy — fails contrast; use gray-600.
- Three or more font families, or weights 100–300 for body text.
- Inner and outer radii that ignore the concentric rule.
- Heavy shadow plus border plus gradient on every card — pick one depth method.
- Animations at 500ms+ or on layout properties; no reduced-motion fallback.
- Desktop-first CSS that breaks at 320px; `100vh` hero cut off on mobile.
- Hardcoded hex values in templates instead of semantic tokens (dark mode then breaks).
