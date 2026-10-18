/**
 * web-ui-playbook — parsers/index.mjs
 * Which reader handles which file. Every reader returns the same shapes (class lists, visible text, element tree),
 * so each audit rule exists once and runs on every stack. Readers per stack: references/stacks/<stack>.md
 * ("Audit & render recipe") lists what each one can and cannot see.
 */
import * as markup from './markup.mjs';

/** Files the audit reads. */
export const EXT = /\.(html?|blade\.php|jsx|tsx|vue|css)$/i;

const KIND = [
  [/\.css$/i, 'css'],
  [/\.blade\.php$/i, 'blade'],
  [/\.html?$/i, 'html'],
  [/\.(jsx|tsx)$/i, 'jsx'],
  [/\.vue$/i, 'vue'],
];

/** → { name, isCss, isPage, stripComments, visibleText, classLists, parseEl, TAG_RE, VOID } */
export function parserFor(file) {
  const name = (KIND.find(([re]) => re.test(file)) || [null, 'markup'])[1];
  return {
    ...markup,
    name,
    isCss: name === 'css',
    isPage: name === 'html' || name === 'blade',
  };
}
