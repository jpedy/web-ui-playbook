#!/usr/bin/env node
/**
 * web-ui-playbook audit — zero-dependency checker for HTML / Blade / JSX / TSX / Vue / CSS.
 *
 * Usage:
 *   node audit.mjs <file-or-dir> [more...] [--iran] [--rtl] [--json]
 *
 *   --iran   users are inside Iran: foreign runtime hosts become errors everywhere
 *   --rtl    force Persian/RTL checks (auto-detected from lang="fa", dir="rtl" or Persian text)
 *   --json   machine-readable output
 *
 * Exit code 1 when errors exist. Warnings need a human decision (fix, or explain why acceptable).
 * Suppress a line: put the text "audit-ignore" in a comment on that line or the line above.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
if (!targets.length) {
  console.log('Usage: node audit.mjs <file-or-dir> [...] [--iran] [--rtl] [--json]');
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

  // 6. Persian text hygiene (visible text only)
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

// ---------- run ----------
const files = targets.flatMap((t) => {
  if (!fs.existsSync(t)) { console.error(`Not found: ${t}`); return []; }
  return walk(t);
});
const all = files.flatMap(auditFile);

// Placeholders the user must fill (convention: <!-- PLACEHOLDER: what to replace -->)
const placeholders = files.flatMap((file) => fs.readFileSync(file, 'utf8').split('\n')
  .map((l, i) => (/PLACEHOLDER/.test(l) ? { file, line: i + 1, text: l.trim().replace(/^.*PLACEHOLDER:?\s*/, '').replace(/\s*(-->|\*\/|--\}\}).*$/, '') } : null))
  .filter(Boolean));
const errors = all.filter((f) => f.sev === 'error').length;
const warns = all.length - errors;

if (flags.has('--json')) {
  console.log(JSON.stringify({ files: files.length, errors, warnings: warns, findings: all, placeholders }, null, 2));
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
  console.log(`\n${files.length} file(s) scanned · ${errors} error(s) · ${warns} warning(s)`);
  if (!files.length) console.log('No .html/.blade.php/.jsx/.tsx/.vue/.css files found.');
}
process.exit(errors ? 1 : 0);
