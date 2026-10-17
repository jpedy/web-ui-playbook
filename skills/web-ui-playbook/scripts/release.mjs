/**
 * web-ui-playbook — release.mjs (used by audit.mjs; zero dependencies)
 *
 * Things that must never reach a live site:
 *   - PLACEHOLDER markers and visible placeholder text («[… از شما]», TODO, TBD)
 *   - fake sample data (lorem ipsum, «شرکت نمونه», John Doe, example.com addresses, placeholder image hosts,
 *     trust-seal images without the issuer's verification link)
 *   - example phone numbers (0912 123 4567, 09123456789, 021-00000000 …) anywhere except an input's
 *     `placeholder` hint, where a format example is fine
 * With --release every finding is an ERROR; otherwise example phones and fake data are warnings and placeholders
 * are listed (they are expected while the owner's content is still missing).
 */
import { normalize } from './slop.mjs';

const PHONE = [
  /0 ?9\d\d[ -]?123[ -]?4567/g, // 0912 123 4567
  /09\d{2}1234567/g, // 09121234567
  /09123456789|09000000000|09111111111/g,
  /0\d{2}[ -]?0{7,8}\b/g, // 021-00000000
  /\b0{8,11}\b/g,
];
const FAKE = /lorem ipsum|لورم ایپسوم|john doe|jane doe|\bacme\b|شرکت نمونه|کاربر نمونه|فلانی|فلان فلانی|[\w.+-]+@example\.(com|org|net)|\bexample\.com\b/giu;
// visible placeholder convention (anti-generic.md §2): any bracketed text with a letter — «[شهریه به تومان]»
const VISIBLE_PLACEHOLDER = /\[[^\]\n]{0,80}\p{L}[^\]\n]{0,80}\]|\b(TODO|TBD|FIXME)\b/giu;

/**
 * @param o { file, raw, src (comments blanked), vis (visible text), lineOf, ignored:Set<line>, release:boolean }
 * @returns findings [{ file, line, sev, rule, msg }]
 */
export function releaseChecks({ file, raw, src, vis, lineOf, ignored, release }) {
  const out = [];
  const sev = release ? 'error' : 'warn';
  const add = (rule, idx, msg, { force = false, always = false } = {}) => {
    const line = lineOf(idx);
    if (!force && ignored.has(line)) return; // audit-ignore cannot hide placeholders in release mode
    if (!release && !always) return;
    out.push({ file, line, sev, rule, msg });
  };
  // 1. placeholder markers (in comments: read the raw source) and visible placeholder text
  for (const m of raw.matchAll(/PLACEHOLDER:?\s*([^\n]*?)\s*(-->|--\}\}|\*\/|$)/gm)) add('release-placeholder', m.index, `PLACEHOLDER still in the page: ${m[1] || '(no description)'} — replace it with the owner's real content or remove the element.`, { force: true });
  for (const m of vis.matchAll(VISIBLE_PLACEHOLDER)) add('release-placeholder', m.index, `visible placeholder text «${m[0]}» — replace it with real content before release.`, { force: true });
  // 2. fake sample data in visible text and in links/sources
  const N = normalize(vis);
  for (const m of N.text.matchAll(FAKE)) add('release-fake-data', N.at[m.index], `sample data «${m[0]}» in visible text.`, { always: true });
  for (const m of src.matchAll(/\b(href|src|content)\s*=\s*["'][^"']*(example\.(com|org|net)|picsum\.photos|placehold\.co|via\.placeholder\.com|dummyimage\.com|loremflickr\.com)[^"']*["']/gi)) add('release-fake-data', m.index, `sample link or image (${m[2]}) in ${m[1]}="…".`, { always: true });
  for (const m of src.matchAll(/<img\b[^>]*(enamad|samandehi)[^>]*>/gi)) {
    if (!/trustseal\.enamad\.ir|logo\.samandehi\.ir/.test(src.slice(Math.max(0, m.index - 400), m.index) + m[0])) add('release-fake-data', m.index, 'trust-seal image without the issuer\'s verification link — use the code eNamad/Samandehi gives you.', { always: true });
  }
  // 3. example phone numbers — allowed only inside an input/textarea placeholder="" hint
  const hints = [...src.matchAll(/<(input|textarea)\b[^>]*\bplaceholder\s*=\s*(["'])([^"']*)\2/gi)].map((m) => { const start = m.index + m[0].lastIndexOf(m[3]); return [start, start + m[3].length]; });
  const S = normalize(src); // digits ۰-۹ → 0-9, ZWNJ/nbsp → space
  const taken = [];
  for (const re of PHONE) for (const m of S.text.matchAll(re)) {
    const idx = S.at[m.index], end = S.at[m.index + m[0].length - 1];
    if (hints.some(([a, b]) => idx >= a && idx < b) || taken.some(([a, b]) => idx <= b && end >= a)) continue;
    taken.push([idx, end]);
    add('release-example-phone', idx, `example phone number «${src.slice(idx, S.at[m.index + m[0].length - 1] + 1)}» outside an input hint — use the owner's real number, or remove it.`, { always: true });
  }
  return out;
}
