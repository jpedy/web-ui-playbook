/**
 * web-ui-playbook — parsers/index.mjs
 * Which reader handles which file. Every reader returns the same shapes (class lists, visible text, element tree),
 * so each audit rule exists once and runs on every stack. Readers per stack: references/stacks/<stack>.md
 * ("Audit and render recipe") lists what each one can and cannot see.
 */
import * as markup from './markup.mjs';
import * as jsx from './jsx.mjs';

/** Files the audit reads. */
export const EXT = /\.(html?|blade\.php|jsx|tsx|vue|css)$/i;

const KIND = [
  [/\.css$/i, 'css'],
  [/\.blade\.php$/i, 'blade'],
  [/\.html?$/i, 'html'],
  [/\.(jsx|tsx)$/i, 'jsx'],
  [/\.vue$/i, 'vue'],
];
const READERS = {
  jsx: { classLists: jsx.classLists, visibleText: jsx.visibleText, isTextSegment: jsx.isTextSegment, isTagAt: jsx.isTagAt },
};

/** → { name, isCss, isPage, isLayout, stripComments, visibleText, classLists, isTextSegment, parseEl, TAG_RE, VOID } */
export function parserFor(file) {
  const name = (KIND.find(([re]) => re.test(file)) || [null, 'markup'])[1];
  return {
    ...markup,
    isTextSegment: () => true,
    isTagAt: () => true,
    ...(READERS[name] || {}),
    name,
    isCss: name === 'css',
    isPage: name === 'html' || name === 'blade',
    // a Next.js layout holds <html> but the page's <h1> lives in page.tsx
    isLayout: name === 'jsx' && /(^|[\\/])layout\.(jsx|tsx)$/i.test(file),
  };
}
