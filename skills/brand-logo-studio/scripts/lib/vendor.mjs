/**
 * brand-logo-studio — vendor.mjs
 * Loads the vendored WebAssembly libraries from ../../vendor (no npm install, no network):
 *   harfbuzzjs 1.6.3 (MIT)       text shaping and glyph outlines
 *   @resvg/resvg-wasm 2.6.2 (MPL-2.0, resvg core Apache-2.0/MIT)   SVG → PNG rendering
 * Versions and checksums: vendor/VERSIONS.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VENDOR = path.join(SKILL_DIR, 'vendor');

let hbPromise = null;
let resvgPromise = null;

function need(file) {
  if (!fs.existsSync(file)) {
    console.error(`Missing vendored file: ${path.relative(SKILL_DIR, file)}\nThe brand-logo-studio folder is incomplete — reinstall the plugin (nothing is downloaded at runtime).`);
    process.exit(3);
  }
  return file;
}

/** HarfBuzz module (Blob, Face, Font, Buffer, shape, Direction, Variation…). */
export function loadHarfBuzz() {
  if (!hbPromise) {
    need(path.join(VENDOR, 'harfbuzzjs', 'harfbuzz.wasm'));
    hbPromise = import(pathToFileURL(need(path.join(VENDOR, 'harfbuzzjs', 'index.mjs'))).href);
  }
  return hbPromise;
}

/** resvg's Resvg class, with the WASM initialised once. */
export function loadResvg() {
  if (!resvgPromise) {
    resvgPromise = (async () => {
      const mod = await import(pathToFileURL(need(path.join(VENDOR, 'resvg-wasm', 'index.mjs'))).href);
      await mod.initWasm(fs.readFileSync(need(path.join(VENDOR, 'resvg-wasm', 'index_bg.wasm'))));
      return mod.Resvg;
    })();
  }
  return resvgPromise;
}

/**
 * Render an SVG string to RGBA pixels and PNG bytes. No system fonts are loaded: logos must contain
 * outlines only, so a stray <text> renders as nothing and is caught by validation.
 */
export async function render(svg, { width, height, background } = {}) {
  const Resvg = await loadResvg();
  const fitTo = width ? { mode: 'width', value: Math.round(width) } : height ? { mode: 'height', value: Math.round(height) } : { mode: 'original' };
  const r = new Resvg(svg, { fitTo, background, font: { loadSystemFonts: false } });
  const img = r.render();
  return { width: img.width, height: img.height, pixels: img.pixels, png: Buffer.from(img.asPng()) };
}
