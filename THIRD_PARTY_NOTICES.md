# Third-party notices

## Bundled software and fonts
- **Fonts** (SIL OFL 1.1, some with Apache-2.0 Latin glyphs): `skills/brand-logo-studio/assets/fonts/` — every license file is next to its font; versions, sources, Reserved Font Names and sha256 in `assets/fonts/FONTS.md`.
- **harfbuzzjs 1.6.3** (MIT; HarfBuzz "Old MIT") and **@resvg/resvg-wasm 2.6.2** (MPL-2.0; resvg core Apache-2.0 OR MIT): `skills/brand-logo-studio/vendor/` — licenses in `vendor/LICENSES/`, versions and hashes in `vendor/VERSIONS.md`.
- **Tailwind CSS 4.3.3 default palette values** (MIT, Tailwind Labs): used as data in `skills/brand-color-system/scripts/palette-engine.mjs` and `skills/web-ui-playbook/scripts/audit.mjs`.

  ```
  MIT License
  
  Copyright (c) Tailwind Labs, Inc.
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  ```

## taste-skill (ideas adapted, no files copied)
Source: https://github.com/Leonxlnx/taste-skill — read-only clone at commit `f624f37a8c650b9cc550253104925efe4c8de246` (2026-10-14). Treated as untrusted data: no script from it was run, nothing was installed. Ideas were rewritten in this plugin's own words; no substantial text was copied. Line numbers refer to that commit.

```
MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### brand-logo-studio ← `skills/brandkit/SKILL.md`
| Idea | Lines | Used in | Decision |
|---|---|---|---|
| A brand mark answers what the brand stands for, its metaphor, and how the mark expresses it | L57–70 | `references/logo-fundamentals.md` §2 | **Adapted** as the one-sentence idea test |
| Strategy before drawing; symbols chosen from meaning, never at random | L132–164 | logo-fundamentals.md §2 | **Adapted** (category table not copied; our recipes carry their own "use for" notes) |
| Logo concept methods (initial + meaning, product action, fusion, negative space, construction geometry), at most two combined | L198–283 | logo-fundamentals.md §2 table | **Adapted**, mapped to our eight recipes |
| Logo avoid-list (random bolts, animals, fake crests, copied marks, clip art, sparkles) | L184–192 | logo-fundamentals.md §5 | **Adapted**, merged with the Persian/Iran cliché list from our research report |
| Existing identity: reuse the supplied logo, do not reinterpret it | L119–128 | logo-fundamentals.md "Common mistakes", SKILL.md intake Q3 | **Adapted** |
| Reference usage: extract rhythm, never copy logo/name/composition | L747–772 | logo-fundamentals.md §5 ("never copy") | **Adapted** (already a rule here) |
| Generating brand-kit boards as AI raster images | L1–26, L776–822 | — | **Rejected**: this plugin builds vector files with code and checks them; raster AI images cannot be validated or used as logo masters |
| Dark charcoal presentation canvas, cinematic image panels, halftone/grain/CRT textures | L30–50, L570–591, L641–664 | — | **Rejected**: not checkable, fails one-color print; our brand sheet is a plain, functional six-module sheet |
| Visual "modes" with fixed palettes (e.g. black + cyan + coral) | L377–568, L699–723 | — | **Rejected**: colors come from the user's brand via brand-color-system, never from a mood preset |
| Example taglines | L619–637 | — | **Rejected**: taglines, claims and numbers come only from the user |

### web-ui-playbook (taste layer) ← taste-skill
Paths are relative to the taste-skill repo; `ts/` = `skills/taste-skill/`, `v2x` = `skills/taste-skill-v2-experimental/SKILL.md`.

**Adapted**
| Idea | Source (file:line) | Used in | How it changed |
|---|---|---|---|
| Subject inventory (8–12 things only this client has) | `ts/SKILL.md` L50–51 | `references/anti-generic.md` §1 | items come from the owner, never guessed |
| Idea sentence + competitor test | `ts/SKILL.md` L142–143; `ts/references/critique.md` L26, L63 | anti-generic.md §1; review-checklist.md §F pass 3 | — |
| Argument first: claims with proof decide the sections | `ts/SKILL.md` L64–66; `ts/references/layout.md` L111 | anti-generic.md §1; patterns-brand-sites.md §1 | a section without real proof is cut or a visible PLACEHOLDER listed for the owner |
| Proof is never invented | `ts/references/copy.md` L131 (§5) | anti-generic.md §2; audit `--slop` claims list | stricter: no "sample" details, a source comment is not proof, every number/quote listed |
| Three dials + presets | `v2x` L47–75 | anti-generic.md §4; visual-direction.md §1 dials table | plain words, never numbers; Iran default calm/subtle |
| Design read / design doc per project | `v2x` L18–22; `skills/stitch-skill/DESIGN.md` | SKILL.md step 2b; `docs/design-commitment.md` in the user's project | five decisions; "differs from the previous build" replaces the hidden history file |
| One live thing | `ts/SKILL.md` L149 | anti-generic.md §7 | optional, real data, works without JS |
| Critique passes: one second, squint, cover the logo, edges, sameness, phone, substance | `ts/references/critique.md` L21–30, L46–48, L55 | review-checklist.md §F | 7 of 14 passes; max two rounds; no scores |
| Tells registry (identical cards, gradients, gradient text, glass ≥ 2, emoji, accent word, eyebrow/pill badge, index numbering) | `ts/references/tells.md` L27–33, L41, L43, L67, L75 | anti-generic.md §5; audit `--slop` | warnings only; numbering kept as a warning because their own data (L67) shows it on strong sites |
| Lint rules: genre words, generic CTA labels, em dashes > 4, transition-all, ease-in, scale(0) | `ts/scripts/lint.mjs` L48–53, L86 | `scripts/slop.mjs`, `scripts/data/en-slop.json` | Blade/Alpine aware; Persian lists written new and owner-reviewed (`data/fa-slop.json`) |
| English stock vocabulary | `ts/references/copy.md` L156–157 | `data/en-slop.json` | shortened; marked "not owner-reviewed" |
| Headless-browser inspection | `ts/scripts/inspect.mjs` (whole file) | `scripts/render.mjs`, audit `--render` | re-implemented on `--dump-dom` (Node 18, no Puppeteer), local server, network blocked, rAF shim for Alpine; contrast at WCAG 4.5:1 + Persian 5.5:1, not 2.6:1 |
| Motion: `html.js` gate, reveal once, reduced motion keeps fades, no scroll hijacking | `ts/references/motion.md` L75–87, L118, L204, L281 | components-and-states.md §12 (baseline only); persian-rtl.md §11 | CSS/Alpine; RTL directions; calm default |
| Hero limits (≤ 4 elements, short subtext, CTA in the first screen) | `v2x` L236–241, L952 | anti-generic.md §5 | Persian subtext ≈ 25 words |
| Redesign: Greenfield / Preserve / Overhaul, audit first | `v2x` L807 | anti-generic.md §8; SKILL.md review section | never-change list adds eNamad, payment callbacks, SMS templates |
| Imagery: real pictures first, one dominant image, no fake dashboards | `ts/references/imagery.md` L3–4; `ts/references/tells.md` L47 | anti-generic.md §2, §5 | owner's photos first; no 4-picture gate |

**Rejected**
| Idea | Source (file:line) | Why |
|---|---|---|
| Script-dealt directions from a 247-site library; global history file | `ts/SKILL.md` L14; `ts/scripts/draw.mjs` L105; `ts/library/*.json` | Latin-only, CDN fonts, picsum photos, 1.3 MB; a hidden `~/` file; my 8 directions do the job |
| Simulated randomness ("Python-driven randomization", "roll the dice") | `skills/gpt-tasteskill/SKILL.md` L13; `skills/soft-skill/SKILL.md` L22 | pretends to be random, justifies nothing |
| Awwwards-style scores and caps | `ts/references/critique.md` L71 (§2), L114 | model judges scoring their own work |
| Model-panel study as evidence | `ts/references/research.md` L24–28, L287–291 | 21 model reviewers from screenshots; blind tests never beat the baseline on average → nothing labeled [Proven] |
| "LLM laziness" research folder | `research/README.md` L7 | uncited or dubious claims |
| Organic messy numbers (47.2%) | `skills/redesign-skill/SKILL.md` L82 | disguises fabricated data |
| Contrast gate that fails only below 2.6:1 | `ts/scripts/lib/rules.mjs` L95; `ts/references/colour.md` L121 | WCAG needs 4.5:1; plugin adds a Persian 5.5:1 house rule |
| minimalist-skill muted grey `#787774` | `skills/minimalist-skill/SKILL.md` L29 | measured 4.47:1 on white, 4.14:1 on its bone ground — fails WCAG |
| Font mandates (Fraunces/Instrument Serif bans, Latin-only picks) | `v2x` L180, L949 | Latin-only, CDN/Fontshare licensing; conflicts with bundled self-hosted Persian fonts |
| Display tracking −0.02 to −0.05em, leading 0.85–1.05 | `ts/references/type.md` L26, L73 | breaks Persian joins, clips dots; kept only for `lang="en"` display |
| Shadow and hairline bans | `ts/references/tells.md` L31 | 3-level shadow tokens; input borders required by WCAG 1.4.11 |
| Cream + terracotta ban | `ts/references/tells.md` L58; `ts/references/colour.md` L130 | brick and saffron carry Iranian meaning; brand-color-system decides colors |
| Grain, mesh gradients, inertia scroll in redesigns | `skills/redesign-skill/SKILL.md` L39–40, L151 | noise for its own sake; janks low-end phones; scroll hijacking |
| Glass pill nav / eyebrow badges required | `skills/soft-skill/SKILL.md` L25–34 | contradicts the main skill; heavy blur on low-end phones |
| Magnetic buttons, perpetual micro-loops, GSAP/React motion stack | `skills/taste-skill-v1/SKILL.md` L69–70; `skills/gpt-tasteskill/SKILL.md` L3 | performance, distraction, accessibility; Blade + Alpine stack |
| Simple Icons CDN logo walls | `v2x` L277 | foreign CDN; invented logos are fake proof |
| At least four real pictures (gate) | `ts/references/critique.md` L41, L115 | Iran bandwidth; marked placeholders are the honest state when photos are missing |
| Official design-system map (Material etc.) | `v2x` L90 | wrong stack (Laravel/Blade/Tailwind) |
| brutalist-skill (uppercase, monospace, scanlines) | `skills/brutalist-skill/SKILL.md` L10–21 | hostile to Persian text |
| output-skill as a separate skill | `skills/output-skill/SKILL.md` L3, L16 | kept as one line of practice: full pages, no TODO stubs |
