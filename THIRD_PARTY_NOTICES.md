# Third-party notices

## Bundled software and fonts
- **Fonts** (SIL OFL 1.1, some with Apache-2.0 Latin glyphs): `skills/brand-logo-studio/assets/fonts/` — every license file is next to its font; versions, sources, Reserved Font Names and sha256 in `assets/fonts/FONTS.md`.
- **harfbuzzjs 1.6.3** (MIT; HarfBuzz "Old MIT") and **@resvg/resvg-wasm 2.6.2** (MPL-2.0; resvg core Apache-2.0 OR MIT): `skills/brand-logo-studio/vendor/` — licenses in `vendor/LICENSES/`, versions and hashes in `vendor/VERSIONS.md`.
- **Tailwind CSS 4.3.3 default palette values** (MIT, Tailwind Labs): used as data in `skills/brand-color-system/scripts/palette-engine.mjs` and `skills/web-ui-playbook/scripts/audit.mjs`.

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
