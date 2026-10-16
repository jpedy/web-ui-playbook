/**
 * brand-logo-studio — shape.mjs
 * Text → outlined SVG path data with HarfBuzz (vendored WASM). Persian is shaped by OpenType rules
 * (joining forms, ligatures, marks), each bidi run in its own direction, runs placed in visual order.
 * Output coordinates: SVG space (y down), baseline at y = 0, x from 0 to width.
 */
import { loadHarfBuzz } from './vendor.mjs';
import { resolveFont } from './fonts.mjs';
import { bidiRuns, normalizePersian } from './bidi.mjs';
import { transformPath, pathBBox, unionBBox } from './path.mjs';

const faces = new Map();

async function hbFont(spec) {
  const hb = await loadHarfBuzz();
  const info = resolveFont(spec);
  const key = `${info.file}|${info.weight}`;
  if (!faces.has(key)) {
    const face = new hb.Face(new hb.Blob(info.bytes), 0);
    const font = new hb.Font(face);
    if (!info.static && info.weight) font.setVariations([new hb.Variation('wght', info.weight)]);
    const unicodes = new Set(face.collectUnicodes());
    faces.set(key, { hb, face, font, info, unicodes, upem: face.upem });
  }
  return faces.get(key);
}

/**
 * @param text string (normalized to Persian letters/digits unless normalize: false)
 * @param spec font spec ("vazirmatn-black", "estedad:800", or a .ttf path)
 * @param opts { size = 100, base = 'auto', tracking = 0 (em; applied to LTR runs only), normalize = true }
 * @returns { d, glyphs:[{d,x,run,cluster}], width, ascender, descender, xHeight, capHeight, bbox, runs, missing, warnings, text }
 */
export async function shapeText(text, spec, { size = 100, base = 'auto', tracking = 0, normalize = true } = {}) {
  const { hb, font, info, unicodes, upem } = await hbFont(spec);
  const warnings = [];
  let t = text;
  if (normalize) { const n = normalizePersian(text); t = n.text; warnings.push(...n.changes); }
  const s = size / upem;
  const { runs } = bidiRuns(t, base);
  const glyphs = [];
  const missing = new Set();
  for (const ch of t) { const c = ch.codePointAt(0); if (!unicodes.has(c) && c !== 0x20 && c !== 0x200c && c !== 0x200d) missing.add(ch); }
  if (t.includes('‌') && !unicodes.has(0x200c)) warnings.push('this font has no ZWNJ glyph; HarfBuzz still breaks the join, but verify the rendering (display fonts)');
  if (tracking && runs.some((r) => r.dir === 'rtl')) warnings.push('tracking is never applied to Persian runs (it breaks the joins)');
  let x = 0;
  runs.forEach((run, ri) => {
    const buf = new hb.Buffer();
    buf.addText(run.text);
    buf.guessSegmentProperties();
    buf.setDirection(run.dir === 'rtl' ? hb.Direction.RTL : hb.Direction.LTR);
    if (run.dir === 'rtl') buf.setLanguage('fa');
    hb.shape(font, buf);
    const infos = buf.getGlyphInfos();
    const pos = buf.getGlyphPositions();
    infos.forEach((g, i) => {
      if (g.codepoint === 0) missing.add(run.text[g.cluster] || '?');
      const raw = font.glyphToPath(g.codepoint);
      if (raw) {
        const d = transformPath(raw, { sx: s, sy: -s, tx: (x + pos[i].xOffset) * s, ty: -pos[i].yOffset * s });
        glyphs.push({ d, x: (x + pos[i].xOffset) * s, run: ri, cluster: g.cluster });
      }
      x += pos[i].xAdvance;
      if (run.dir === 'ltr' && tracking && i < infos.length - 1) x += tracking * upem;
    });
  });
  const ext = font.hExtents();
  const metric = (tag, fb) => { try { return font.getMetricPositionWithFallback(tag) * s; } catch { return fb; } };
  let bbox = null;
  for (const g of glyphs) bbox = unionBBox(bbox, pathBBox(g.d));
  if (missing.size) warnings.push(`missing glyphs in ${info.id}: ${[...missing].join(' ')}`);
  return {
    text: t, d: glyphs.map((g) => g.d).join(''), glyphs, width: x * s,
    ascender: ext.ascender * s, descender: ext.descender * s,
    xHeight: metric(hb.MetricsTag.X_HEIGHT, size * 0.5), capHeight: metric(hb.MetricsTag.CAP_HEIGHT, size * 0.7),
    bbox, runs, missing: [...missing], warnings, font: info.id,
  };
}
