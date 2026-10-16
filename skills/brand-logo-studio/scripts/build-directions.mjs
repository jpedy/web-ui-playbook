#!/usr/bin/env node
/**
 * brand-logo-studio — build-directions.mjs
 *
 *   node build-directions.mjs --brief brief.json [--out brand-kit]
 *
 * Builds three logo directions from the brief (A container, B symbol, C wordmark-led) and writes one
 * contact sheet: each direction on light and dark, the icon at 128/64/32/16 px, and one-color.
 * Show the sheet to the user and let them pick A, B or C; then run export-kit.mjs --direction <id>.
 */
import path from 'node:path';
import { loadBrief } from './lib/brief.mjs';
import { directionsSheet } from './lib/kit.mjs';
import { outDir } from './lib/util.mjs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!get('brief')) { console.log('Usage: node build-directions.mjs --brief brief.json [--out brand-kit]'); process.exit(2); }
const brief = loadBrief(get('brief'));
const out = outDir(get('out'));
const file = path.join(out, 'directions.png');
const dirs = await directionsSheet(brief, file);
console.log(`wrote  ${file}`);
for (const d of dirs) console.log(`  ${d.id}  ${d.title}\n     ${d.why}`);
for (const n of [...brief.notes, ...brief.colors.notes]) console.log(`note   ${n}`);
console.log('Show the sheet to the user and ask which direction (A, B or C) to export.');
