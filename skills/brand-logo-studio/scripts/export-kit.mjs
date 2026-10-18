#!/usr/bin/env node
/**
 * brand-logo-studio — export-kit.mjs
 *
 *   node export-kit.mjs --brief brief.json --direction A|B|C [--out public/brand]
 *
 * Writes the full brand kit for the chosen direction: SVG masters (bilingual, Persian-only, wordmarks,
 * icon, reversed, one-color), favicon.svg/.ico, app and social PNGs, site.webmanifest, a Blade head
 * snippet, a brand sheet, a large proof sheet of the Persian wordmark, and kit-report.md.
 * Exit code 1 if any blocking validation finding remains. File list: references/brand-kit-spec.md.
 */
import { loadBrief, preloadProfile } from './lib/brief.mjs';
import { exportKit } from './lib/kit.mjs';
import { outDir } from './lib/util.mjs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!get('brief') || !get('direction')) { console.log('Usage: node export-kit.mjs --brief brief.json --direction A|B|C [--out public/brand]'); process.exit(2); }
await preloadProfile(get('brief'));
const brief = loadBrief(get('brief'));
const out = outDir(get('out'));
const res = await exportKit(brief, get('direction'), out);
console.log(`wrote  ${res.files.length} files to ${out}  (direction ${res.dir.id}: ${res.dir.title})`);
if (res.proof) {
  console.log(`proof  ${res.proof.file}  · browser comparison ${res.proof.chrome.status}${res.proof.chrome.score ? ` (${(res.proof.chrome.score * 100).toFixed(1)}%)` : res.proof.chrome.reason ? ` — ${res.proof.chrome.reason}` : ''}`);
  for (const c of res.proof.checks.filter((x) => !x.ok)) console.log(`  ⚠ ${c.ch} ${c.name}: ${c.detected}/${c.expected} dots — check by eye`);
}
const grouped = new Map();
for (const f of res.findings) { const key = `${f.level}|${f.id}|${f.msg}`; grouped.set(key, [...(grouped.get(key) || []), f.file]); }
for (const [key, list] of grouped) { const [level, id, msg] = key.split('|'); console.log(`${level.padEnd(5)}  ${id}: ${msg}
       in ${list.join(', ')}`); }
for (const d of res.decisions) console.log(`auto   ${d}`);
for (const w of res.warnings) console.log(`note   ${w}`);
console.log('Read kit-report.md, then open proof/proof-wordmark.png and brand-sheet.png — the final check is by eye.');
process.exit(res.findings.some((f) => f.level === 'FAIL') ? 1 : 0);
