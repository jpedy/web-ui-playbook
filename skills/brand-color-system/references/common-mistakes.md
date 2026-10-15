# Common color mistakes and fixes

Use when reviewing someone's colors. Each fix names the command or token that solves it.

| # | Mistake | What the user sees | Fix |
|---|---|---|---|
| 1 | **Rainbow UI** — primary, secondary, tertiary and status colors all strong | nothing looks clickable; the page feels noisy | 60-30-10: neutrals for surfaces, one `bg-primary` action per section, accent only on badges (`color-fundamentals.md` §3) |
| 2 | **Light gray text** (`text-gray-400`, `#999`) for captions | hard to read, worst for Persian | `text-muted` from the generator (≥ 4.5:1, ≥ 5.5:1 Persian) |
| 3 | **White text on a mid-tone brand** (amber, light teal, coral) | labels hard to read | keep the brand as `--brand`; buttons use `--primary` + `--primary-fg` (the generator picks a dark label or a darker shade and explains) |
| 4 | **Brand color changed to "fix" contrast** | the logo and the site don't match | never alter the brand hex; use the shade or dark-label options |
| 5 | **Status = brand color** (green brand for "success", red brand for "error") | users can't tell brand from status | the generator moves the status hue; always icon + word (`palette-algorithm.md` §2 step 7) |
| 6 | **Color is the only signal** (red border = error) | about 8% of men miss it | icon + text message + `aria-invalid`; check the report's color-vision section |
| 7 | **Pure black page and pure white text** | glare, OLED smear; mourning associations in Iran | base-950 page and base-100 text (`dark-mode.md`) |
| 8 | **Over-tinted grays** (chroma > 0.05) | everything looks dyed; photos look off | generator neutrals (≤ 0.018), or `--neutral pure` |
| 9 | **sRGB gradients between distant hues** | gray/brown band in the middle | `linear-gradient(… in oklch, …)` (`gradients-shadows.md` §1) |
| 10 | **Text on photos or gradients without a scrim** | unreadable on some images | scrim or card; check the worst-case stop (`gradients-shadows.md` §3) |
| 11 | **`text-white` on `bg-primary` in templates** | breaks in dark mode when the primary turns light | `text-primary-fg` everywhere; the audit flags it |
| 12 | **Hand-edited palette hex values** | guarantees silently lost | re-run the generator with flags, then `check-contrast.mjs` |
| 13 | **Copying a competitor's palette** | confusion, possible legal trouble | generate from the user's own brand; `--market iran` only to stay away |
| 14 | **Darkening "by 10%" in HSL** | uneven steps, some shades fail | use the generated scale (OKLCH, per-hue curves) |
| 15 | **Neon accent in dark mode** | glow, blur | the generator's dark accent (lighter, ≥ 3:1 vs page); avoid chroma > 0.2 on dark |
