/**
 * web-ui-playbook — slop.mjs (used by audit.mjs --slop; zero dependencies)
 *
 * Objective "generic page" tells, as WARNINGS only. Two jobs:
 *   1. generic copy, buttons and layout habits (data/fa-slop.json, data/en-slop.json + structural checks);
 *   2. a list of every number-claim and quote on the page that the OWNER must confirm. The audit cannot
 *      verify truth: a source comment proves nothing, so every claim is listed, marked or not.
 * Passing this audit does not mean the page is good — see references/review-checklist.md §F (substance pass).
 * Rule origins (taste-skill @ f624f37, adapted): references/anti-generic.md and THIRD_PARTY_NOTICES.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const load = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
let LISTS = null;
const lists = () => (LISTS ||= { fa: load('fa-slop.json'), en: load('en-slop.json') });

// ---------- normalization (with an index map back to the source) ----------
const MAP = { 'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'أ': 'ا', 'إ': 'ا', 'ٱ': 'ا', 'ؤ': 'و', 'ة': 'ه' };
const DROP = /[\u064B-\u065F\u0670\u0640\u200E\u200F]/; // diacritics, superscript alef, tatweel, bidi marks
const SPACE = /[\s\u200C\u00A0]/; // ZWNJ and nbsp count as a space
const digit = (c) => { const p = c.codePointAt(0); return p >= 0x6f0 && p <= 0x6f9 ? String(p - 0x6f0) : p >= 0x660 && p <= 0x669 ? String(p - 0x660) : c; };
/** Normalize Persian/English text for matching. Returns { text, at } where at[i] = source index of text[i]. */
export function normalize(s) {
  let text = '', prevSpace = true;
  const at = [];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (DROP.test(c)) continue;
    if (SPACE.test(c)) { if (!prevSpace) { text += ' '; at.push(i); } prevSpace = true; continue; }
    c = digit(MAP[c] || c).toLowerCase();
    text += c; at.push(i); prevSpace = false;
  }
  return { text, at };
}
const norm = (s) => normalize(s).text.trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Patterns: map letters and ZWNJ only (never lowercase — \p{L} must survive); case-insensitive flag instead. */
const normPattern = (p) => [...p].map((c) => (c === '\u200C' ? ' ' : MAP[c] || c)).join('');
const toRe = (e) => new RegExp(e.pattern ? normPattern(e.pattern) : esc(norm(e.phrase)), 'giu');

/** Project overrides: .slop-allow.json in the project (searched from the scanned file up to the cwd). */
export function loadAllow(startDir) {
  let dir = path.resolve(startDir);
  const stop = path.resolve(process.cwd());
  for (;;) {
    const f = path.join(dir, '.slop-allow.json');
    if (fs.existsSync(f)) {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      return { file: f, phrases: new Set((j.allowPhrases || []).map(norm)), labels: new Set((j.allowLabels || []).map(norm)), rules: new Set(j.disableRules || []) };
    }
    const up = path.dirname(dir);
    if (dir === stop || up === dir) return { file: null, phrases: new Set(), labels: new Set(), rules: new Set() };
    dir = up;
  }
}

// ---------- element ranges ----------
/** End index of the element whose opening tag starts at `open` (tag-depth counting). */
function elementEnd(src, open, tag) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi');
  re.lastIndex = open;
  let depth = 0, m;
  while ((m = re.exec(src))) {
    if (m[1]) { depth--; if (depth === 0) return m.index + m[0].length; }
    else if (!m[2]) depth++;
  }
  return src.length;
}
const ranges = (src, openRe) => [...src.matchAll(openRe)].map((m) => [m.index, elementEnd(src, m.index, m[1])]);
const inside = (idx, rs) => rs.some(([a, b]) => idx >= a && idx < b);

// ---------- the audit ----------
/**
 * @param o { file, raw, src (comments blanked), vis (visible text, same positions), lineOf, ignored:Set<line>, allow }
 * @returns { findings: [{file,line,sev:'warn',rule,msg}], claims: [{file,line,kind,text,placeholder}] }
 */
export function slopAudit({ file, raw, src, vis, lineOf, ignored, allow }) {
  const findings = [], claims = [];
  const rawLines = raw.split('\n');
  const add = (rule, idx, msg) => {
    if (allow.rules.has(rule)) return;
    const line = lineOf(idx);
    if (ignored.has(line)) return;
    findings.push({ file, line, sev: 'warn', rule, msg });
  };
  const placeholderAt = (line) => /PLACEHOLDER/.test(rawLines[line - 1] || '') || /PLACEHOLDER/.test(rawLines[line - 2] || '');

  // regions
  const skip = [...ranges(src, /<(footer|address)\b[^>]*>/gi), ...ranges(src, /<(\w+)\b[^>]*\b(?:id|class)\s*=\s*["'][^"']*\bcontact[^"']*["'][^>]*>/gi)];
  const forms = ranges(src, /<(form)\b[^>]*>/gi);
  const dialogs = [...ranges(src, /<(dialog)\b[^>]*>/gi), ...ranges(src, /<(\w+)\b[^>]*\b(?:role\s*=\s*["']dialog|x-dialog|aria-modal)[^>]*>/gi)];
  const lists_ = ranges(src, /<(ol)\b[^>]*>/gi);
  const h1 = src.search(/<h1\b/i);
  let hero = ranges(src, /<(\w+)\b[^>]*\b(?:id|class)\s*=\s*["'][^"']*\bhero\b[^"']*["'][^>]*>/gi);
  if (!hero.length && h1 >= 0) {
    const before = src.slice(0, h1);
    const open = Math.max(before.lastIndexOf('<section'), before.lastIndexOf('<header'));
    if (open >= 0) { const tag = src.slice(open + 1).match(/^\w+/)[0]; const end = elementEnd(src, open, tag); if (end > h1) hero = [[open, end]]; }
  }
  const prominent = [...ranges(src, /<(h[1-6]|title|a|button)\b[^>]*>/gi), ...hero];

  // 1. generic copy (filler + claims), on normalized visible text
  const N = normalize(vis);
  /** the page's own text for a match in the normalized string (Persian digits, ZWNJ as written) */
  const orig = (start, len) => vis.slice(N.at[Math.max(0, start)], N.at[Math.min(N.text.length, start + len) - 1] + 1).replace(/\s+/g, ' ').trim();
  const { fa, en } = lists();
  for (const [group, rule] of [['filler', 'slop-filler'], ['claims', 'slop-claim']]) {
    for (const e of [...fa[group], ...en[group]]) {
      for (const m of N.text.matchAll(toRe(e))) {
        const idx = N.at[m.index];
        if (inside(idx, skip) || allow.phrases.has(norm(m[0]))) continue;
        if (e.where === 'prominent' && !inside(idx, prominent)) continue;
        add(rule, idx, `«${orig(m.index, m[0].length)}» — ${e.why}${rule === 'slop-claim' ? ' (listed under "claims to confirm")' : ''}`);
        if (rule === 'slop-claim') claims.push({ file, line: lineOf(idx), kind: 'claim', text: orig(m.index - 30, m[0].length + 60), placeholder: placeholderAt(lineOf(idx)) });
      }
    }
  }

  // 1b. the meta description is an attribute (not visible text) but it is the page's search-result headline
  for (const m of src.matchAll(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/gi)) {
    const content = (m[0].match(/\bcontent\s*=\s*["']([^"']*)["']/) || [])[1];
    if (!content) continue;
    const M = normalize(content);
    for (const [group, rule] of [['filler', 'slop-filler'], ['claims', 'slop-claim']]) for (const e of [...fa[group], ...en[group]]) for (const x of M.text.matchAll(toRe(e))) {
      if (allow.phrases.has(norm(x[0]))) continue;
      const shown = content.slice(M.at[x.index], M.at[x.index + x[0].length - 1] + 1);
      add(rule, m.index, `meta description: «${shown}» — ${e.why}`);
      if (rule === 'slop-claim') claims.push({ file, line: lineOf(m.index), kind: 'claim', text: `meta description: ${content.slice(0, 80)}`, placeholder: placeholderAt(lineOf(m.index)) });
    }
  }

  // 2. button / link labels + link purpose (WCAG 2.4.4)
  const BTN = [...fa.buttons, ...en.buttons].map((b) => ({ ...b, n: norm(b.label) }));
  const seen = new Map();
  for (const m of src.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, attrs, inner] = m;
    if (/\{\{|\{!!|@lang|__\(/.test(inner)) continue;
    const visible = inner.replace(/<span[^>]*\bsr-only\b[^>]*>[\s\S]*?<\/span>/gi, ' ').replace(/<[^>]*>/g, ' ');
    const label = norm(visible).replace(/^[\s←→‹›«»<>·•\-–—]+|[\s←→‹›«»<>·•\-–—!.]+$/g, '').trim();
    if (!label) continue;
    const hasContext = /aria-label(ledby)?\s*=/.test(attrs) || /\bsr-only\b/.test(inner);
    const b = BTN.find((x) => x.n === label);
    if (!b || allow.labels.has(label)) continue;
    const href = (attrs.match(/\bhref\s*=\s*["']([^"']*)["']/) || [])[1];
    const inPlace = tag.toLowerCase() === 'button' || /aria-expanded|wire:click|@click|x-on:click|data-load-more/.test(attrs) || !href || /^(#|javascript:)/.test(href);
    const inForm = inside(m.index, forms) || /type\s*=\s*["']submit/.test(attrs), inDialog = inside(m.index, dialogs);
    const flag = b.when === 'always' || (b.when === 'link-to-page' && !inPlace && !hasContext) || (b.when === 'main-cta' && !inForm && !inDialog) || (b.when === 'hero-cta' && inside(m.index, hero) && !inForm && !inDialog);
    if (flag) add('slop-cta', m.index, `${tag} label «${label}» — ${b.why}. Name the action and its object.`);
    if (!hasContext) { if (!seen.has(label)) seen.set(label, []); seen.get(label).push(m.index); }
  }
  for (const [label, idxs] of seen) if (idxs.length >= 2) for (const i of idxs) add('slop-link-purpose', i, `«${label}» appears ${idxs.length}× on this page with no context — screen-reader users hear the same label for different targets (WCAG 2.4.4). Add sr-only text or an aria-label naming the target.`);

  // 3. numbers that look like proof → owner must confirm (never "verified" by a comment)
  const CLAIM_WORD = /(زبان ?آموز|دانش ?آموز|دانشجو|هنرجو|مشتری|کاربر|عضو|نفر|رضایت|درصد|سال (سابقه|تجربه)|شعبه|students?|customers?|users?|clients?|members?|satisf|years|downloads|reviews)/iu;
  for (const m of N.text.matchAll(/(?<![\w:/.-])(\+ ?)?\d[\d,٬.]*( ?(\+|%|٪|×|x|k|هزار|میلیون|میلیارد))?(?![\w:/-])/giu)) {
    const idx = N.at[m.index];
    if (inside(idx, skip)) continue;
    const around = N.text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30), shownCtx = orig(m.index - 30, m[0].length + 60), shownNum = orig(m.index, m[0].length);
    const marked = /\+|%|٪|×|k\b|هزار|میلیون|میلیارد/.test(m[0]);
    if (!marked && !CLAIM_WORD.test(around)) continue;
    if (/تومان|ریال|toman|rial|\$|€/i.test(N.text.slice(m.index, m.index + m[0].length + 12))) continue; // prices are facts the owner set
    if (/^1[34]\d\d$|^20\d\d$/.test(m[0].trim()) && !marked) continue; // a year
    const line = lineOf(idx), ph = placeholderAt(line);
    claims.push({ file, line, kind: 'number', text: shownCtx, placeholder: ph });
    add('slop-stat', idx, `number claim «${shownNum}» (…${shownCtx.slice(0, 50)}…) — numbers, testimonials and logos come only from the owner; confirm it${ph ? ' (marked PLACEHOLDER)' : ''}. The audit cannot verify it.`);
  }

  // 4. testimonials / quotes
  for (const m of src.matchAll(/<(blockquote|q)\b[^>]*>([\s\S]*?)<\/\1>|<(\w+)\b[^>]*class\s*=\s*["'][^"']*testimonial[^"']*["'][^>]*>/gi)) {
    const text = norm((m[2] ?? src.slice(m.index, elementEnd(src, m.index, m[3]))).replace(/<[^>]*>/g, ' ')).slice(0, 70);
    if (!text) continue;
    const line = lineOf(m.index), ph = placeholderAt(line);
    claims.push({ file, line, kind: 'quote', text, placeholder: ph });
    add('slop-testimonial', m.index, `testimonial/quote «${text.slice(0, 40)}…» — only real, consented quotes from the owner; confirm the person, the words and the permission${ph ? ' (marked PLACEHOLDER)' : ''}.`);
  }

  // 5. structural / visual tells
  const classes = [...src.matchAll(/\bclass\s*=\s*["']([^"']*)["']/g)].map((m) => ({ c: m[1], idx: m.index }));
  for (const { c, idx } of classes) {
    const t = c.split(/\s+/);
    if (t.includes('absolute') && t.includes('rounded-full') && t.some((x) => /^blur-(2xl|3xl|\[)/.test(x))) add('slop-blob', idx, 'decorative blurred blob (absolute + rounded-full + blur) — the default "AI page" background; remove it or make it a real image.');
    if (t.includes('bg-clip-text') && t.includes('text-transparent')) add('slop-gradient-text', idx, 'gradient text (bg-clip-text text-transparent) — hard to read, unresolvable for contrast; use solid color and weight.');
    if (t.includes('transition-all')) add('slop-motion', idx, 'transition-all animates everything (layout too) — list the properties (transition-colors, transition-opacity, transition-transform).');
    if (t.includes('ease-in')) add('slop-motion', idx, 'ease-in starts slow and feels laggy for UI — use ease-out (entering) or ease-in-out.');
    if (t.includes('scale-0')) add('slop-motion', idx, 'scale-0 entrance pops from nothing — start at 0.95–0.98 with opacity.');
    if (t.some((x) => /^animate-(ping|pulse)$/.test(x)) && !/skeleton|loading|aria-busy/.test(src.slice(Math.max(0, idx - 200), idx + 200))) add('slop-furniture', idx, 'pulsing dot/ping outside a loading state — decoration that competes with content.');
    const after = src.slice(src.indexOf('>', idx) + 1, src.indexOf('>', idx) + 400);
    if (t.some((x) => /^text-(xs|\[(9|10|11|12)px\])$/.test(x)) && /^[^<]*[؀-ۿ]/.test(after)) add('slop-small-fa', idx, 'Persian text under 13px — house rule: ≥ 13px (dots and joins blur first); use text-sm or a 13px token.');
    if (t.includes('rounded-full') && t.some((x) => /^text-(xs|sm)$/.test(x)) && t.some((x) => /^px-/.test(x)) && /^[^<]*<\/[^>]+>\s*(<\/[^>]+>\s*)*<h[12]\b/.test(after)) add('slop-pill-badge', idx, 'pill badge right above the headline — a very common template tell; let the headline stand alone or say the fact in the sub-line.');
  }
  for (const m of src.matchAll(/<(a|button)\b([^>]*?)class\s*=\s*["']([^"']*)["']/gi)) {
    const t = m[3].split(/\s+/);
    if (t.some((x) => /^bg-(?!transparent|none)/.test(x)) && !t.some((x) => /(^|:)hover:/.test(x))) add('slop-hover', m.index, `<${m[1]}> styled as a button with no hover: state — every control needs hover, focus-visible and active feedback.`);
  }
  const glass = classes.filter(({ c }) => /(^|\s)backdrop-blur/.test(c));
  if (glass.length >= 2) add('slop-glass', glass[1].idx, `${glass.length} glass (backdrop-blur) surfaces — at most one (a sticky bar); blur is also slow on low-end phones.`);
  for (const m of vis.matchAll(/\p{Extended_Pictographic}/gu)) if (!inside(m.index, skip) && !/[©®™]/.test(m[0])) add('slop-emoji', m.index, `emoji "${m[0]}" used as an icon/bullet — use the page's SVG icon set.`);
  for (const m of N.text.matchAll(/lorem ipsum|لورم ایپسوم|john doe|jane doe|\bacme\b|شرکت نمونه|کاربر نمونه|فلانی|09123456789/giu)) add('slop-lorem', N.at[m.index], `placeholder identity «${m[0]}» in visible text — use the owner's real content or a marked PLACEHOLDER.`);
  const dashes = [...vis.matchAll(/—/g)];
  if (dashes.length > 4) add('slop-emdash', dashes[4].index, `${dashes.length} em dashes — more than 4 reads machine-written; use «،» or a full stop.`);
  for (const m of N.text.matchAll(/(?:^| )(اسکرول کنید|اسکرول|scroll down|↓)(?= |$)/giu)) add('slop-furniture', N.at[m.index], `scroll cue «${m[0].trim()}» — people know how to scroll; show content instead.`);
  const idxNums = [...vis.matchAll(/(?:^|\s)(0[1-9]|۰[۱-۹])(?=\s)/g)].filter((m) => !inside(m.index, lists_));
  if (idxNums.length >= 2) add('slop-index-numbers', idxNums[0].index, `${idxNums.length} "01 / 02" style index labels — decoration unless it is a real ordered list (<ol>).`);
  for (const m of src.matchAll(/(?:src|href)\s*=\s*["'][^"']*(picsum\.photos|placehold\.co|via\.placeholder\.com|placeholder\.com|dummyimage\.com|loremflickr\.com|source\.unsplash\.com)/gi)) add('slop-image-host', m.index, `${m[1]} placeholder image — fake content from a foreign host; use the owner's photo or a marked local placeholder.`);
  for (const m of src.matchAll(/<img\b[^>]*(enamad|samandehi)[^>]*>/gi)) {
    const ctx = src.slice(Math.max(0, m.index - 400), m.index);
    if (!/trustseal\.enamad\.ir|logo\.samandehi\.ir/.test(ctx + m[0]) && !placeholderAt(lineOf(m.index))) add('slop-trust-seal', m.index, 'trust-seal image without the official verification link — a fake seal; use the code from the issuer or mark it PLACEHOLDER.');
  }
  // cards: ≥ 3 siblings with the same class, each icon + heading + text (or one card inside @foreach)
  const byClass = new Map();
  for (const m of src.matchAll(/<(div|li|article)\b[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const body = src.slice(m.index, elementEnd(src, m.index, m[1]));
    if (body.length > 1500 || !/<svg|<i\b|icon/i.test(body) || !/<h[2-4]\b/i.test(body) || !/<p\b/i.test(body) || /<img|تومان|price|قیمت/i.test(body)) continue;
    const loop = /@foreach\b/.test(src.slice(Math.max(0, m.index - 300), m.index));
    if (!byClass.has(m[2])) byClass.set(m[2], { n: 0, idx: m.index, loop });
    byClass.get(m[2]).n++;
  }
  for (const [, v] of byClass) if (v.n >= 3 || v.loop) add('slop-cards', v.idx, `${v.loop ? 'a @foreach of' : v.n} identical icon + heading + text cards — the most common template row. Make the content differ in kind (a table, a timetable, a real example), or use a list.`);
  // repeated section layouts
  const secs = [...src.matchAll(/<section\b[^>]*>/gi)].map((m) => ({ idx: m.index, fp: [...new Set(src.slice(m.index, m.index + 700).match(/\b(?:(?:sm|md|lg|xl):)?(?:grid-cols-\d+|flex-row|flex-col|grid|columns-\d+)\b/g) || [])].sort().join(' ') }));
  for (let i = 2; i < secs.length; i++) if (secs[i].fp && secs[i].fp === secs[i - 1].fp && secs[i].fp === secs[i - 2].fp) { add('slop-repeat-sections', secs[i].idx, `3 sections in a row with the same layout (${secs[i].fp}) — vary the rhythm (statement, table, split, list).`); break; }
  // motion baseline: content hidden until JS runs, without a no-JS gate
  if (/x-intersect|data-reveal|\breveal\b/.test(src) && !/html\.js|documentElement\.classList\.add\(\s*['"]js['"]|class\s*=\s*["'][^"']*\bno-js\b/.test(raw)) add('slop-reveal-gate', src.search(/x-intersect|data-reveal|\breveal\b/), 'scroll reveals without an html.js gate — if JS fails (common on slow connections) the content stays invisible. Add the gate (components-and-states.md, motion baseline).');
  return { findings, claims };
}
