/**
 * brand-logo-studio — util.mjs
 * Small self-contained helpers: color contrast, PNG decoding, ICO writing, output-folder guard,
 * Chrome detection. Zero dependencies (node:zlib for PNG).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { SKILL_DIR } from './vendor.mjs';

// ---------- color ----------
export function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let x = m[1]; if (x.length === 3) x = [...x].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export function contrast(a, b) {
  const x = luminance(hexToRgb(a)), y = luminance(hexToRgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const ratio = (a, b) => (Math.floor(contrast(a, b) * 100) / 100).toFixed(2);

// OKLab/OKLCH (Ottosson) — only what is needed to shift a color's lightness at a fixed hue.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
export function hexToOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180) / Math.PI };
}
function oklchToRgb({ l: L, c, h }) {
  const A = c * Math.cos((h * Math.PI) / 180), B = c * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
/** OKLCH → hex, reducing chroma until the color fits in sRGB (hue and lightness kept). */
export function oklchToHex(o) {
  const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let lo = 0, hi = o.c, rgb = oklchToRgb(o);
  if (!inGamut(rgb)) { for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToRgb({ ...o, c: mid }))) lo = mid; else hi = mid; } rgb = oklchToRgb({ ...o, c: lo }); }
  return '#' + rgb.map((v) => Math.round(toGam(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0')).join('');
}
/**
 * The color closest to `hex` (same hue) that reaches `target` contrast against `against`.
 * Tries the palette scale stops first (keeps the kit on-palette), then shifts OKLCH lightness.
 * Returns { hex, ratio, from: 'as-is' | 'scale <stop>' | 'lightness', ok }.
 */
export function toContrast(hex, against, target = 3, scale = null) {
  if (contrast(hex, against) >= target) return { hex, ratio: contrast(hex, against), from: 'as-is', ok: true };
  const base = hexToOklch(hex), darker = hexToOklch(against).l > base.l; // a light background needs a darker color
  let shift = { hex, ratio: contrast(hex, against), from: 'lightness', ok: false };
  for (let i = 1; i <= 100; i++) {
    const l = darker ? base.l - i * 0.01 : base.l + i * 0.01;
    if (l <= 0 || l >= 1) break;
    const h = oklchToHex({ ...base, l });
    shift = { hex: h, ratio: contrast(h, against), from: 'lightness', ok: contrast(h, against) >= target };
    if (shift.ok) break;
  }
  // A palette stop wins only when it is about as close to the original as the minimal shift (ΔL ≤ 0.06):
  // staying on-palette is nice, jumping from gold to brown is not.
  if (scale && shift.ok) {
    const cands = Object.entries(scale).filter(([, h]) => contrast(h, against) >= target && Math.abs(hexToOklch(h).l - hexToOklch(shift.hex).l) <= 0.06);
    if (cands.length) {
      cands.sort((a, b) => Math.abs(hexToOklch(a[1]).l - base.l) - Math.abs(hexToOklch(b[1]).l - base.l));
      return { hex: cands[0][1], ratio: contrast(cands[0][1], against), from: `scale ${cands[0][0]}`, ok: true };
    }
  }
  return shift;
}

// ---------- PNG decode (8-bit RGB/RGBA/gray, non-interlaced — Chrome screenshots and resvg output) ----------
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), kind = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (kind === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; type = data[9]; interlace = data[12]; }
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace) throw new Error(`unsupported PNG (depth ${depth}, interlace ${interlace})`);
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (!ch) throw new Error(`unsupported PNG color type ${type}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch, out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0, b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      line[i] = (line[i] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
    for (let x = 0; x < width; x++) {
      const s = x * ch, d = (y * width + x) * 4;
      if (ch === 1 || ch === 2) { out[d] = out[d + 1] = out[d + 2] = line[s]; out[d + 3] = ch === 2 ? line[s + 1] : 255; }
      else { out[d] = line[s]; out[d + 1] = line[s + 1]; out[d + 2] = line[s + 2]; out[d + 3] = ch === 4 ? line[s + 3] : 255; }
    }
    prev = line;
  }
  return { width, height, pixels: out };
}

// ---------- PNG encode (8-bit RGBA, filter 0) — for diagnostic images ----------
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
export function encodePng(width, height, rgba) {
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- ICO (BMP/DIB entries: decoded by every browser and by Windows' own icon loader) ----------
/** images: [{ size, pixels (RGBA, size×size, straight alpha) }] → Buffer */
export function encodeIco(images) {
  const dibs = images.map(({ size, pixels }) => {
    const andStride = Math.ceil(size / 32) * 4;
    const dib = Buffer.alloc(40 + size * size * 4 + andStride * size);
    dib.writeUInt32LE(40, 0); dib.writeInt32LE(size, 4); dib.writeInt32LE(size * 2, 8);
    dib.writeUInt16LE(1, 12); dib.writeUInt16LE(32, 14); dib.writeUInt32LE(0, 16); dib.writeUInt32LE(size * size * 4, 20);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const s = ((size - 1 - y) * size + x) * 4, d = 40 + (y * size + x) * 4; // bottom-up BGRA
      dib[d] = pixels[s + 2]; dib[d + 1] = pixels[s + 1]; dib[d + 2] = pixels[s]; dib[d + 3] = pixels[s + 3];
      if (pixels[s + 3] === 0) { const a = 40 + size * size * 4 + y * andStride + (x >> 3); dib[a] |= 0x80 >> (x & 7); }
    }
    return dib;
  });
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size }, i) => {
    const e = 6 + 16 * i;
    head[e] = size >= 256 ? 0 : size; head[e + 1] = size >= 256 ? 0 : size; head[e + 2] = 0; head[e + 3] = 0;
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6); head.writeUInt32LE(dibs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += dibs[i].length;
  });
  return Buffer.concat([head, ...dibs]);
}

/** Convert resvg's premultiplied RGBA to straight alpha (ICO/BMP expect straight). */
export function unpremultiply(px) {
  const out = Buffer.from(px);
  for (let i = 0; i < out.length; i += 4) { const a = out[i + 3]; if (a && a < 255) for (let k = 0; k < 3; k++) out[i + k] = Math.min(255, Math.round((out[i + k] * 255) / a)); }
  return out;
}

// ---------- output guard ----------
const norm = (p) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
const inside = (child, parent) => { const rel = path.relative(norm(parent), norm(child)); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
/** Resolve --out (default ./brand-kit) and refuse the skill/plugin folders. */
export function outDir(given, fallback = 'brand-kit') {
  const out = path.resolve(given || path.join(process.cwd(), fallback));
  const skills = path.dirname(SKILL_DIR);
  const forbidden = [SKILL_DIR, skills];
  if (fs.existsSync(path.join(path.dirname(skills), '.claude-plugin'))) forbidden.push(path.dirname(skills));
  if (forbidden.some((f) => inside(out, f))) {
    console.error(`Refusing to write into the skill/plugin folder (${out}).\nRun from your project folder, or pass --out <your-project>/public/brand.`);
    process.exit(2);
  }
  fs.mkdirSync(out, { recursive: true });
  return out;
}

// ---------- Chrome / Edge / Chromium (optional) ----------
/** Path to an installed Chromium-family browser, or null. Never downloads one. */
export function findChrome() {
  const env = process.env.CHROME_PATH;
  if (env === 'none') return null; // explicit opt-out (also used by the self-test)
  if (env && fs.existsSync(env)) return env;
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const pf = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], 'C:\\Program Files', 'C:\\Program Files (x86)'].filter(Boolean);
  const candidates = process.platform === 'win32'
    ? [...pf.map((p) => path.join(p, 'Google', 'Chrome', 'Application', 'chrome.exe')), path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
       ...pf.map((p) => path.join(p, 'Microsoft', 'Edge', 'Application', 'msedge.exe')), ...pf.map((p) => path.join(p, 'Chromium', 'Application', 'chrome.exe'))]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
  for (const c of candidates) {
    if (path.isAbsolute(c)) { if (fs.existsSync(c)) return c; }
    else { const w = spawnSync('which', [c], { encoding: 'utf8' }); if (w.status === 0 && w.stdout.trim()) return w.stdout.trim(); }
  }
  return null;
}

/** Headless screenshot of a local HTML file. Returns { png } or { png: null, reason }. */
export function chromeScreenshot(chrome, htmlFile, width, height) {
  const out = path.join(os.tmpdir(), `bls-shot-${process.pid}-${Date.now()}.png`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'bls-chrome-'));
  const url = 'file:///' + path.resolve(htmlFile).replace(/\\/g, '/').replace(/^\/+/, '');
  const args = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
    '--force-device-scale-factor=1', `--window-size=${width},${height}`, `--screenshot=${out}`, '--virtual-time-budget=3000', url];
  const r = spawnSync(chrome, args, { encoding: 'utf8', timeout: 60000 });
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* temp profile cleanup is best effort */ }
  if (!fs.existsSync(out)) return { png: null, reason: (r.stderr || r.error?.message || 'no screenshot').split('\n').slice(-3).join(' ') };
  const png = fs.readFileSync(out);
  fs.rmSync(out, { force: true });
  return { png };
}
