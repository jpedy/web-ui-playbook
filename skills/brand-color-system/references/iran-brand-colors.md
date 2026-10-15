# Iranian brand primary colors — competitor-distance data

⏱ **As of 2026-10-15 — verify before relying.** Brands change colors; this table is only used to *warn* when a new brand color sits too close to a well-known one in the same market. It is never a palette to copy.

`scripts/generate-palette.mjs --market iran` reads the table below (any row whose third column holds a hex). Edit it here, not in the script. Add a row when you verify a brand; change **Evidence** and **Checked** when you re-verify.

**Evidence levels:**
- **site source** — the hex appears in the brand's public homepage HTML/CSS, fetched on the Checked date (a color in page source is a strong hint, not proof that it is the official brand color).
- **report only** — taken from the Oct 2026 research report and not confirmed (pages render with JavaScript, or fetch failed). Treat as approximate.

| Brand | Category | Primary hex | Evidence | Checked |
|---|---|---|---|---|
| Digikala (دیجی‌کالا) | e-commerce marketplace | `#ef394e` | site source (report also lists `#ed1944` as logo red — unconfirmed) | 2026-10-15 |
| Divar (دیوار) | classifieds | `#c32e2e` | site source (report said `#a62626` — differs) | 2026-10-15 |
| Torob (ترب) | price comparison | `#ae1f27` | site source (report said `#d73948` — differs) | 2026-10-15 |
| Cafe Bazaar (کافه‌بازار) | app store | `#0ea960` | site source (`#28a745` also present; report said `#28a745`) | 2026-10-15 |
| Alibaba.ir (علی‌بابا) | travel booking | `#fdb713` | site source (web manifest theme color) | 2026-10-15 |
| Snapp (اسنپ) | ride-hailing / super-app | `#00d170` | report only | 2026-10-15 |
| Tapsi (تپسی) | ride-hailing | `#ff5722` | report only | 2026-10-15 |
| Aparat (آپارات) | video | `#ed145b` | report only | 2026-10-15 |
| BluBank (بلوبانک) | neobank | `#2b74ff` | report only | 2026-10-15 |

## How the warning works
A brand color is flagged when, compared with a row above (both colors clearly colored, chroma > 0.04):
- hue differs by **< 25°**, and
- lightness differs by **≤ 0.12** and chroma by **≤ 0.08** (OKLCH).

The warning is advice, not a block: being close to a brand in a **different** category (e.g. a red language school vs Digikala) is usually fine. In the **same** category, shift the hue ≥ 25° or change lightness clearly, and lean on a distinct logo and name. The thresholds are a house heuristic (not from research — tune if needed).

Never copy a competitor's full palette or logo colors as "inspiration"; use this table only to stay *away* from them.
