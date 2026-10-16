/**
 * brand-logo-studio — fonts.mjs
 * Registry of the bundled, unmodified SIL OFL fonts (assets/fonts, details in assets/fonts/FONTS.md).
 * A font spec is "<id>" or "<id>:<weight>" for variable fonts, e.g. "vazirmatn-black", "estedad:800".
 * Any other spec is treated as a path to a TTF/OTF the user is licensed to use (e.g. a commercial font).
 */
import fs from 'node:fs';
import path from 'node:path';
import { SKILL_DIR } from './vendor.mjs';

const DIR = path.join(SKILL_DIR, 'assets', 'fonts');

/** id → { file, script, weight (static) | range (variable), static, role } */
export const FONTS = {
  'vazirmatn-bold': { file: 'Vazirmatn-Bold.ttf', script: 'fa', weight: 700, static: true, role: 'modern Persian sans — default wordmark' },
  'vazirmatn-extrabold': { file: 'Vazirmatn-ExtraBold.ttf', script: 'fa', weight: 800, static: true, role: 'modern Persian sans, heavier' },
  'vazirmatn-black': { file: 'Vazirmatn-Black.ttf', script: 'fa', weight: 900, static: true, role: 'heaviest; monogram knockouts' },
  estedad: { file: 'Estedad[wght].ttf', script: 'fa', range: [100, 900], default: 800, static: false, role: 'geometric, wide counters — friendly, consumer' },
  katibeh: { file: 'Katibeh-Regular.ttf', script: 'fa', weight: 400, static: true, role: 'calligraphic display — heritage, food, culture (large sizes only)' },
  'noto-naskh': { file: 'NotoNaskhArabic[wght].ttf', script: 'fa', range: [400, 700], default: 700, static: false, role: 'classic Naskh — publishing, education, formal' },
  'sahel-bold': { file: 'Sahel-Bold.ttf', script: 'fa', weight: 700, static: true, role: 'clean sans — clinics, services' },
  'samim-bold': { file: 'Samim-Bold.ttf', script: 'fa', weight: 700, static: true, role: 'soft sans — general SMB' },
  'shabnam-bold': { file: 'Shabnam-Bold.ttf', script: 'fa', weight: 700, static: true, role: 'geometric sans — modern SMB' },
  'parastoo-bold': { file: 'Parastoo-Bold.ttf', script: 'fa', weight: 700, static: true, role: 'literary Naskh-style — law, books, academia' },
  inter: { file: 'Inter[opsz,wght].ttf', script: 'en', range: [100, 900], default: 700, static: false, role: 'neutral grotesk — SaaS, corporate' },
  'plus-jakarta-sans': { file: 'PlusJakartaSans[wght].ttf', script: 'en', range: [200, 800], default: 700, static: false, role: 'friendly geometric — education, startups' },
  lora: { file: 'Lora[wght].ttf', script: 'en', range: [400, 700], default: 700, static: false, role: 'warm serif — publishing, heritage, premium' },
};

const cache = new Map();

/** Resolve a font spec to { id, file, bytes, weight, static, script, external }. */
export function resolveFont(spec) {
  if (cache.has(spec)) return cache.get(spec);
  const [id, w] = String(spec).split(':');
  let info;
  if (FONTS[id]) {
    const f = FONTS[id];
    const weight = f.static ? f.weight : Number(w || f.default);
    if (!f.static && (weight < f.range[0] || weight > f.range[1])) throw new Error(`${id} supports weights ${f.range[0]}–${f.range[1]}, not ${weight}`);
    info = { id, file: path.join(DIR, f.file), weight, static: f.static, script: f.script, external: false };
  } else {
    const file = path.resolve(spec);
    if (!fs.existsSync(file)) throw new Error(`Unknown font "${spec}". Bundled: ${Object.keys(FONTS).join(', ')} — or pass a path to a .ttf/.otf you are licensed to use.`);
    info = { id: path.basename(file), file, weight: null, static: true, script: null, external: true };
  }
  info.bytes = new Uint8Array(fs.readFileSync(info.file));
  cache.set(spec, info);
  return info;
}

export const fontInfo = (id) => FONTS[id];
