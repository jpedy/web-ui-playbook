# Logo review checklist

Run before showing a kit as finished. The scripts check what a machine can check; the rest is by eye and must be done by you **and** confirmed by the user. Passing the automated part does not prove the logo is good, original or free to register.

## A. Automated (no FAIL allowed)
- [ ] `node <skill>/scripts/export-kit.mjs …` exited 0 (no blocking findings in `kit-report.md`).
- [ ] Shaping check: `pass` for the Persian name (or `skipped` because no browser — then section B.1 is mandatory and you say so).
- [ ] Proof sheet: every letter shows ✓ dots, or the ⚠ ones are explained (fonts that draw 2–3 dots as one shape).
- [ ] Every master SVG: no `<text>`, no `<image>`/`<script>`, no external references, has a viewBox, nothing clipped.
- [ ] Contrast: wordmark ≥ 4.5:1 on light and dark; every shape ≥ 3:1 against the color it touches (the accent is adjusted per context automatically; the notes list each change). Any remaining WARN is reported, not hidden.
- [ ] One-color: no WARN, and `logo-mono-black.svg` still reads.
- [ ] Maskable icon inside the safe zone; apple-touch-icon opaque; `favicon.ico` holds 16/32/48.
- [ ] Any custom or hand-edited SVG: `node <skill>/scripts/validate-render.mjs file.svg --out brand-kit/proof`.

## B. By eye (you, then the user)
1. **Persian name** — open `proof/proof-wordmark.png` at full size: right letters, right order, every dot, every join, ZWNJ breaks where the name has them. Compare with the name as the user typed it.
2. **16 px** — on `brand-sheet.png`: the icon is still a shape, not a smudge; cut-outs open. (A mark that blurs at 16 px gets a simplified monogram favicon automatically — kit-report.md lists it.)
3. **Dark** — the reversed lockup on the dark panel: clear, the accent still the brand's accent.
4. **Balance** — Persian and Latin look equally heavy and share one baseline; the icon is neither tiny nor dominant.
5. **Idea** — the mark can be described in one sentence and matches the brand's one metaphor (logo-fundamentals.md §2).
6. **Distinct** — squint at the 64 px icon: it is not a known brand's shape, not a generic cliché; similarity search done or handed to the user (legal-iran.md §2).
7. **Sensitive content** — no flags, state emblems, Red Crescent, sacred words; R5/R8 only for a related subject.
8. **Truth** — the tagline and any text on the OG image are the user's own words.

## C. Report to the user (template)
```
Direction: C — wordmark-led (accent dot on «ز»)
Files: public/brand/ — 32 files (list in kit-report.md)
Persian name check: Chrome comparison pass (98.2% ink overlap); proof sheet: all dots found — please confirm by eye
Colors: logo primary #0d9488 (3.74:1 on white), wordmark ink #1a4e4a (9.41:1), accent #d9b863
Automatic changes: accent #d9b863 → #af8f38 on white (3.08:1), #f7efb3 inside the teal square; maskable icon on a teal field
Legal: the logo has Latin letters → logo-fa-only.svg is the Persian-only version for filing; search for similar marks first (not legal advice — verify with an IP attorney)
What I could not check: whether the mark is original enough to register; how it looks in print
```

## Common mistakes
- Saying "all checks pass, the logo is done" — the by-eye part is the real review.
- Hiding WARN lines from the user.
- Showing only the light version.
