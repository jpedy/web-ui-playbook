/**
 * web-ui-playbook — parsers/tier2.mjs (best effort, zero deps): Svelte (.svelte) and Astro (.astro) templates.
 * Reads class strings and template text; every {expression}, class:directive and class={…} is dynamic, so its colors
 * are "could not resolve" in --contrast and measured by --render. Astro's --- frontmatter is code, not text.
 */
import * as markup from './markup.mjs';

const { blank } = markup;
const blankExpr = (s) => s.replace(/\{[^{}]*\}/g, blank);

/** Svelte: class:name={…} / class={…} make an element's classes dynamic. */
export const svelte = {
  visibleText: (s) => markup.visibleText(blankExpr(s)),
  parseEl(tag, attrs, line) {
    const el = markup.parseEl(tag, attrs, line);
    if (/(^|\s)class(:[\w-]+)?\s*=\s*\{/.test(attrs)) el.dynamic = true;
    return el;
  },
};

/** Astro: frontmatter is code; class:list={[ 'a', cond && 'b' ]} literals are read, the element stays dynamic. */
export const astro = {
  stripComments: (src, isCss) => markup.stripComments(src.replace(/^---[\s\S]*?\n---/, blank), isCss),
  visibleText: (s) => markup.visibleText(blankExpr(s.replace(/^---[\s\S]*?\n---/, blank))),
  classLists(src) {
    const out = markup.classLists(src);
    for (const m of src.matchAll(/class:list\s*=\s*\{([\s\S]*?)\}\s*(?=[\s/>])/g))
      for (const s of m[1].matchAll(/(["'`])([^"'`\n$]*)\1/g)) if (s[2].trim()) out.push({ list: s[2], index: m.index });
    return out;
  },
  parseEl(tag, attrs, line) {
    const el = markup.parseEl(tag, attrs, line);
    if (/(^|\s)class:list\s*=|(^|\s)class\s*=\s*\{/.test(attrs)) el.dynamic = true;
    return el;
  },
};
