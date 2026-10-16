/**
 * brand-logo-studio — validate.mjs
 * Checks for logo SVGs. Each finding: { level: 'FAIL'|'WARN'|'ok', id, msg }.
 * What a check passing does NOT prove: that the logo is good, original or legible to people — the
 * contact sheet and the proof sheet must still be looked at (references/logo-review-checklist.md).
 */
import { render } from './vendor.mjs';
import { contrast, hexToRgb } from './util.mjs';

const vbOf = (svg) => { const m = svg.match(/viewBox="([-\d.\s]+)"/); return m ? m[1].trim().split(/\s+/).map(Number) : null; };
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** Recolor every painted element outside <mask>/<clipPath> to one color (masks keep their black/white). */
export function oneColor(svg, color) {
  return svg.split(/(<mask[\s\S]*?<\/mask>|<clipPath[\s\S]*?<\/clipPath>)/).map((seg, i) => (i % 2 ? seg : seg.replace(/(fill|stroke)="(?!none)[^"]*"/g, `$1="${color}"`))).join('');
}

/** Painted colors used in an SVG (outside masks). */
export function paints(svg) {
  const out = new Set();
  svg.split(/<mask[\s\S]*?<\/mask>|<clipPath[\s\S]*?<\/clipPath>/).forEach((seg) => { for (const m of seg.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)) out.add(m[1].toLowerCase()); });
  return [...out];
}

/** Ink outside the viewBox: render with a 25% margin and look for pixels beyond the original box. */
async function clipping(svg) {
  const [x, y, w, h] = vbOf(svg), mx = w * 0.25, my = h * 0.25;
  const wide = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x - mx} ${y - my} ${w + 2 * mx} ${h + 2 * my}">${inner(svg)}</svg>`;
  const r = await render(wide, { width: 300 });
  const sx = r.width / (w + 2 * mx), sy = r.height / (h + 2 * my);
  const bx0 = Math.floor(mx * sx) - 1, bx1 = Math.ceil((mx + w) * sx) + 1, by0 = Math.floor(my * sy) - 1, by1 = Math.ceil((my + h) * sy) + 1;
  let outside = 0;
  for (let py = 0; py < r.height; py++) for (let px = 0; px < r.width; px++) {
    if (px >= bx0 && px <= bx1 && py >= by0 && py <= by1) continue;
    if (r.pixels[(py * r.width + px) * 4 + 3] > 24) outside++;
  }
  return outside;
}

/**
 * Contrast of each painted color against the color it actually touches (rendered, 2 px away):
 * a gold dot inside a teal square is judged against the teal, not against the page.
 */
async function neighbourContrast(svg, bg) {
  const cols = [...new Set([...paints(svg), bg].filter((p) => hexToRgb(p)))];
  const rgb = cols.map((p) => hexToRgb(p).map((v) => v * 255));
  const r = await render(svg, { width: 512, background: bg }), W = r.width, H = r.height;
  const cls = new Int16Array(W * H).fill(-1);
  for (let i = 0; i < W * H; i++) {
    const px = r.pixels.subarray(i * 4, i * 4 + 3);
    for (let k = 0; k < rgb.length; k++) if (Math.abs(px[0] - rgb[k][0]) + Math.abs(px[1] - rgb[k][1]) + Math.abs(px[2] - rgb[k][2]) <= 12) { cls[i] = k; break; }
  }
  // only interior pixels (all 4 neighbours the same color): anti-aliased edges can look like another paint
  const raw = cls.slice();
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, k = raw[i]; if (k >= 0 && (raw[i - 1] !== k || raw[i + 1] !== k || raw[i - W] !== k || raw[i + W] !== k)) cls[i] = -1; }
  const counts = cols.map(() => new Map());
  for (let y = 4; y < H - 4; y++) for (let x = 4; x < W - 4; x++) {
    const a = cls[y * W + x];
    if (a < 0 || cols[a] === bg) continue;
    for (const j of [y * W + x + 4, y * W + x - 4, (y + 4) * W + x, (y - 4) * W + x]) { const b = cls[j]; if (b >= 0 && b !== a) counts[a].set(b, (counts[a].get(b) || 0) + 1); }
  }
  const out = [];
  counts.forEach((m, a) => {
    const total = [...m.values()].reduce((s, v) => s + v, 0);
    for (const [b, n] of m) if (n / total >= 0.2) out.push({ color: cols[a], against: cols[b], ratio: contrast(cols[a], cols[b]) });
  });
  return out;
}

/** Share of interior detail that only color separates (lost when printed in one color). */
async function colorOnlyDetail(svg) {
  const a = await render(svg, { width: 256 }), b = await render(oneColor(svg, '#000000'), { width: 256 });
  const W = a.width, H = a.height, A = (x, y) => b.pixels[(y * W + x) * 4 + 3];
  let colorEdges = 0, perimeter = 0;
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
    const i = (y * W + x) * 4;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const j = ((y + dy) * W + x + dx) * 4;
      if (!(A(x, y) > 230 && A(x + dx, y + dy) > 230)) { if ((A(x, y) > 128) !== (A(x + dx, y + dy) > 128)) perimeter++; continue; }
      const diff = Math.abs(a.pixels[i] - a.pixels[j]) + Math.abs(a.pixels[i + 1] - a.pixels[j + 1]) + Math.abs(a.pixels[i + 2] - a.pixels[j + 2]);
      if (diff > 90) colorEdges++;
    }
  }
  return perimeter ? colorEdges / perimeter : 0;
}

/** Small-size test: share of 16 px ink pixels that are only partly covered. Thin-stroke marks blur (> 50% = weak). */
export async function smallSizeScore(svg, size = 16) {
  const r = await render(oneColor(svg, '#000000'), { width: size });
  let ink = 0, part = 0;
  for (let i = 3; i < r.pixels.length; i += 4) { const a = r.pixels[i]; if (a > 20) { ink++; if (a < 200) part++; } }
  const partialShare = ink ? part / ink : 1;
  return { partialShare, weak: partialShare > 0.5 };
}

/** Farthest ink pixel from the center, as a share of the size (maskable icons need ≤ 0.40). */
export async function inkRadius(svg, size = 512) {
  const r = await render(svg, { width: size });
  let max = 0;
  const cx = r.width / 2, cy = r.height / 2;
  for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) if (r.pixels[(y * r.width + x) * 4 + 3] > 24) max = Math.max(max, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
  return max / size;
}

/**
 * @param svg string
 * @param opts { kind: 'light'|'reversed'|'mono-black'|'mono-white', lightBg, darkBg, allowStyle }
 */
export async function validateSvg(svg, opts = {}) {
  const f = [];
  const add = (level, id, msg) => f.push({ level, id, msg });
  if (/<(text|tspan|textPath)\b/.test(svg)) add('FAIL', 'live-text', 'contains <text>: it renders with whatever font the viewer has (often broken Persian). Outline it with text-to-path.mjs.');
  if (/<(image|foreignObject|script|iframe)\b/.test(svg)) add('FAIL', 'embedded', 'contains <image>, <foreignObject> or <script> — a logo must be pure vector shapes.');
  if (/(href|src)="(https?:|file:|\/\/)/.test(svg) || /url\((['"]?)(https?:|\/\/)/.test(svg) || /@import/.test(svg)) add('FAIL', 'external', 'references an external file or URL.');
  if (/<style\b/.test(svg) && !opts.allowStyle) add('WARN', 'style', '<style> block — only the adaptive favicon should carry one.');
  const vb = vbOf(svg);
  if (!vb) { add('FAIL', 'viewbox', 'no viewBox: the logo cannot scale.'); return f; }
  const elements = (svg.match(/<(path|rect|circle|ellipse|polygon|polyline|line|g)\b/g) || []).length;
  if (elements > 300) add('WARN', 'complexity', `${elements} shapes — simplify; complex logos fail at small sizes.`);
  const out = await clipping(svg);
  add(out ? 'FAIL' : 'ok', 'clipping', out ? `${out} pixels of ink fall outside the viewBox (clipped when displayed).` : 'nothing outside the viewBox');
  const adaptive = /prefers-color-scheme/.test(svg);
  if (adaptive) add('ok', 'contrast', 'adaptive favicon: light and dark variants are checked as logo-icon.svg and logo-icon-reversed.svg');
  const bg = opts.kind === 'reversed' || opts.kind === 'mono-white' ? opts.darkBg || '#0b1220' : opts.lightBg || '#ffffff';
  if (!adaptive) for (const { color, against, ratio } of await neighbourContrast(svg, bg)) {
    if (ratio < 3) add('WARN', 'contrast', `${color} is ${ratio.toFixed(2)}:1 against ${against}, the color it touches (logo shapes need ≥ 3:1, WCAG 1.4.11; logos are exempt, but a faint part disappears).`);
  }
  if (opts.kind !== 'mono-black' && opts.kind !== 'mono-white') {
    const share = await colorOnlyDetail(svg);
    add(share > 0.15 ? 'WARN' : 'ok', 'one-color', share > 0.15 ? `${Math.round(share * 100)}% of the inner detail is separated by color only — in one-color print those parts merge. Prefer real gaps (cutouts).` : 'survives one-color printing (separations are real gaps)');
  }
  return f;
}
