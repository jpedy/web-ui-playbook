---
name: brand-logo-studio
description: Builds a small business's logo and full brand kit in code — three logo directions, then outlined SVG masters (Persian + Latin lockups, a Persian-only version, icon, reversed, one-color), favicon.svg/.ico, app, social and email PNGs, a web manifest, a Blade head snippet and a one-page brand sheet — with correct Persian shaping (HarfBuzz, ZWNJ, mixed Persian/Latin/digits), a large letter-by-letter proof sheet, and automated checks (no live text, contrast, one-color print, small sizes, safe zones). Use it whenever the user wants a logo, logotype, wordmark, monogram, favicon, app icon, brand kit, brand identity, social avatar or brand guidelines sheet, wants to turn a Persian name into a logo, or wants an existing logo SVG checked or converted — even if they only give a business name. Part of the web-ui-playbook plugin; colors come from brand-color-system, pages from web-ui-playbook.
---

# Brand Logo Studio

You make a logo and brand kit for a user with **no design background**. They give a name and a business; you give three clear directions, build the one they pick into a complete, tested kit, explain each choice in one plain sentence, and drop it into their Laravel project.

**Never write a logo SVG by hand or put live `<text>` in it — run the scripts.** They are zero-dependency Node 18+ (HarfBuzz and resvg are vendored as WebAssembly; no `npm install`, nothing downloaded, works offline inside Iran). This skill, web-ui-playbook and brand-color-system are one plugin and may call each other; do not use any other design or logo skill.

## Workflow

### 1. Intake — only what's missing (max 6 short questions, one message)
1. **The exact name in Persian and/or Latin** — ask the user to type or paste it; never retype it from a transliteration. Which one is primary?
2. **The business and its customers** (skip if known) — sets `industry` (references/decision-table.md).
3. **Do you already have a logo?** If yes: reuse it unchanged and only build the missing files (`validate-render.mjs` on their SVG; never redesign it unasked).
4. **Feel** — offer 3 fitting words (modern / friendly / premium / academic / bold).
5. **Where will people see it first?** (website header, Instagram/Telegram avatar, app icon, shop sign) — decides which layout leads.
6. **A tagline?** Only if the user has one. Never invent a tagline, a claim or a number.

If the user says "you decide": state the assumptions in one line and continue.

### 2. Colors first
The logo uses the brand palette. If the project has no `palette.json`, run brand-color-system first (`generate-palette.mjs --brand … --industry … --out resources/css/brand`). Never pick logo colors by eye.

### 3. The idea in one sentence
Write the brand's one promise and one metaphor (references/logo-fundamentals.md §2). One metaphor per mark.

### 4. Three directions — from the user's project folder
Save the brief as `brand/brief.json` (format: references/brand-kit-spec.md §1), then:
```bash
node <this-skill-dir>/scripts/build-directions.mjs --brief brand/brief.json --out brand
```
Open `brand/directions.png` (or show it) and describe each in one sentence: **A** a container mark (safest at small sizes), **B** a symbol of what the business does, **C** the Persian name leads, one real letter dot in the accent color. Ask the user to pick. Show the console notes (e.g. a faint accent) in plain words.

### 5. Export the kit
```bash
node <this-skill-dir>/scripts/export-kit.mjs --brief brand/brief.json --direction C --out public/brand
```
It writes ~32 files (list: references/brand-kit-spec.md §2) plus `kit-report.md`, and exits 1 if a blocking problem remains. Fix and re-run; never hand-edit the outlines.

### 6. Check — mandatory
1. Open `public/brand/proof/proof-wordmark.png` at full size and check every letter, dot and join (references/persian-wordmarks.md §6). The shaping check inside it compares with the installed Chrome/Edge; with no browser it says "skipped" — then the by-eye check is the only check, and you say so.
2. Open `public/brand/brand-sheet.png`: icon at 16 px, reversed on dark, balance of the two scripts.
3. Walk references/logo-review-checklist.md (automated part + by-eye part).

### 7. Integrate and report
Follow the install line in `kit-report.md` — it comes from the project's stack (`.web-ui-playbook.json`, or `"stack"` in the brief). Laravel: copy the kit to `public/brand/`, paste `head-snippet.blade.php` into the layout `<head>` and use `asset('brand/svg/logo-h-rtl.svg')` in the header with a fixed height (brand-kit-spec.md §3). Report with the template at the end of the checklist: direction, files, Persian name check result, colors and warnings, the legal note, and what you could not check. **Say that passing the checks does not prove the logo is good or original.**

## Other tasks
- Persian/Latin text to outlined SVG: `scripts/text-to-path.mjs --text "…" --font … --out file.svg` (fonts: `--list-fonts`).
- Check any logo SVG (hand-made, from a designer, from another tool): `scripts/validate-render.mjs logo.svg --out brand/proof` → findings + a 512/64/32/16 px sheet on light, dark and one color.
- Shaping check or proof sheet alone: `scripts/shaping-check.mjs`, `scripts/proof-sheet.mjs` (same `--text --font`).

## Rules (details in the references)
1. **Outlines only.** No `<text>`, no embedded images or scripts, no external references in a logo.
2. **The name is the user's.** Copy it exactly; report every normalization (ي→ی, ك→ک, digits) and ZWNJ warning for confirmation.
3. **Persian letter-spacing is always 0.** Tracking applies to Latin runs only.
4. **Real cut-outs, not color, separate shapes** — the logo must survive one-color print, a stamp, a 16 px favicon.
5. **Always deliver a Persian-only version** (`logo-fa-only.svg`) when the logo has Latin letters — for market Iran, registration may require a commercial card otherwise (references/legal-iran.md ⏱ — verify with an IP attorney; not legal advice). The brief's `market` (or the project profile's) decides which legal notes the kit report shows.
6. **No clichés or forbidden content:** no flags, state emblems, Red Crescent, sacred words; no domes or Persepolis columns on unrelated businesses; R5/R8 only when the subject is related (logo-fundamentals.md §5).
7. **Never copy** a known logo, its colors or composition; never use a stock/open-source icon as the logo.
8. **Know the limits:** calligraphic logotypes (Nastaliq, Shekasteh), mascots and big rebrands need a human designer — say so and give the dated price ranges (legal-iran.md §5).
9. Output goes to the user's project (`--out`); the scripts refuse to write into this skill's folder.

## Windows notes
Paths with spaces and `&` work when quoted. Chrome/Edge are found in Program Files and `%LOCALAPPDATA%`; set `CHROME_PATH` to another Chromium-family browser, or `CHROME_PATH=none` to skip the browser comparison. The WASM files load from the skill folder with no network access.

## References
| File | Read when |
|---|---|
| references/logo-fundamentals.md | choosing the type of logo, finding the idea, clichés, limits of code-made logos |
| references/recipes.md | what each icon recipe is for (with preview image) |
| references/decision-table.md | default recipes and fonts per industry and feel |
| references/persian-wordmarks.md | Persian spelling, ZWNJ, mixed text, the proof sheet |
| references/bilingual-lockups.md | layouts, Persian/Latin sizing, baseline, clear space, minimum sizes |
| references/fonts.md | choosing fonts; display and commercial fonts (licenses: assets/fonts/FONTS.md) |
| references/brand-kit-spec.md | brief format, every exported file, Laravel integration |
| references/legal-iran.md ⏱ | similarity search, registration in Iran, copyright, designer prices |
| references/logo-review-checklist.md | before calling the kit finished; report template |
