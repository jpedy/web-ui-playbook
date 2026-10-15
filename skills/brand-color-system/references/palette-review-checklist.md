# Palette review checklist

Run after generating a palette and again after pages are built. Part A is automatic (scripts); Part B needs eyes (preview or browser). Report with the template at the end.

## A. Automatic — must be clean
| # | Check | Command | Pass |
|---|---|---|---|
| A1 | Every token pair, light + dark | `node <skill>/scripts/check-contrast.mjs <palette.css or app css> [--fa]` | 0 fail (house-rule warnings only if the user accepted them) |
| A2 | Every text element on the built pages | `node <web-ui-playbook>/scripts/audit.mjs resources/views --contrast --css resources/css` | 0 contrast errors; every "could not resolve" item listed for the user |
| A3 | Exact brand color kept | `palette.json` → `brand.hex` equals the user's hex and `scales.brand` contains it | yes |
| A4 | Competitors | console/report warnings with `--market iran` / `--competitor` | none, or discussed with the user |
| A5 | Color vision | report § Color-vision check | every listed pair has icons + words in the UI |
| A6 | Engine sanity (after editing scripts only) | `node <skill>/scripts/selftest.mjs` | 0 failed |

Never mark A2's unresolved items as passed. Typical causes: dynamic classes (`:class`, `@class`), Blade/Livewire/JSX components, background images or gradients, colors the audit doesn't know. Check them in the browser (DevTools contrast picker or `check-contrast.mjs --pair`).

## B. By eye — open `palette-preview.html` and real pages (light and dark)
- [ ] **One clear action:** the primary button is the most colorful thing on each screen; accent ≤ ~10%.
- [ ] **Brand where it belongs:** exact brand color visible in logo, hero or illustration; buttons use `--primary` (which may be a different shade — explained to the user).
- [ ] **Links** use `text-primary-ink`; hover and visited states visible.
- [ ] **Status** messages show icon + word in both modes; error red doesn't look like the brand red (if the brand is red, icons carry it).
- [ ] **Dark mode:** cards distinguishable from the page; button not glowing; muted text not faint.
- [ ] **Persian sample:** a 13–14px Persian caption and a badge read clearly; dots of پ چ ژ ث distinct; weight ≥ 400 on dark.
- [ ] **Grayscale test:** with `filter: grayscale(1)` in DevTools, the primary action and errors are still findable (by position, icon, weight).
- [ ] **Photos and gradients** with text have a scrim (`gradients-shadows.md` §3).
- [ ] No pure `#000` page background; no purple-to-blue "AI gradient" identity.

## Report template
```
Palette — <name> (<date>)
Files: resources/css/brand/palette.css, palette-report.md, palette.json, palette-preview.html
Brand color: #xxxxxx — kept exactly as brand-<stop>
Buttons: <hex> with <white|dark> text (<ratio>:1) — <why, one sentence>
Links: text-primary-ink <hex> · Accent: <hex> (badges/highlights only)
Dark mode: buttons <hex>, page <hex>
Contrast: <n>/<n> token pairs pass (light + dark)[; Persian house rule 5.5:1 applied]
Pages: <n> text checks · <n> pass · <n> fixed · <n> could not resolve → please check: <list>
Warnings: <competitor / status-hue / color-vision notes, or "none">
Time-sensitive: <⏱ items relied on, "(as of Oct 2026 — verify before relying)">
```
