/**
 * web-ui-playbook — parsers/jsx.mjs (React / Next.js .jsx/.tsx; regex-based, zero deps)
 * Adds to the shared markup reader:
 *   - class strings inside cn() / clsx() / cva() / cx() / twMerge() / twJoin() / classNames() / tv() calls and
 *     className={'…'} / className={"…"};
 *   - visible text = text between JSX tags only (TypeScript code, imports and props are not text); a JSX expression
 *     {…} is blanked unless it is a plain string literal ({'متن'}).
 * Cannot see (reported as "could not resolve" and measured by --render): classes built at runtime or passed as props
 * from other files, conditional branches, CSS-in-JS, and text that comes from messages/*.json or a CMS.
 */
import * as markup from './markup.mjs';

const { blank } = markup;
const CALL_RE = /\b(?:cn|clsx|cva|cx|twMerge|twJoin|classNames|tv)\s*\(/g;
const CLASSY = /^[\w\s:\-[\]/.!%#()@&>*+~=,'"]*$/; // looks like a class list, not prose

/** Index just after the matching ")" of the "(" at `open`, skipping strings. */
function closeParen(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') { const j = src.indexOf(c, i + 1); if (j < 0) return -1; i = j; continue; }
    if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i + 1;
  }
  return -1;
}

export function classLists(src) {
  const out = markup.classLists(src);
  for (const m of src.matchAll(/\bclassName\s*=\s*\{\s*(["'])([^"'\n]*)\1\s*\}/g)) out.push({ list: m[2], index: m.index });
  for (const m of src.matchAll(CALL_RE)) {
    const open = m.index + m[0].length - 1, end = closeParen(src, open);
    if (end < 0) continue;
    const inner = src.slice(open + 1, end - 1);
    for (const s of inner.matchAll(/(["'`])((?:(?!\1)[^\\\n])*)\1/g)) {
      if (s[2].includes('${') || !CLASSY.test(s[2]) || !s[2].trim()) continue;
      out.push({ list: s[2], index: open + 1 + s.index });
    }
  }
  return out;
}

const CODE = /;\s*(\n|$)|=>|\breturn\s*[(<]|\bfunction\s+\w|\b(const|let|var)\s+\w+\s*[=:]|\b(import|export)\s|^\s*[)}\]]+\s*[;,]?\s*$|\{\s*$|^\s*\(\s*$/m;

/** Text between two JSX tags that is code, not text (TypeScript between components, generics). */
export function isTextSegment(text) {
  return !CODE.test(text);
}

/** Blank {…} expressions (balanced), keeping plain string literals. */
function blankExpressions(t) {
  let out = '', i = 0;
  while (i < t.length) {
    if (t[i] !== '{') { out += t[i++]; continue; }
    let depth = 0, j = i;
    for (; j < t.length; j++) { if (t[j] === '{') depth++; else if (t[j] === '}' && --depth === 0) break; }
    const expr = t.slice(i, j + 1);
    const lit = expr.match(/^\{\s*(["'])([^"'{}]*)\1\s*\}$/);
    const at = lit ? expr.indexOf(lit[2]) : -1;
    out += lit ? blank(expr.slice(0, at)) + lit[2] + blank(expr.slice(at + lit[2].length)) : blank(expr);
    i = j + 1;
  }
  return out;
}

/** A "<" that opens a JSX tag, not a TypeScript generic (Promise<Metadata>, useState<string>(…)). */
export const isTagAt = (src, i) => src[i + 1] === '/' || !/[\w$.\])]/.test(src[i - 1] || ' '); // a closing tag is never a generic

/** Visible JSX text only, same length as the input (indexes keep their line numbers). */
export function visibleText(s) {
  const src = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, blank);
  let out = '', last = 0, prevTag = false;
  for (const m of src.matchAll(markup.TAG_RE)) {
    if (!isTagAt(src, m.index)) continue;
    const seg = src.slice(last, m.index);
    out += prevTag && seg.trim() && isTextSegment(seg) ? blankExpressions(seg) : blank(seg);
    out += blank(m[0]);
    last = m.index + m[0].length;
    prevTag = true;
  }
  return out + blank(src.slice(last));
}
