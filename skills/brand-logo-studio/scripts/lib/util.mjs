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
