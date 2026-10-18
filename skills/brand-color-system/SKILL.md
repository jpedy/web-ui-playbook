---
name: brand-color-system
description: Generates and checks brand color palettes for websites and apps — from the user's exact brand color (kept unchanged) or from a feel/industry when there is none — and outputs Tailwind CSS v4 tokens for light and dark mode in which every text/background pair passes WCAG 2.2, with Persian/Iran rules (5.5:1 house rule for small Persian text, warning when the color is too close to a well-known Iranian brand). Use it whenever the user wants to choose, generate, extend, fix or review colors — brand palette, color scheme, primary/accent color, dark-mode colors, Tailwind color tokens, "which colors suit my business", contrast problems, colors for a logo or brand kit — even if they only paste a hex code or say "make it look professional". Part of the web-ui-playbook plugin; works with web-ui-playbook (tokens, pages) and brand-logo-studio (logo colors).
---

# Brand Color System

You choose colors for a user with **no design background**. They give a brand color, a logo, or just a business and a feeling; you produce a complete, tested palette, explain each decision in one plain sentence, and drop it into their Tailwind v4 project.

**Never pick or check colors by eye or by memory — run the scripts.** They are zero-dependency Node 18+ (no `npm install`, nothing to download, works offline inside Iran). This skill, web-ui-playbook and brand-logo-studio are one plugin and may call each other; do not use any other design or color skill.

## Workflow

### 1. Intake — only what's missing (max 5 short questions, one message)
1. **Do you already have a brand color?** (a hex code, or a logo file to read it from, or "no")
2. **What is the business and who is it for?** (skip if known from web-ui-playbook intake) — it sets `--industry`, which picks the accent
3. **Feel?** Offer 3 fitting options from `references/industry-feel-lookup.md` §1, e.g. "trustworthy / calm / playful".
4. **Language and market** — read from the project's `.web-ui-playbook.json` when it exists (the script does this itself); otherwise ask: Persian text? users inside Iran? (`--lang fa|en|both`, `--market iran|global` — two separate switches)
5. **Any competitor colors to stay away from?** (optional; known Iranian brands are checked automatically with `--market iran`)

If the user says "you decide": use their brand color if any, otherwise the feel from the industry table; Persian + `--market iran` when the request is in Persian or mentions Iran — and say "Assuming the audience is inside Iran — tell me if not." State the assumptions in one line and continue. Token format: `--format` (default `tailwind4`; the stack's adapter in web-ui-playbook `references/stacks/` names the right one).

### 2. Generate — from the user's project folder
```bash
node <this-skill-dir>/scripts/generate-palette.mjs --brand "#0f766e" --industry education --lang fa --market iran --name "Zabansara" --out resources/css/brand
node <this-skill-dir>/scripts/generate-palette.mjs --feel calm --lang fa --market iran --out resources/css/brand    # no brand color yet
```
Options worth knowing (full list: `--help`): `--industry education|kids|finance|government|health|saas|ecommerce|luxury|culture…` (picks the accent: warm saffron-gold for education and kids, a quiet tone for finance and government), `--accent "#hex"` (keep the user's accent), `--harmony analogous|complementary|split|none` (overrides the industry), `--neutral tinted|pure|warm|cool`, `--on-primary white|dark` (button label choice), `--competitor "#hex:Name"`.

Output (in the project, never in the skill folder — the script refuses that):
- `palette.css` — drop-in color tokens for web-ui-playbook (`--bg … --primary … --danger`, plus `--brand`, `--primary-ink`, `--accent-fg`), `.dark` values, `@theme inline` mapping, full scales (`brand-*`, `accent-*`, `base-*`)
- `palette-report.md` — decisions in plain words, warnings, every contrast pair (light + dark), color-vision check
- `palette.json` — the same data for scripts
- `palette-preview.html` — light and dark mock UI + scales; open it in the browser (or screenshot it) and look before you continue

### 3. Explain — 2–4 plain sentences, from the console "decisions" lines
Always say: where the exact brand color sits (e.g. "kept exactly as brand-700"), what the buttons use and why, which class to use for brand-colored links (`text-primary-ink`), the accent's job (≤ 10% of the screen), and any ⚠ warning (competitor closeness, status hue near the brand). Example: "Your teal stays exactly as it is. White text on it is 5.5:1, so buttons use it directly. Links use a darker teal so small text stays readable. The saffron-gold accent is only for badges and highlights."

### 4. Integrate (with web-ui-playbook)
- Copy web-ui-playbook's `assets/tokens.css` into the project if it isn't there yet, then `@import "./brand/palette.css";` right **after** the tokens import (later definitions win; palette.css has no `@import "tailwindcss"`).
- Templates keep using semantic classes only: `bg-primary text-primary-fg hover:bg-primary-hover`, `text-primary-ink` for links, `bg-brand` only for logo/illustration areas, status = `bg-*-subtle text-*` **plus an icon and a word**.

### 5. Verify — mandatory
1. `node <this-skill-dir>/scripts/check-contrast.mjs resources/css/brand/palette.css [--fa]` → 0 fail. (Works on any existing project CSS too.)
2. After pages exist: `node <web-ui-playbook-dir>/scripts/audit.mjs resources/views --contrast --css resources/css` → fix every contrast **error**; list the "could not resolve" items for the user to check in the browser (they are never counted as passed).
3. Walk `references/palette-review-checklist.md` (the manual part: proportions, dark mode look, Persian sample, color vision).

### 6. Report
Use the template at the end of `palette-review-checklist.md`: files written, the exact brand color and where it lives, button/link decisions, warnings, contrast summary (pairs passed / unresolved), and what the user should check by eye.

## Rules (details in the references)
1. **The user's brand hex is never altered.** If it can't carry button text, it stays as `--brand` (logo, illustration, large headings) and buttons use a safe shade or a dark label — and you say so.
2. **WCAG 2.2 AA is the floor:** 4.5:1 normal text, 3:1 large text (≥ 24px, or ≥ 18.66px bold) and UI parts (borders, focus rings, icons). APCA numbers are informational only (⏱ WCAG 3 is still a Working Draft, dated 10 Sep 2026 — verify before relying).
3. **Persian house rule** (this skill's readability choice, *not* a WCAG requirement): small Persian text ≥ 5.5:1, because dots and small counters blur first. Button labels (≥ 14px semibold) use the WCAG floor.
4. **Status is never color alone:** every success/warning/error/info shows an icon and a word. Red and green look alike to about 8% of men.
5. **One primary action color.** Accent ≤ 10% of the screen, never a second button color. Neutrals carry about 60% of the page.
6. **No pure black page backgrounds** (`#000`), no neon on dark, no purple-to-blue "AI gradient" as identity.
7. **Never copy a competitor's palette.** `references/iran-brand-colors.md` exists only to stay *away* from them.
8. Output goes to the user's project (`--out`); never write into this skill's folder.

## Reference map — read only what the task needs
| File | Read when |
|---|---|
| `references/color-fundamentals.md` | explaining choices; OKLCH basics; 60-30-10; harmony; CSS color features and browser support |
| `references/palette-algorithm.md` | how the generator works, every token rule, why it differs from common recipes, overrides |
| `references/industry-feel-lookup.md` | no brand color yet; "what colors fit a …"; example palettes per feel; competitor distance |
| `references/dark-mode.md` | dark mode questions or problems |
| `references/gradients-shadows.md` | gradients, text over images/gradients, tinted shadows |
| `references/persian-iran-color.md` | Persian/Iranian audiences: associations, house rule, typography on color, tools from Iran ⏱ |
| `references/iran-brand-colors.md` | ⏱ dated data table for `--market iran` (edit there, not in code) |
| `references/palette-review-checklist.md` | steps 5–6, every time |
| `references/common-mistakes.md` | reviewing someone's colors; quick fixes |

| Script | Purpose |
|---|---|
| `scripts/generate-palette.mjs` | build the palette + report + preview (CLI) |
| `scripts/check-contrast.mjs` | check a project's CSS tokens, or one pair: `--pair "#fff on #0f766e"` |
| `scripts/palette-engine.mjs` · `color-core.mjs` · `token-pairs.mjs` | the math (OKLCH, gamut, WCAG, APCA, color-vision simulation) |
| `scripts/selftest.mjs` | proves the math against culori/apca-w3 golden values and tests 60 brands; run after any change |

## Time-sensitive information
Browser support, WCAG 3 status, Tailwind palette details, Iranian brand colors and tool availability from Iran are marked ⏱ with the date checked (Oct 2026). When a deliverable relies on one, say "(as of Oct 2026 — verify before relying)".
