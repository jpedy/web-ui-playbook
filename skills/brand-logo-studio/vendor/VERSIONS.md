# Vendored WebAssembly libraries

Copied unmodified from npm on 2026-10-15 so the skill needs no `npm install` and works offline (also inside Iran). Node 18+ loads them directly.

| Folder | Package | License | Files (sha256) |
|---|---|---|---|
| `harfbuzzjs/` | `harfbuzzjs@1.6.3` — HarfBuzz text shaping compiled to WASM (github.com/harfbuzz/harfbuzzjs) | harfbuzzjs: MIT (`LICENSES/harfbuzzjs-MIT.txt`); HarfBuzz: "Old MIT" (`LICENSES/harfbuzz-COPYING.txt`) | `index.mjs` `04ece1914c8720ad96257728119c1bf24088ee4ef3ab2a2ca688c9a4895d4e7e`<br>`harfbuzz.js` `ba43463df44851fd58211ef8c19aa7956965390857727ae867b70dc7b3682de1`<br>`harfbuzz.wasm` `5f67e3bd1c4f40ffd07c12d7faa30ebc40cc65998ce058fde5b3c6504607bfb4` |
| `resvg-wasm/` | `@resvg/resvg-wasm@2.6.2` — SVG → PNG renderer (github.com/yisibl/resvg-js) | wrapper: MPL-2.0 (`LICENSES/MPL-2.0.txt`); resvg core: Apache-2.0 OR MIT (`LICENSES/Apache-2.0.txt`, `LICENSES/resvg-LICENSE-MIT.txt`) | `index.mjs` `10170d02d816f02ec76f9bc095b01d9becf536e7b1e12e5aa616652c84b237a1`<br>`index_bg.wasm` `22bf6e9f9a100d972da0411a69c5ba504367fc1fa87b3b64e3f35e53926d2d70` |

MPL-2.0 is file-level copyleft: the files in `resvg-wasm/` stay under MPL-2.0 and are distributed unmodified, with their source at the URL above. The skill's own scripts are not affected.

resvg runs with `loadSystemFonts: false`: logos never contain live text, so rendering is the same on every machine.

To update: install the new versions in a scratch folder, copy the same files, run `node scripts/selftest.mjs`, and update this table.
