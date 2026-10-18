/**
 * web-ui-playbook — parsers/markup.mjs
 * The shared markup reader used by audit.mjs for HTML, Blade, JSX/TSX and Vue templates (regex-based, zero deps).
 * Stack parsers (parsers/index.mjs) reuse these and add their own class sources.
 * What regex reading cannot see (runtime classes, props from other files, CMS text) is reported as unresolved
 * by the audit and measured by --render instead.
 */
export const blank = (s) => s.replace(/[^\n]/g, ' ');

/** Remove comments (keeping line structure). */
export function stripComments(src, isCss) {
  let s = src.replace(/<!--[\s\S]*?-->/g, blank).replace(/\{\{--[\s\S]*?--\}\}/g, blank);
  s = s.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!isCss) s = s.replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  return s;
}

/** Visible text only: drop script/style, Blade/PHP expressions, then tags. */
export function visibleText(s) {
  return s
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, blank)
    .replace(/@php[\s\S]*?@endphp/g, blank)
    .replace(/<\?php[\s\S]*?\?>/g, blank)
    .replace(/\{\{[\s\S]*?\}\}|\{!![\s\S]*?!!\}/g, blank)
    .replace(/<code\b[\s\S]*?<\/code>|<pre\b[\s\S]*?<\/pre>/gi, blank)
    .replace(/<[^>]*>/g, blank);
}

/** Class lists written in the source → [{ list, index }]. class / className / :class / x-bind:class / ->class() / $base. */
const CLASS_RE = /(?:\bclass|\bclassName|:class|x-bind:class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})|->class\(\s*'([^']*)'|\$base\s*=\s*'([^']*)'/g;
export function classLists(src) {
  return [...src.matchAll(CLASS_RE)].map((m) => ({ list: m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '', index: m.index }));
}

// ---------- element tree for --contrast ----------
export const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);
export const TAG_RE = /<(\/?)([A-Za-z!][\w:.-]*)((?:"[^"]*"|'[^']*'|\{\{[\s\S]*?\}\}|\{[^{}]*\}|[^'"{}>])*)>/g;

/** One opening tag → { tag, line, dynamic, style, component, classes[] }. */
export function parseEl(tag, attrs, line) {
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
