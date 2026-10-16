#!/usr/bin/env node
/**
 * web-ui-playbook audit — zero-dependency checker for HTML / Blade / JSX / TSX / Vue / CSS.
 *
 * Usage:
 *   node audit.mjs <file-or-dir> [more...] [--iran] [--rtl] [--json] [--contrast [--css <file-or-dir>]]
 *                  [--slop] [--render <built-page.html> [--render-root <public-dir>]]
 *
 *   --iran       users are inside Iran: foreign runtime hosts become errors everywhere
 *   --rtl        force Persian/RTL checks (auto-detected from lang="fa", dir="rtl" or Persian text)
 *   --json       machine-readable output
 *   --contrast   check every text element's color against its background (light + dark), using the
 *                project's tokens (CSS files among the targets, --css, or ./resources/css and ./src)
 *                and Tailwind's default palette. Pairs it cannot determine (dynamic classes, Blade/JSX
 *                components, background images, unknown colors) are listed as "could not resolve" —
 *                never counted as passed. Small Persian text (< 14px) below 5.5:1 is a house-rule warning.
 *   --slop       generic-page tells as warnings (data/fa-slop.json, data/en-slop.json; project overrides in
 *                .slop-allow.json) and a list of every number claim and quote for the OWNER to confirm.
 *                The audit cannot verify truth; passing it does not prove the page is good.
 *   --render     open a built page in the installed Chrome/Edge (headless, local server, no network) and measure
 *                real colors after JS/Alpine ran (light + dark), overflow and headline lines at 1440/768/375,
 *                loaded fonts and Persian text under 13px. Resolves pairs --contrast could not. No browser → skipped.
 *
 * Exit code 1 when errors exist. Warnings need a human decision (fix, or explain why acceptable).
 * Suppress a line: put the text "audit-ignore" in a comment on that line or the line above.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slopAudit, loadAllow } from './slop.mjs';
import { renderAudit } from './render.mjs';

const isMain = !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
const args = isMain ? process.argv.slice(2) : [];
const flags = new Set(args.filter((a) => a.startsWith('--')));
const VALUE_FLAGS = ['--css', '--render', '--render-root'];
const valuesOf = (f) => args.flatMap((a, i) => (args[i - 1] === f ? [a] : []));
const cssArgs = valuesOf('--css');
const targets = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
if (isMain && !targets.length) {
  console.log('Usage: node audit.mjs <file-or-dir> [...] [--iran] [--rtl] [--json] [--contrast [--css <file-or-dir>]] [--slop] [--render <page.html> [--render-root <dir>]]');
  process.exit(2);
}

const EXT = /\.(html?|blade\.php|jsx|tsx|vue|css)$/i;
const SKIP_DIR = /^(node_modules|vendor|\.git|dist|build|storage|bootstrap|\.next|\.nuxt|coverage)$/;

function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) {
      if (SKIP_DIR.test(name)) continue;
      walk(path.join(p, name), out);
    }
  } else if (EXT.test(p) && !/\.min\.css$/i.test(p)) out.push(p);
  return out;
}

// ---------- helpers ----------
const blank = (s) => s.replace(/[^\n]/g, ' ');
const PERSIAN = /[؀-ۿ]/;
const PERSIAN_LETTERS_G = /[ء-يپچژکگی]/g;

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return (idx) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

/** Remove comments (keeping line structure). */
function stripComments(src, isCss) {
  let s = src.replace(/<!--[\s\S]*?-->/g, blank).replace(/\{\{--[\s\S]*?--\}\}/g, blank);
  s = s.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!isCss) s = s.replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  return s;
}

/** Visible text only: drop script/style, Blade/PHP expressions, then tags. */
function visibleText(s) {
  return s
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, blank)
    .replace(/@php[\s\S]*?@endphp/g, blank)
    .replace(/<\?php[\s\S]*?\?>/g, blank)
    .replace(/\{\{[\s\S]*?\}\}|\{!![\s\S]*?!!\}/g, blank)
    .replace(/<code\b[\s\S]*?<\/code>|<pre\b[\s\S]*?<\/pre>/gi, blank)
    .replace(/<[^>]*>/g, blank);
}

const FOREIGN_HOSTS = [
  'fonts.googleapis.com', 'fonts.gstatic.com', 'fonts.bunny.net', 'use.typekit.net', 'use.fontawesome.com',
  'kit.fontawesome.com', 'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com', 'cdn.tailwindcss.com',
  'code.jquery.com', 'googletagmanager.com', 'google-analytics.com', 'google.com/recaptcha', 'gstatic.com/recaptcha',
  'maps.googleapis.com', 'google.com/maps/embed', 'youtube.com/embed', 'youtube-nocookie.com', 'player.vimeo.com',
  'connect.facebook.net', 'gravatar.com', 'ui-avatars.com', 'images.unsplash.com', 'source.unsplash.com',
];

// Tailwind physical-direction utilities → logical replacement
const PHYSICAL = [
  [/^-?m[lr]-/, 'ms-*/me-*'], [/^-?p[lr]-/, 'ps-*/pe-*'], [/^-?(left|right)-/, 'start-*/end-*'],
  [/^text-(left|right)$/, 'text-start/text-end'], [/^float-(left|right)$/, 'float-start/float-end'],
  [/^border-[lr](-|$)/, 'border-s/border-e'], [/^rounded-[lr](-|$)/, 'rounded-s/rounded-e'],
  [/^rounded-(tl|tr|bl|br)(-|$)/, 'rounded-ss/se/es/ee'], [/^scroll-[mp][lr]-/, 'scroll-ms/me/ps/pe'],
  [/^clear-(left|right)$/, 'clear-start/clear-end'],
];

// ---------- audit one file ----------
const CLAIMS = [];
function auditFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const isCss = /\.css$/i.test(file);
  const isPage = /\.(html?|blade\.php)$/i.test(file);
  const findings = [];
  const rawLines = raw.split('\n');
  const ignored = new Set();
  rawLines.forEach((l, i) => { if (l.includes('audit-ignore')) { ignored.add(i + 1); ignored.add(i + 2); } });
  const src = stripComments(raw, isCss);
  const lineOf = lineIndex(src);
  const add = (sev, rule, idx, msg) => {
    const line = typeof idx === 'number' ? lineOf(idx) : 0;
    if (line && ignored.has(line)) return;
    findings.push({ file, line, sev, rule, msg });
  };

  const persianCount = (src.match(PERSIAN_LETTERS_G) || []).length;
  const rtl = flags.has('--rtl') || /\bdir\s*=\s*["']rtl["']/.test(src) || /\blang\s*=\s*["']fa/.test(src)
    || /:lang\(fa\)|Vazirmatn/.test(src) || persianCount > 20;
  const iran = flags.has('--iran');

  // 1. Foreign runtime hosts
  for (const host of FOREIGN_HOSTS) {
    const re = new RegExp(host.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g');
    let m;
    while ((m = re.exec(src))) {
      add(iran || rtl ? 'error' : 'warn', 'foreign-host', m.index,
        `Runtime request to ${host} — self-host/bundle it or use a domestic alternative (iran-network-resilience.md).`);
    }
  }

  // 2. Arabic digits / letters (never valid in Persian UI)
  for (const m of src.matchAll(/[٠-٩]+/g))
    add('error', 'arabic-digits', m.index, `Arabic-Indic digits "${m[0]}" — use Persian ۰–۹ (U+06F0–06F9).`);
  for (const m of src.matchAll(/[يكى]/g))
    add('error', 'arabic-letters', m.index, `Arabic "${m[0]}" — use Persian ی / ک.`);

  // 3. Class attributes
  const classRe = /(?:\bclass|\bclassName|:class|x-bind:class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})|->class\(\s*'([^']*)'|\$base\s*=\s*'([^']*)'/g;
  for (const m of src.matchAll(classRe)) {
    const list = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
    const tokens = list.split(/\s+/).filter(Boolean);
    const tagStart = src.lastIndexOf('<', m.index);
    const tagEnd = src.indexOf('>', m.index);
    const tag = tagStart >= 0 && tagEnd > 0 ? src.slice(tagStart, tagEnd) : '';
    const latinEl = /\blang\s*=\s*["']en|\bdir\s*=\s*["']ltr/.test(tag);
    const hasFocusStyle = tokens.some((t) => /(^|:)focus(-visible)?:(ring|outline-(?!none)|border|shadow)/.test(t));
    for (const tok of tokens) {
      const parts = tok.replace(/^!/, '').split(':');
      const util = parts.pop().replace(/^!/, '');
      const variants = parts;
      const dirVariant = variants.includes('rtl') || variants.includes('ltr');
      if (rtl && !dirVariant) {
        for (const [re, fix] of PHYSICAL) {
          if (re.test(util)) add('error', 'physical-direction', m.index, `"${tok}" is physical — use ${fix} so RTL mirrors.`);
        }
        if (/^space-x-/.test(util)) add('warn', 'space-x', m.index, `"${tok}" misorders in RTL — prefer gap-*.`);
        if (/^flex-row-reverse$/.test(util)) add('warn', 'row-reverse', m.index, `"${tok}" — don't fake RTL with row-reverse (double reversal under dir="rtl").`);
        if (!latinEl) {
          if (/^tracking-(?!normal$)/.test(util)) add('warn', 'fa-tracking', m.index, `"${tok}" on Persian text breaks letter joins (ok only on lang="en" elements).`);
          if (/^(italic|uppercase|lowercase|capitalize)$/.test(util)) add('warn', 'fa-latin-style', m.index, `"${tok}" has no meaning / distorts Persian.`);
          if (/^leading-(none|tight|3|4|5)$|^leading-\[(0|1(\.[0-4]\d*)?)\]$/.test(util)) add('warn', 'fa-line-height', m.index, `"${tok}" clips Persian dots/descenders — keep line-height ≥ 1.5 (controls) / 1.75 (body).`);
        }
      }
      if (/^(min-|max-)?h-screen$/.test(util)) add('warn', 'vh-unit', m.index, `"${tok}" uses 100vh — use h-dvh/min-h-dvh (mobile browser bars).`);
      if (/\[#[0-9a-fA-F]{3,8}\]/.test(util)) add('warn', 'hardcoded-color', m.index, `"${tok}" hardcodes a color — use a semantic token (bg-primary, text-muted…).`);
      if (/^outline-none$/.test(util) && !hasFocusStyle) add('error', 'focus-removed', m.index, `"${tok}" without a focus-visible ring replacement.`);
    }
  }

  // 4. CSS / inline style physical properties & Persian typography
  const cssLike = isCss ? src : [...src.matchAll(/\bstyle\s*=\s*"([^"]*)"/g)].map((m) => ({ text: m[1], idx: m.index }));
  const cssChecks = (text, base) => {
    const rules = [
      [/\b(margin|padding)-(left|right)\s*:/g, 'error', 'use margin-inline-start/end, padding-inline-start/end'],
      [/(^|[\s;{])(left|right)\s*:\s*[^;}]/g, 'error', 'use inset-inline-start/end'],
      [/text-align\s*:\s*(left|right)/g, 'error', 'use text-align: start/end'],
      [/float\s*:\s*(left|right)/g, 'error', 'use float: inline-start/inline-end'],
      [/border-(left|right)(-[a-z]+)?\s*:/g, 'error', 'use border-inline-start/end'],
    ];
    if (rtl) for (const [re, sev, fix] of rules) for (const m of text.matchAll(re)) add(sev, 'physical-css', base + m.index, `Physical CSS "${m[0].trim()}" — ${fix}.`);
    for (const m of text.matchAll(/outline\s*:\s*(none|0)\b/g)) add('warn', 'focus-removed', base + m.index, 'outline removed — make sure :focus-visible has a visible replacement.');
    if (rtl) for (const m of text.matchAll(/(?<![\w-])letter-spacing\s*:(?!\s*(0(px|em|rem)?(?![\d.])|normal))[^;}]+/g)) add('warn', 'fa-tracking', base + m.index, `"${m[0]}" — Persian needs letter-spacing 0.`);
    for (const m of text.matchAll(/(?<!-)\b100vh\b/g)) add('warn', 'vh-unit', base + m.index, '100vh — prefer 100dvh.');
  };
  if (isCss) cssChecks(src, 0); else for (const { text, idx } of cssLike) cssChecks(text, idx);

  // 5. Page structure
  if (!isCss) {
    // sticky table header inside a horizontal-only scroller sticks to the wrong box
    for (const m of src.matchAll(/overflow-x-auto[^>]*>\s*<table[\s\S]{0,600}?<thead[^>]*\bsticky\b[^>]*\btop-(?!0\b)/g))
      add('warn', 'sticky-in-scroller', m.index, 'Sticky <thead> inside overflow-x-auto: make the wrapper the scroll container (max-h-[70dvh] overflow-auto) and use top-0.');
    const htmlTag = src.match(/<html\b[^>]*>/i);
    if (htmlTag) {
      if (!/\blang\s*=/.test(htmlTag[0])) add('error', 'html-lang', htmlTag.index, '<html> has no lang attribute.');
      if (persianCount > 20 && !/\bdir\s*=/.test(src)) add('error', 'html-dir', htmlTag.index, 'Persian content but no dir="rtl" anywhere.');
      const h1s = [...src.matchAll(/<h1\b/gi)];
      if (h1s.length === 0) add('warn', 'h1', htmlTag.index, 'Page has no <h1>.');
      if (h1s.length > 1) add('warn', 'h1', h1s[1].index, `Page has ${h1s.length} <h1> elements — use one.`);
    }

    // images
    let firstImg = true;
    for (const m of src.matchAll(/<img\b[^>]*>/gi)) {
      const t = m[0];
      if (!/\balt\s*=/.test(t)) add('error', 'img-alt', m.index, '<img> without alt (decorative: alt="").');
      const sized = (/\bwidth\s*=/.test(t) && /\bheight\s*=/.test(t)) || /aspect-|size-\d|\bh-\d+[^"]*\bw-\d+|\bw-\d+[^"]*\bh-\d+/.test(t);
      if (!sized) add('warn', 'img-size', m.index, '<img> without width/height or aspect ratio (CLS).');
      if (firstImg && /loading\s*=\s*["']lazy/.test(t) && !/trustseal\.enamad/.test(t)) add('warn', 'lcp-lazy', m.index, 'First image is lazy-loaded — if it is the hero/LCP image use loading="eager" fetchpriority="high".');
      firstImg = false;
    }
    for (const m of src.matchAll(/<iframe\b[^>]*>/gi)) if (!/\btitle\s*=/.test(m[0])) add('warn', 'iframe-title', m.index, '<iframe> without title.');

    // icon-only buttons / links
    for (const m of src.matchAll(/<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
      const attrs = m[2];
      if (/aria-label(ledby)?\s*=|\btitle\s*=/.test(attrs)) {
        if (rtl) {
          const al = attrs.match(/aria-label\s*=\s*["']([^"']*)["']/);
          if (al && /^[A-Za-z][A-Za-z\s'-]*$/.test(al[1]) && !/\blang\s*=\s*["']en/.test(attrs)) add('warn', 'fa-aria-label', m.index, `English aria-label "${al[1]}" on a Persian page — write it in Persian.`);
        }
        continue;
      }
      const inner = m[3];
      if (/\{\{|\{!!|@lang|__\(|\$t\(|\{[a-zA-Z]/.test(inner)) continue;
      const text = inner.replace(/<[^>]*>/g, '').replace(/&[a-z]+;|&#\d+;/g, '').trim();
      if (!text && /<svg|<img|<i\b|<span/.test(inner)) add('error', 'icon-button-label', m.index, `Icon-only <${m[1]}> without aria-label.`);
    }

    // form labels
    const labelFor = new Set([...src.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
    for (const m of src.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
      const t = m[0];
      if (/type\s*=\s*["'](hidden|submit|button|reset|image)["']/i.test(t)) continue;
      if (/aria-label(ledby)?\s*=/.test(t)) continue;
      const id = t.match(/\bid\s*=\s*["']([^"']+)["']/);
      if (id && labelFor.has(id[1])) continue;
      const before = src.slice(0, m.index);
      if (before.lastIndexOf('<label') > before.lastIndexOf('</label>')) continue;
      add('warn', 'input-label', m.index, `<${m[1]}> has no associated <label> or aria-label (placeholder is not a label).`);
    }
  }

  // 6. Generic-page tells + claims for the owner to confirm (--slop)
  if (flags.has('--slop') && !isCss) {
    const r = slopAudit({ file, raw, src, vis: visibleText(src), lineOf, ignored, allow: loadAllow(path.dirname(file)) });
    findings.push(...r.findings);
    CLAIMS.push(...r.claims);
  }

  // 7. Persian text hygiene (visible text only)
  if (rtl && !isCss) {
    const vis = visibleText(src);
    for (const m of vis.matchAll(/(^|[\s«(])(ن?می) (?=[؀-ۿ])/g))
      add('warn', 'zwnj', m.index + m[1].length, `"${m[2]} " + verb — use ZWNJ: ${m[2]}‌… (نیم‌فاصله).`);
    for (const m of vis.matchAll(/[؀-ۿ] (ها|های|هایی|تر|ترین)(?=[\s.،؛:!؟»)]|$)/g))
      add('warn', 'zwnj', m.index, `Space before "${m[1]}" — use ZWNJ (e.g. کتاب‌ها، بزرگ‌تر).`);
    for (const m of vis.matchAll(/[؀-ۿ]\s?([,?;])(?=\s|$)/g))
      add('warn', 'fa-punctuation', m.index, `Latin "${m[1]}" after Persian text — use ${m[1] === ',' ? '،' : m[1] === '?' ? '؟' : '؛'}.`);
    for (const m of vis.matchAll(/[؀-ۿ]\s+:/g))
      add('warn', 'fa-punctuation', m.index, 'Space before ":" — no space before punctuation in Persian.');
    for (const m of vis.matchAll(/(?<=[؀-ۿ]\s{1,2})(?<![A-Za-z][\w.-]*\s)\d[\d,.]*(?![\w])|(?<![\w.-])\d[\d,.]*(?=\s{1,2}[؀-ۿ])/g)) {
      add('warn', 'fa-latin-digits', m.index, `Latin digits "${m[0]}" next to Persian words — user-facing numbers should be ۰–۹ (ignore if part of a Latin token).`);
    }
    for (const m of vis.matchAll(/"[^"\n]*[؀-ۿ][^"\n]*"/g))
      add('warn', 'fa-quotes', m.index, 'Latin quotes around Persian text — use «…».');
  }
  return findings;
}

// ---------- contrast (--contrast) ----------
// Own copy of the color math so this skill stays self-contained;
// brand-color-system/scripts/selftest.mjs checks it against that skill's color-core.mjs.
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => { const a = Math.abs(c); return a <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * a ** (1 / 2.4) - 0.055); };
const clip01 = (x) => Math.min(1, Math.max(0, x));
function oklchToRgb(l, c, h) {
  const hr = (h * Math.PI) / 180, A = c * Math.cos(hr), B = c * Math.sin(hr);
  const l3 = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3, m3 = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3, s3 = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return { r: gam(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3), g: gam(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3), b: gam(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3) };
}
const pct = (s, scale = 1) => (s.endsWith('%') ? (parseFloat(s) / 100) * scale : parseFloat(s));
function parseColor(input) {
  let s = String(input).trim().toLowerCase();
  if (s === 'white') s = '#ffffff'; else if (s === 'black') s = '#000000'; else if (s === 'transparent') return { r: 0, g: 0, b: 0, alpha: 0 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let x = m[1];
    if (x.length < 6) x = [...x].map((ch) => ch + ch).join('');
    if (x.length !== 6 && x.length !== 8) return null;
    const v = (i) => parseInt(x.slice(i, i + 2), 16) / 255;
    return { r: v(0), g: v(2), b: v(4), alpha: x.length === 8 ? v(6) : 1 };
  }
  m = s.match(/^(rgba?|oklch|hsla?)\(\s*([^)]*)\)$/);
  if (!m) return null;
  const parts = m[2].replace(/\s*\/\s*/, ' / ').split(/[\s,]+/).filter(Boolean).map((p) => (p === 'none' ? '0' : p));
  const sl = parts.indexOf('/');
  const ch = sl >= 0 ? parts.slice(0, sl) : parts.slice(0, 3);
  const aStr = sl >= 0 ? parts[sl + 1] : parts[3];
  if (ch.length !== 3 || ch.some((p) => Number.isNaN(parseFloat(p)))) return null;
  let c;
  if (m[1].startsWith('rgb')) c = { r: pct(ch[0], 255) / 255, g: pct(ch[1], 255) / 255, b: pct(ch[2], 255) / 255 };
  else if (m[1] === 'oklch') c = oklchToRgb(pct(ch[0]), pct(ch[1], 0.4), parseFloat(ch[2]));
  else {
    const H = parseFloat(ch[0]), S = pct(ch[1]), Lh = pct(ch[2]);
    const f = (n) => { const k = (n + H / 30) % 12, a = S * Math.min(Lh, 1 - Lh); return Lh - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    c = { r: f(0), g: f(8), b: f(4) };
  }
  return { ...c, alpha: aStr == null ? 1 : pct(aStr) };
}
const lum = ({ r, g, b }) => 0.2126 * lin(clip01(r)) + 0.7152 * lin(clip01(g)) + 0.0722 * lin(clip01(b));
const contrastRatio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (fg, bg) => { const a = fg.alpha ?? 1; return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), alpha: 1 }; };
const hex2 = (x) => Math.round(clip01(x) * 255).toString(16).padStart(2, '0');
const toHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
export const colorMath = { parse: parseColor, contrast: contrastRatio, composite: over };

// Tailwind CSS default palette (tailwindcss 4.3.3 theme.css, MIT): "family:L C H,…" per stop 50…950.
// Used only when the project does not define the color itself.
const TW = 'red:97.1 0.013 17.38,93.6 0.032 17.717,88.5 0.062 18.334,80.8 0.114 19.571,70.4 0.191 22.216,63.7 0.237 25.331,57.7 0.245 27.325,50.5 0.213 27.518,44.4 0.177 26.899,39.6 0.141 25.723,25.8 0.092 26.042;orange:98 0.016 73.684,95.4 0.038 75.164,90.1 0.076 70.697,83.7 0.128 66.29,75 0.183 55.934,70.5 0.213 47.604,64.6 0.222 41.116,55.3 0.195 38.402,47 0.157 37.304,40.8 0.123 38.172,26.6 0.079 36.259;amber:98.7 0.022 95.277,96.2 0.059 95.617,92.4 0.12 95.746,87.9 0.169 91.605,82.8 0.189 84.429,76.9 0.188 70.08,66.6 0.179 58.318,55.5 0.163 48.998,47.3 0.137 46.201,41.4 0.112 45.904,27.9 0.077 45.635;yellow:98.7 0.026 102.212,97.3 0.071 103.193,94.5 0.129 101.54,90.5 0.182 98.111,85.2 0.199 91.936,79.5 0.184 86.047,68.1 0.162 75.834,55.4 0.135 66.442,47.6 0.114 61.907,42.1 0.095 57.708,28.6 0.066 53.813;lime:98.6 0.031 120.757,96.7 0.067 122.328,93.8 0.127 124.321,89.7 0.196 126.665,84.1 0.238 128.85,76.8 0.233 130.85,64.8 0.2 131.684,53.2 0.157 131.589,45.3 0.124 130.933,40.5 0.101 131.063,27.4 0.072 132.109;green:98.2 0.018 155.826,96.2 0.044 156.743,92.5 0.084 155.995,87.1 0.15 154.449,79.2 0.209 151.711,72.3 0.219 149.579,62.7 0.194 149.214,52.7 0.154 150.069,44.8 0.119 151.328,39.3 0.095 152.535,26.6 0.065 152.934;emerald:97.9 0.021 166.113,95 0.052 163.051,90.5 0.093 164.15,84.5 0.143 164.978,76.5 0.177 163.223,69.6 0.17 162.48,59.6 0.145 163.225,50.8 0.118 165.612,43.2 0.095 166.913,37.8 0.077 168.94,26.2 0.051 172.552;teal:98.4 0.014 180.72,95.3 0.051 180.801,91 0.096 180.426,85.5 0.138 181.071,77.7 0.152 181.912,70.4 0.14 182.503,60 0.118 184.704,51.1 0.096 186.391,43.7 0.078 188.216,38.6 0.063 188.416,27.7 0.046 192.524;cyan:98.4 0.019 200.873,95.6 0.045 203.388,91.7 0.08 205.041,86.5 0.127 207.078,78.9 0.154 211.53,71.5 0.143 215.221,60.9 0.126 221.723,52 0.105 223.128,45 0.085 224.283,39.8 0.07 227.392,30.2 0.056 229.695;sky:97.7 0.013 236.62,95.1 0.026 236.824,90.1 0.058 230.902,82.8 0.111 230.318,74.6 0.16 232.661,68.5 0.169 237.323,58.8 0.158 241.966,50 0.134 242.749,44.3 0.11 240.79,39.1 0.09 240.876,29.3 0.066 243.157;blue:97 0.014 254.604,93.2 0.032 255.585,88.2 0.059 254.128,80.9 0.105 251.813,70.7 0.165 254.624,62.3 0.214 259.815,54.6 0.245 262.881,48.8 0.243 264.376,42.4 0.199 265.638,37.9 0.146 265.522,28.2 0.091 267.935;indigo:96.2 0.018 272.314,93 0.034 272.788,87 0.065 274.039,78.5 0.115 274.713,67.3 0.182 276.935,58.5 0.233 277.117,51.1 0.262 276.966,45.7 0.24 277.023,39.8 0.195 277.366,35.9 0.144 278.697,25.7 0.09 281.288;violet:96.9 0.016 293.756,94.3 0.029 294.588,89.4 0.057 293.283,81.1 0.111 293.571,70.2 0.183 293.541,60.6 0.25 292.717,54.1 0.281 293.009,49.1 0.27 292.581,43.2 0.232 292.759,38 0.189 293.745,28.3 0.141 291.089;purple:97.7 0.014 308.299,94.6 0.033 307.174,90.2 0.063 306.703,82.7 0.119 306.383,71.4 0.203 305.504,62.7 0.265 303.9,55.8 0.288 302.321,49.6 0.265 301.924,43.8 0.218 303.724,38.1 0.176 304.987,29.1 0.149 302.717;fuchsia:97.7 0.017 320.058,95.2 0.037 318.852,90.3 0.076 319.62,83.3 0.145 321.434,74 0.238 322.16,66.7 0.295 322.15,59.1 0.293 322.896,51.8 0.253 323.949,45.2 0.211 324.591,40.1 0.17 325.612,29.3 0.136 325.661;pink:97.1 0.014 343.198,94.8 0.028 342.258,89.9 0.061 343.231,82.3 0.12 346.018,71.8 0.202 349.761,65.6 0.241 354.308,59.2 0.249 0.584,52.5 0.223 3.958,45.9 0.187 3.815,40.8 0.153 2.432,28.4 0.109 3.907;rose:96.9 0.015 12.422,94.1 0.03 12.58,89.2 0.058 10.001,81 0.117 11.638,71.2 0.194 13.428,64.5 0.246 16.439,58.6 0.253 17.585,51.4 0.222 16.935,45.5 0.188 13.697,41 0.159 10.272,27.1 0.105 12.094;slate:98.4 0.003 247.858,96.8 0.007 247.896,92.9 0.013 255.508,86.9 0.022 252.894,70.4 0.04 256.788,55.4 0.046 257.417,44.6 0.043 257.281,37.2 0.044 257.287,27.9 0.041 260.031,20.8 0.042 265.755,12.9 0.042 264.695;gray:98.5 0.002 247.839,96.7 0.003 264.542,92.8 0.006 264.531,87.2 0.01 258.338,70.7 0.022 261.325,55.1 0.027 264.364,44.6 0.03 256.802,37.3 0.034 259.733,27.8 0.033 256.848,21 0.034 264.665,13 0.028 261.692;zinc:98.5 0 0,96.7 0.001 286.375,92 0.004 286.32,87.1 0.006 286.286,70.5 0.015 286.067,55.2 0.016 285.938,44.2 0.017 285.786,37 0.013 285.805,27.4 0.006 286.033,21 0.006 285.885,14.1 0.005 285.823;stone:98.5 0.001 106.423,97 0.001 106.424,92.3 0.003 48.717,86.9 0.005 56.366,70.9 0.01 56.259,55.3 0.013 58.071,44.4 0.011 73.639,37.4 0.01 67.558,26.8 0.007 34.298,21.6 0.006 56.043,14.7 0.004 49.25;mauve:98.5 0 0,96 0.003 325.6,92.2 0.005 325.62,86.5 0.012 325.68,71.1 0.019 323.02,54.2 0.034 322.5,43.5 0.029 321.78,36.4 0.029 323.89,26.3 0.024 320.12,21.2 0.019 322.12,14.5 0.008 326;olive:98.8 0.003 106.5,96.6 0.005 106.5,93 0.007 106.5,88 0.011 106.6,73.7 0.021 106.9,58 0.031 107.3,46.6 0.025 107.3,39.4 0.023 107.4,28.6 0.016 107.4,22.8 0.013 107.4,15.3 0.006 107.1;mist:98.7 0.002 197.1,96.3 0.002 197.1,92.5 0.005 214.3,87.2 0.007 219.6,72.3 0.014 214.4,56 0.021 213.5,45 0.017 213.2,37.8 0.015 216,27.5 0.011 216.9,21.8 0.008 223.9,14.8 0.004 228.8;taupe:98.6 0.002 67.8,96 0.002 17.2,92.2 0.005 34.3,86.8 0.007 39.5,71.4 0.014 41.2,54.7 0.021 43.1,43.8 0.017 39.3,36.7 0.016 35.7,26.8 0.011 36.5,21.4 0.009 43.1,14.7 0.004 49.3';
const TW_COLORS = new Map([['white', '#ffffff'], ['black', '#000000']]);
for (const fam of TW.split(';')) {
  const [name, list] = fam.split(':');
  list.split(',').forEach((v, i) => TW_COLORS.set(`${name}-${[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i]}`, `oklch(${v.replace(/^(\S+)/, '$1%')})`));
}

function cssBlocks(css) {
  const out = [], stack = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') { const head = css.slice(start, i); stack.push({ sel: head.slice(Math.max(head.lastIndexOf(';'), head.lastIndexOf('}')) + 1).trim(), from: i + 1 }); start = i + 1; }
    else if (css[i] === '}') { const top = stack.pop(); if (top) out.push({ context: [...stack.map((s) => s.sel), top.sel], body: css.slice(top.from, i).replace(/\{[^{}]*\}/g, '') }); start = i + 1; }
  }
  return out;
}
const toPx = (v) => { const m = String(v).match(/(-?[\d.]+)(px|rem|em)/); return m ? (m[2] === 'px' ? +m[1] : +m[1] * 16) : NaN; };

/** CSS files in cascade order: each entry file's relative @import chain first, like the browser/Tailwind (later wins). */
function cssInImportOrder(files) {
  const cache = new Map();
  const importsOf = (f) => {
    if (!cache.has(f)) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      cache.set(f, [...src.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)].map((m) => m[1])
        .filter((s) => !s.startsWith('@') && !/^[a-z]+:/i.test(s) && (/^\.{1,2}\//.test(s) || /\.css$/i.test(s)))
        .map((s) => path.resolve(path.dirname(f), s)).filter((p) => fs.existsSync(p)));
    }
    return cache.get(f);
  };
  const all = [...new Set(files.map((f) => path.resolve(f)))];
  const imported = new Set(all.flatMap(importsOf));
  const out = [], seen = new Set();
  const visit = (f) => { if (seen.has(f)) return; seen.add(f); for (const i of importsOf(f)) visit(i); out.push(f); };
  for (const f of all) if (!imported.has(f)) visit(f);
  for (const f of all) visit(f);
  return out;
}

/** Tokens from CSS files: light (:root, html, @theme) and dark (.dark, [data-theme=dark], prefers-color-scheme: dark). */
function loadTheme(cssFiles) {
  const vars = { light: {}, dark: {} };
  for (const f of cssFiles) {
    for (const b of cssBlocks(fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''))) {
      const dark = b.context.some((s) => /\.dark\b|data-theme\s*=\s*["']?dark|prefers-color-scheme:\s*dark/.test(s));
      const light = !dark && /^(:root|html|:host)\b|^@theme/.test(b.context[b.context.length - 1]);
      if (!dark && !light) continue;
      for (const m of b.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) vars[dark ? 'dark' : 'light'][m[1]] = m[2].trim();
    }
  }
  const scopes = { light: vars.light, dark: { ...vars.light, ...vars.dark } };
  const resolveValue = (value, mode, depth = 0) => {
    if (depth > 12) return { why: 'var() loop' };
    const v = value.trim();
    const ld = v.match(/^light-dark\(\s*([\s\S]+)\)$/);
    if (ld) {
      let d = 0, cut = -1;
      for (let i = 0; i < ld[1].length; i++) { const c = ld[1][i]; if (c === '(') d++; else if (c === ')') d--; else if (c === ',' && d === 0) { cut = i; break; } }
      return cut < 0 ? { why: 'light-dark() not parsed' } : resolveValue(mode === 'dark' ? ld[1].slice(cut + 1) : ld[1].slice(0, cut), mode, depth + 1);
    }
    const vr = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
    if (vr) {
      const val = scopes[mode][vr[1]];
      if (val != null) return resolveValue(val, mode, depth + 1);
      return vr[2] ? resolveValue(vr[2], mode, depth + 1) : { why: `${vr[1]} not defined` };
    }
    if (/color-mix|\bfrom\s|calc\(/.test(v)) return { why: `computed color (${v.slice(0, 30)}…)` };
    const c = parseColor(v);
    return c ? { color: c } : { why: `not a color: ${v.slice(0, 30)}` };
  };
  const named = (name, mode) => {
    const v = scopes[mode][`--color-${name}`];
    if (v != null) return resolveValue(v, mode);
    return TW_COLORS.has(name) ? { color: parseColor(TW_COLORS.get(name)) } : null;
  };
  const token = (names, mode) => {
    for (const n of names) if (scopes[mode][n] != null) { const r = resolveValue(scopes[mode][n], mode); if (r.color) return { color: r.color, from: n }; }
    return null;
  };
  const sizes = {};
  for (const [k, v] of Object.entries(vars.light)) { const m = k.match(/^--text-([\w-]+)$/); if (m && !m[1].includes('--') && !Number.isNaN(toPx(v))) sizes[m[1]] = toPx(v); }
  return { named, resolveValue, token, sizes, hasDark: Object.keys(vars.dark).length > 0 };
}

const SIZE_PX = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 };
const WEIGHT = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const TEXT_NOT_COLOR = /^(left|right|center|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|shadow.*|opacity-.*)$/;
const BG_NOT_COLOR = /^(cover|contain|auto|center|top|bottom|left|right|[a-z]+-(top|bottom)|no-repeat|repeat(-.+)?|fixed|local|scroll|none|clip-.+|origin-.+|blend-.+|position-.+|size-.+|opacity-.+)$/;
const BG_IMAGE = /^(gradient-to-|linear-|radial|conic|\[url|\[image:|\(image:|\[(linear|radial|conic)-gradient)/;

/** One color utility (after "text-" or "bg-") → {color}|{transparent}|{size}|{skip}|{image}|{unknown}. */
function utilColor(kind, rest, R, mode) {
  let base = rest, mod = null;
  if (rest.startsWith('[') || rest.startsWith('(')) {
    const close = rest.indexOf(rest.startsWith('[') ? ']' : ')');
    base = rest.slice(0, close + 1);
    if (rest.slice(close + 1).startsWith('/')) mod = rest.slice(close + 2);
  } else { const i = rest.lastIndexOf('/'); if (i > 0) { base = rest.slice(0, i); mod = rest.slice(i + 1); } }
  if (kind === 'text') {
    if (SIZE_PX[base]) return { size: SIZE_PX[base] };
    if (R.sizes[base]) return { size: R.sizes[base] };
    if (TEXT_NOT_COLOR.test(base) || /^\[length:/.test(base)) return { skip: true };
    const arb = base.match(/^\[(\d*\.?\d+)(px|rem)\]$/);
    if (arb) return { size: arb[2] === 'rem' ? +arb[1] * 16 : +arb[1] };
  } else {
    if (BG_IMAGE.test(base)) return { image: true };
    if (BG_NOT_COLOR.test(base)) return { skip: true };
  }
  if (base === 'transparent') return { transparent: true };
  if (base === 'current' || base === 'inherit') return kind === 'text' ? { skip: true } : { unknown: `bg-${base}` };
  let res;
  if (base.startsWith('[')) {
    const v = base.slice(1, -1).replace(/^color:/, '').replace(/_/g, ' ');
    res = v.startsWith('var(') ? R.resolveValue(v, mode) : parseColor(v) ? { color: parseColor(v) } : null;
  } else if (base.startsWith('(')) res = R.resolveValue(`var(${base.slice(1, -1).replace(/^color:/, '')})`, mode);
  else res = R.named(base, mode);
  if (!res) return { unknown: `${kind}-${rest}` };
  if (!res.color) return { unknown: `${kind}-${rest} (${res.why})` };
  let alpha = 1;
  if (mod) { const n = mod.replace(/^\[|\]$/g, ''); alpha = n.endsWith('%') ? parseFloat(n) / 100 : parseFloat(n) > 1 ? parseFloat(n) / 100 : parseFloat(n); }
  if (Number.isNaN(alpha)) return { unknown: `${kind}-${rest}` };
  const color = { ...res.color, alpha: (res.color.alpha ?? 1) * alpha };
  return color.alpha === 0 ? { transparent: true } : { color };
}

/** Resolved styles of one element for a mode (base classes, then dark: overrides). Other variants (hover:, md:…) are ignored. */
function styleOf(el, mode, R) {
  const out = {};
  for (const variant of mode === 'dark' ? ['', 'dark'] : ['']) {
    for (const tok of el.classes) {
      const parts = tok.replace(/^!/, '').split(':');
      const util = parts.pop().replace(/^!/, '');
      if (parts.join(':') !== variant) continue;
      let m;
      if ((m = util.match(/^text-(.+)$/))) {
        const r = utilColor('text', m[1], R, mode);
        if (r.size) out.size = r.size;
        else if (r.color) { out.fg = r.color; out.fgFrom = tok; delete out.unknownFg; delete out.fgTransparent; }
        else if (r.transparent) out.fgTransparent = true;
        else if (r.unknown) { out.unknownFg = r.unknown; delete out.fg; }
      } else if ((m = util.match(/^bg-(.+)$/))) {
        const r = utilColor('bg', m[1], R, mode);
        if (r.image) out.image = tok;
        else if (r.color) { out.bg = r.color; out.bgFrom = tok; delete out.unknownBg; }
        else if (r.transparent) { delete out.bg; delete out.unknownBg; }
        else if (r.unknown) { out.unknownBg = r.unknown; delete out.bg; }
      } else if ((m = util.match(/^font-([a-z]+)$/)) && WEIGHT[m[1]]) out.weight = WEIGHT[m[1]];
      else if ((m = util.match(/^opacity-(\d+)$/))) out.opacity = +m[1] / 100;
    }
  }
  if (el.style) {
    const c = el.style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
    if (c) { const r = parseColor(c[1]); if (r) { out.fg = r; out.fgFrom = 'style'; } else out.unknownFg = `style color: ${c[1].trim()}`; }
    if (/background(-image)?\s*:[^;]*(url\(|gradient\()/.test(el.style)) out.image = 'inline style background';
    const b = el.style.match(/background(?:-color)?\s*:\s*([^;]+)/);
    if (b && !out.image) { const r = parseColor(b[1]); if (r) { out.bg = r; out.bgFrom = 'style'; } else out.unknownBg = `style background: ${b[1].trim()}`; }
  }
  return out;
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
const TAG_RE = /<(\/?)([A-Za-z!][\w:.-]*)((?:"[^"]*"|'[^']*'|\{\{[\s\S]*?\}\}|\{[^{}]*\}|[^'"{}>])*)>/g;
function parseEl(tag, attrs, line) {
  const cls = attrs.match(/(?:^|\s)class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/);
  const classText = cls ? cls[1] ?? cls[2] ?? cls[3] : '';
  const dynamic = /(?:^|\s)(?::class|x-bind:class|v-bind:class|:style|x-bind:style|v-bind:style)\s*=|@class\s*\(|@style\s*\(|className\s*=\s*\{(?!\s*["'`][^"'`]*["'`]\s*\})/.test(attrs)
    || /\{\{|\{!!|<\?|@(if|isset|unless|class)|\$\{/.test(classText);
  const st = attrs.match(/(?:^|\s)style\s*=\s*"([^"]*)"/);
  return {
    tag: tag.toLowerCase(), line, dynamic, style: st ? st[1] : null,
    component: /^(x-|livewire:)|^[A-Z]|[:.]/.test(tag) || tag.includes('-'),
    classes: classText.split(/\s+/).filter(Boolean),
  };
}

/** Walk up from the text's element to find its text color and background. */
function evalText(stack, mode, R, page) {
  let fg = null, fgFrom = null, bg = null, bgFrom = null, size = null, weight = null, opacity = 1;
  const layers = [];
  for (let j = stack.length - 1; j >= 0; j--) {
    const el = stack[j];
    if (el.dynamic) return { why: 'dynamic', msg: `dynamic classes on <${el.tag}> (line ${el.line})` };
    if (el.component) return { why: 'component', msg: `inside component <${el.tag}> (line ${el.line}) — its colors are set elsewhere` };
    const st = styleOf(el, mode, R);
    if (size == null && st.size) size = st.size;
    if (weight == null && st.weight) weight = st.weight;
    if (weight == null && /^(b|strong|th)$/.test(el.tag)) weight = 700;
    if (st.opacity != null) opacity *= st.opacity;
    if (!fg) {
      if (st.unknownFg) return { why: 'unknown', msg: `unknown color ${st.unknownFg} (line ${el.line})` };
      if (st.fgTransparent) return { why: 'image', msg: `text-transparent (gradient/clipped text) (line ${el.line})` };
      if (st.fg) { fg = st.fg; fgFrom = st.fgFrom; }
    }
    if (!bg) {
      if (st.image) return { why: 'image', msg: `background image/gradient "${st.image}" on <${el.tag}> (line ${el.line})` };
      if (st.unknownBg) return { why: 'unknown', msg: `unknown color ${st.unknownBg} (line ${el.line})` };
      if (st.bg) { if ((st.bg.alpha ?? 1) < 1) layers.push({ c: st.bg, from: st.bgFrom }); else { bg = st.bg; bgFrom = st.bgFrom; } }
    }
    if (fg && bg) break;
  }
  if (!bg) {
    if (!page[mode].bg) return { why: 'page', msg: `${mode} page background unknown (no --bg token or <body> background found)` };
    bg = page[mode].bg.color; bgFrom = page[mode].bg.from;
  }
  if (!fg) {
    if (!page[mode].fg) return { why: 'page', msg: `${mode} default text color unknown (no --text token or <body> text color found)` };
    fg = page[mode].fg.color; fgFrom = page[mode].fg.from;
  }
  for (let i = layers.length - 1; i >= 0; i--) { bg = over(layers[i].c, bg); bgFrom = `${layers[i].from} over ${bgFrom}`; }
  const fgc = over({ ...fg, alpha: (fg.alpha ?? 1) * opacity }, bg);
  const px = size ?? 16;
  const large = px >= 24 || (px >= 18.66 && (weight ?? 400) >= 700);
  return { ratio: contrastRatio(fgc, bg), need: large ? 3 : 4.5, large, px, fgFrom: `${fgFrom}${opacity < 1 ? ` ×opacity ${opacity}` : ''}`, bgFrom, fgHex: toHex(fgc), bgHex: toHex(bg) };
}

/** Contrast audit of one page file. Returns { findings, checked, unresolved: [{file, line, mode, why, msg, text}] }. */
function contrastFile(file, R, layoutBody) {
  const raw = fs.readFileSync(file, 'utf8');
  const ignored = new Set();
  raw.split('\n').forEach((l, i) => { if (l.includes('audit-ignore')) { ignored.add(i + 1); ignored.add(i + 2); } });
  const src = stripComments(raw, false).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, blank).replace(/@php[\s\S]*?@endphp/g, blank).replace(/<\?php[\s\S]*?\?>/g, blank);
  const lineOf = lineIndex(src);
  const usesDark = /(^|[\s"'`])dark:(text|bg)-/.test(src);
  const modes = R.hasDark || usesDark ? ['light', 'dark'] : ['light'];
  const body = (src.match(/<body\b[^>]*>/i) || [])[0];
  const bodyEl = body ? parseEl('body', body.slice(5, -1), 0) : layoutBody;
  const page = {};
  for (const mode of modes) {
    const st = bodyEl && !bodyEl.dynamic ? styleOf(bodyEl, mode, R) : {};
    page[mode] = {
      bg: st.bg && (st.bg.alpha ?? 1) === 1 ? { color: st.bg, from: `<body> ${st.bgFrom}` } : R.token(['--bg', '--color-bg'], mode) || (mode === 'light' ? { color: parseColor('#ffffff'), from: 'browser default white' } : null),
      fg: st.fg ? { color: st.fg, from: `<body> ${st.fgFrom}` } : R.token(['--text', '--color-text'], mode) || (mode === 'light' ? { color: parseColor('#000000'), from: 'browser default black' } : null),
    };
  }
  const findings = [], unresolved = [];
  let checked = 0;
  const stack = [{ tag: '#root', line: 1, classes: [], dynamic: false, component: false, style: null }];
  let last = 0, svgDepth = 0;
  const onText = (text, idx) => {
    if (svgDepth) return;
    const visible = text.replace(/@\w+(\s*\([^)]*\))?/g, ' ').replace(/&nbsp;|&#160;|&zwnj;/g, ' ').trim();
    if (!visible) return;
    const el = stack[stack.length - 1];
    if (el.checked) return;
    el.checked = true;
    const line = lineOf(idx + text.search(/\S/));
    if (ignored.has(line)) return;
    const snippet = visible.replace(/\s+/g, ' ').slice(0, 32);
    const persian = /[؀-ۿ]/.test(visible);
    for (const mode of modes) {
      checked++;
      const r = evalText(stack, mode, R, page);
      if (r.why) { unresolved.push({ file, line, mode, why: r.why, msg: r.msg, text: snippet }); continue; }
      const pair = `${r.fgFrom} (${r.fgHex}) on ${r.bgFrom} (${r.bgHex})`;
      const shown = (Math.floor(r.ratio * 100) / 100).toFixed(2);
      if (r.ratio < r.need) findings.push({ file, line, sev: 'error', rule: 'contrast', msg: `[${mode}] "${snippet}" ${pair} = ${shown}:1 — needs ${r.need}:1${r.large ? ' (large text)' : ''}.` });
      else if (persian && r.px < 14 && r.ratio < 5.5) findings.push({ file, line, sev: 'warn', rule: 'fa-contrast', msg: `[${mode}] small Persian text "${snippet}" ${pair} = ${shown}:1 — house rule: ≥ 5.5:1 under 14px (WCAG passes).` });
    }
  };
  for (const m of src.matchAll(TAG_RE)) {
    onText(src.slice(last, m.index), last);
    last = m.index + m[0].length;
    const tag = m[2], lower = tag.toLowerCase();
    if (m[1] === '/') {
      if (lower === 'svg') { svgDepth = Math.max(0, svgDepth - 1); continue; }
      if (svgDepth) continue;
      let i = stack.length - 1;
      while (i > 0 && stack[i].tag !== lower) i--;
      if (i > 0) stack.length = i;
      continue;
    }
    const selfClose = /\/\s*$/.test(m[3]);
    if (lower === 'svg') { if (!selfClose) svgDepth++; continue; }
    if (svgDepth || VOID.has(lower) || selfClose) continue;
    stack.push(parseEl(tag, m[3], lineOf(m.index)));
  }
  onText(src.slice(last), last);
  return { findings, checked, unresolved };
}

function runContrast(files) {
  let cssFiles = [...files.filter((f) => /\.css$/i.test(f)), ...cssArgs.flatMap((p) => (fs.existsSync(p) ? walk(p).filter((f) => /\.css$/i.test(f)) : []))];
  if (!cssFiles.length) for (const d of ['resources/css', 'src']) if (fs.existsSync(d)) cssFiles.push(...walk(d).filter((f) => /\.css$/i.test(f)));
  cssFiles = cssInImportOrder(cssFiles);
  const R = loadTheme(cssFiles);
  cssFiles = cssFiles.map((f) => path.relative(process.cwd(), f) || f);
  const pages = files.filter((f) => !/\.css$/i.test(f));
  let layoutBody = null;
  for (const f of pages) {
    const b = fs.readFileSync(f, 'utf8').match(/<body\b[^>]*>/i);
    if (b && /class\s*=/.test(b[0])) { layoutBody = parseEl('body', b[0].slice(5, -1), 0); break; }
  }
  const out = { cssFiles, findings: [], checked: 0, unresolved: [] };
  for (const f of pages) { const r = contrastFile(f, R, layoutBody); out.findings.push(...r.findings); out.checked += r.checked; out.unresolved.push(...r.unresolved); }
  return out;
}

// ---------- run ----------
if (isMain) {
const files = targets.flatMap((t) => {
  if (!fs.existsSync(t)) { console.error(`Not found: ${t}`); return []; }
  return walk(t);
});
const all = files.flatMap(auditFile);

// Placeholders the user must fill (convention: <!-- PLACEHOLDER: what to replace -->)
const placeholders = files.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n')
  .map((l, i) => (/PLACEHOLDER/.test(l) ? { file, line: i + 1, text: l.trim().replace(/^.*PLACEHOLDER:?\s*/, '').replace(/\s*(-->|\*\/|--\}\}).*$/, '') } : null))
  .filter(Boolean));
const contrast = flags.has('--contrast') ? runContrast(files) : null;
if (contrast) all.push(...contrast.findings);

// --render: what the browser really shows (built HTML pages)
const normT = (t) => String(t).replace(/[\s‌]+/g, ' ').trim();
const renders = [];
for (const page of valuesOf('--render')) {
  const r = await renderAudit(page, { root: valuesOf('--render-root')[0] });
  const out = { page, status: r.status, reason: r.reason, browser: r.browser, checked: 0, pass: 0, fail: 0, house: 0, unresolved: [], hidden: 0, resolvedStatic: [] };
  renders.push(out);
  if (r.status !== 'ok') continue;
  const seen = new Set();
  const once = (f) => { const k = f.rule + f.msg; if (!seen.has(k)) { seen.add(k); all.push(f); } };
  const firstW = r.runs[0]?.width;
  for (const run of r.runs) {
    const tag = `[${run.mode} ${run.width}px]`;
    if (run.error) { once({ file: page, line: 0, sev: 'warn', rule: 'render', msg: `${tag} ${run.error}` }); continue; }
    if (run.note) once({ file: page, line: 0, sev: 'warn', rule: 'render', msg: `${tag} ${run.note}` });
    if (run.width === firstW) for (const t of run.texts) {
      if (t.why === 'hidden') { out.hidden++; continue; }
      out.checked++;
      if (t.why) { out.unresolved.push({ mode: run.mode, text: t.text, el: t.el, msg: t.msg }); continue; }
      const need = t.large ? 3 : 4.5, shown = (Math.floor(t.ratio * 100) / 100).toFixed(2);
      if (t.ratio < need) { out.fail++; once({ file: page, line: 0, sev: 'error', rule: 'render-contrast', msg: `[${run.mode}] "${t.text}" <${t.el}> ${t.fg} on ${t.bg} = ${shown}:1 in the browser — needs ${need}:1.` }); }
      else if (t.fa && t.px < 14 && t.ratio < 5.5) { out.house++; once({ file: page, line: 0, sev: 'warn', rule: 'render-fa-contrast', msg: `[${run.mode}] small Persian text "${t.text}" ${t.fg} on ${t.bg} = ${shown}:1 — house rule ≥ 5.5:1 under 14px.` }); }
      else out.pass++;
    }
    if (run.mode !== 'light') continue;
    if (run.overflow > 1) once({ file: page, line: 0, sev: 'warn', rule: 'render-overflow', msg: `${tag} page scrolls sideways by ${run.overflow}px.` });
    for (const h of run.headlines) if (h.tag === 'h1' && h.lines > (run.width < 768 ? 3 : 2)) once({ file: page, line: 0, sev: 'warn', rule: 'render-headline', msg: `${tag} <h1> "${h.text}" wraps to ${h.lines} lines — keep it to ${run.width < 768 ? 3 : 2} (shorten it, not the font).` });
    for (const t of run.texts) if (!t.why && t.fa && t.px < 13) once({ file: page, line: 0, sev: 'warn', rule: 'render-small-fa', msg: `Persian text "${t.text}" renders at ${t.px}px — house rule ≥ 13px.` });
    if (!run.bodyFontLoaded && !/^(serif|sans-serif|system-ui|monospace|ui-sans-serif|ui-serif|-apple-system)$/i.test(run.bodyFont)) once({ file: page, line: 0, sev: 'warn', rule: 'render-font', msg: `body font "${run.bodyFont}" did not load (fonts loaded: ${run.fonts.join(', ') || 'none'}) — check the @font-face URLs.` });
    if (run.external.length) once({ file: page, line: 0, sev: flags.has('--iran') ? 'error' : 'warn', rule: 'render-external', msg: `the page tried to load from other hosts (blocked during the test): ${[...new Set(run.external)].join(', ')}.` });
  }
  if (contrast) for (const u of contrast.unresolved) {
    const run = r.runs.find((x) => x.mode === u.mode && x.width === firstW && x.texts);
    const hit = run && run.texts.find((t) => !t.why && (normT(t.text).startsWith(normT(u.text).slice(0, 18)) || normT(u.text).startsWith(normT(t.text).slice(0, 18))));
    if (!hit) continue;
    // a dynamic class is only measured if the framework that sets it really ran in the rendered page
    if (u.why === 'dynamic' && !run.alpine && !run.livewire) { out.notApplied = (out.notApplied || 0) + 1; continue; }
    out.resolvedStatic.push({ ...u, ratio: hit.ratio, ok: hit.ratio >= (hit.large ? 3 : 4.5) });
  }
}
const errors = all.filter((f) => f.sev === 'error').length;
const warns = all.length - errors;

if (flags.has('--json')) {
  console.log(JSON.stringify({ files: files.length, errors, warnings: warns, findings: all, placeholders, ...(flags.has('--slop') ? { claims: CLAIMS } : {}), ...(contrast ? { contrast: { cssFiles: contrast.cssFiles, checked: contrast.checked, unresolved: contrast.unresolved } } : {}), ...(renders.length ? { render: renders } : {}) }, null, 2));
} else {
  const byFile = new Map();
  for (const f of all) { if (!byFile.has(f.file)) byFile.set(f.file, []); byFile.get(f.file).push(f); }
  for (const [file, list] of byFile) {
    console.log(`\n${file}`);
    for (const f of list.sort((a, b) => a.line - b.line)) console.log(`  ${String(f.line).padStart(4)}  ${f.sev === 'error' ? 'ERROR' : 'warn '}  ${f.rule.padEnd(20)} ${f.msg}`);
  }
  if (placeholders.length) {
    console.log(`\nPlaceholders for the user to fill (${placeholders.length}):`);
    for (const p of placeholders) console.log(`  ${p.file}:${p.line}  ${p.text}`);
  }
  if (contrast) {
    const fails = contrast.findings.filter((f) => f.rule === 'contrast').length;
    const house = contrast.findings.filter((f) => f.rule === 'fa-contrast').length;
    const un = contrast.unresolved;
    const by = (w) => un.filter((u) => u.why === w).length;
    console.log(`\nContrast — tokens from: ${contrast.cssFiles.length ? contrast.cssFiles.join(', ') : 'none found (Tailwind default colors only; pass --css <file-or-dir>)'}`);
    if (un.length) {
      console.log(`Could not resolve (${un.length}) — NOT counted as passed; check these in the browser:`);
      for (const u of un.slice(0, 15)) console.log(`  ${u.file}:${u.line}  [${u.mode}] "${u.text}" — ${u.msg}`);
      if (un.length > 15) console.log(`  … ${un.length - 15} more (use --json for the full list)`);
    }
    console.log(`Contrast: ${contrast.checked} text check(s) · ${contrast.checked - fails - house - un.length} pass · ${fails} fail · ${house} below the Persian 5.5:1 house rule · ${un.length} could not resolve (${by('dynamic')} dynamic classes, ${by('component')} components, ${by('image')} background images, ${by('unknown')} unknown colors, ${by('page')} unknown page colors)`);
  }
  for (const r of renders) {
    if (r.status !== 'ok') { console.log(`\nRender ${r.page}: skipped — ${r.reason}. Unresolved pairs stay unresolved (not passed).`); continue; }
    console.log(`\nRender ${r.page} (${path.basename(r.browser)}, local server, network blocked): ${r.checked} text check(s) · ${r.pass} pass · ${r.fail} fail · ${r.house} below the Persian 5.5:1 house rule · ${r.unresolved.length} could not resolve (NOT passed) · ${r.hidden} not visible (not checked)`);
    for (const u of r.unresolved.slice(0, 10)) console.log(`  [${u.mode}] "${u.text}" <${u.el}> — ${u.msg}`);
    if (contrast && contrast.unresolved.length) {
      const bad = r.resolvedStatic.filter((x) => !x.ok).length;
      console.log(`Static "could not resolve" pairs measured in the browser: ${r.resolvedStatic.length} of ${contrast.unresolved.length} (${r.resolvedStatic.length - bad} pass, ${bad} fail; only the state shown on load); ${contrast.unresolved.length - r.resolvedStatic.length} still unresolved — check those by eye${r.notApplied ? ` (${r.notApplied} use dynamic classes but no Alpine/Livewire ran in the rendered page, so their state was never applied)` : ''}.`);
    }
  }
  if (flags.has('--slop')) {
    console.log(`\nClaims to confirm with the owner (${CLAIMS.length}) — every number claim, superlative and quote. The audit cannot verify them; a source comment is not proof:`);
    for (const c of CLAIMS) console.log(`  ${c.file}:${c.line}  [${c.kind}${c.placeholder ? ', PLACEHOLDER' : ''}] ${c.text}`);
    console.log('Passing --slop does not prove the page is good — do the by-eye passes in review-checklist.md §F, including "substance".');
  }
  console.log(`\n${files.length} file(s) scanned · ${errors} error(s) · ${warns} warning(s)`);
  if (!files.length) console.log('No .html/.blade.php/.jsx/.tsx/.vue/.css files found.');
}
process.exit(errors ? 1 : 0);
}
