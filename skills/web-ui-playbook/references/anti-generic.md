# Anti-generic — make the page belong to this client

A page looks "generated" when it could belong to any business in the category. This file is the taste layer: the commitment you write before tokens, the content rules, the list of generic tells, and what the audit can and cannot check.

Sources: this plugin's research reports, and ideas adapted from taste-skill (github.com/Leonxlnx/taste-skill @ `f624f37`, MIT) cited as `ts:` file + line — rewritten for Persian/RTL, Iran's network and Blade/Alpine. What was rejected and why: `THIRD_PARTY_NOTICES.md`. Labels: `[General practice]`, `[Emerging]` (some panel or study support), `[Opinion]` (taste, not law). Nothing from taste-skill is `[Proven]`: in its own blind comparisons, judged by models, it never beat the no-skill baseline on average (ts: `skills/taste-skill/references/research.md` L287–291; `CHANGELOG.md` L57).

**Two honest limits:**
1. `audit.mjs --slop` finds *tells*, not quality. A page with zero warnings can still be thin or wrong. Removing tells alone made pages emptier in taste-skill's own tests (ts: `references/critique.md` L55, L69 "Substance") — so the review ends with the **substance pass** (review-checklist.md §F).
2. **The audit cannot verify truth.** It lists every number, superlative and quote for the owner to confirm. A `{{-- source: … --}}` comment proves nothing — anyone (including an AI) can write one.

## 1. Before tokens: the subject, the idea, the argument
**Subject inventory** [Opinion] (ts: `skills/taste-skill/SKILL.md` L50–51). List 8–12 things only this client has: real class times, teachers' names and what they teach, the neighbourhood, the placement-test format, a price detail, a photo they own. **Ask the owner for them** — never fill the list with guesses.

**Idea sentence + competitor test** [Opinion] (ts: SKILL.md L142–143). One sentence: "<the visitor's problem> becomes <what this client does about it>". Put the nearest real competitor's name in it: if it still works, the idea is generic — use a more specific inventory item.

**Argument first** [General practice] (ts: SKILL.md L64–66; `references/copy.md` §1). Write the page as claims, one line per section, each with its proof from the inventory:
```
claim                                         proof (from the owner)
"کلاس‌های عصر برای کارمندها"                 ← timetable: زوج/فرد ۱۸:۳۰ و ۲۰:۰۰
"سطحت را در ۱۵ دقیقه بدان"                   ← the real placement test, free, no sign-up
"قیمت روشن، قسطی"                             ← real price list + installment rule
```
The claims decide which sections exist and their order. **A section without real proof is either cut or kept with a visible PLACEHOLDER and listed for the owner** — never filled with invented numbers. This replaces the stock order (hero → logos → 3 features → testimonial → pricing → CTA).

## 2. Real content only [General practice — house rule]
- **Numbers, testimonials and logos come only from the owner.** Until they arrive: a visible placeholder in the page and a comment for the audit:
  ```blade
  {{-- PLACEHOLDER: number of students — ask the owner --}}
  <span class="rounded bg-warning-subtle px-2 text-warning-fg">[عدد واقعی از شما]</span>
  ```
- No "sample" stats, no plausible-looking odd numbers (`۴۷٫۲٪`) — that is fabricated data dressed up (rejected: ts: `skills/redesign-skill/SKILL.md` L82).
- Photos: the owner's own first; a found picture is never presented as the client's; never hotlinked (picsum/Unsplash — foreign hosts, fake content).
- The report lists **every number and quote on the page** (the audit prints them under "Claims to confirm"), placeholders included, for the owner to confirm.
- Intake ends with a short "what I need from you" list: photos, teacher names, class times, prices, consented testimonials, license and eNamad IDs.

## 3. Design commitment — written to the user's project
Before step 3 (tokens), write **`docs/design-commitment.md` in the user's project** (never in the plugin folder) and keep it current. Later sessions read it first, so the design stays consistent, and a rebuild says how it differs.
```markdown
# Design commitment — <project> (<date>)
1. Type: <Persian font + weights> / <Latin font>; sizes: <≤ 5, e.g. 14/16/20/28/40>
2. Color roles: palette from brand-color-system (<file>); accent used only for <≤ 2 places>; field-color sections: <none | which>
3. Layout rhythm: <section sequence as layout words: statement / split / table / list / full-bleed>; planned exception: <one>; start-edge anchors: <2–3>
4. Signature detail: <one thing from the subject inventory, e.g. the real زوج/فرد timetable as the hero> — passes the competitor test
5. Motion budget: <calm | balanced | lively> — moving elements: <list>
Dials: variance <calm|balanced|bold> · motion <still|subtle|lively> · density <airy|balanced|dense>
Differs from the previous build: <what changed and why | first build>
```
[Opinion] — the five-decision block adapts taste-skill's dials and "design read" (ts: `skills/taste-skill-v2-experimental/SKILL.md` L47–75) and stitch's per-project design doc (ts: `skills/stitch-skill/DESIGN.md`).

## 4. Dials — plain words, Persian-safe defaults [Opinion]
Never show numbers to the user. Defaults per direction are in `visual-direction.md` §1.
| Dial | calm / still / airy | balanced / subtle | bold / lively / dense |
|---|---|---|---|
| **Variance** (layout surprise) | symmetric, one column rhythm | one asymmetric moment per page | asymmetric grid, oversized type — Bold Campaign/Editorial only |
| **Motion** | state feedback only | + reveal-once on section entry, one signature move | + one scroll-linked moment (CSS, `@supports`) — never scroll hijacking |
| **Density** | large gaps, few items | design-foundations defaults | dashboards, shops |

High variance collapses to one column under 768px; mirroring happens only through logical properties. Iran default: **variance balanced, motion subtle**.

## 5. Generic tells — registry ⏱ (Oct 2026)
`[auto]` = `audit.mjs --slop` warns (rule id). Everything is a warning: fix it, or keep it and say why.

**Layout**
- Three identical icon + heading + text cards; a `@foreach` of them `[auto slop-cards]` — make the items differ in kind (a table, a timetable, a real example). Real product/course grids are exempt. (ts: `references/tells.md` L32) [Emerging]
- Three sections in a row with the same layout `[auto slop-repeat-sections]`; more than 2 zig-zag image/text splits (by eye) [Opinion]
- Pill badge right above the headline `[auto slop-pill-badge]` (ts: tells.md L41; v2-exp L253) [Emerging]
- Card in a card in a card; centered paragraphs longer than 2 lines; centered table text [General practice]
- Hero carousels; auto-playing background video [General practice]
- Hero: ≤ 4 text elements, Persian subtext ≤ ~25 words, the CTA inside the first screen (ts: v2-exp L236–241; their 20-word limit relaxed for longer Persian words) [Opinion]
- RTL: "left-aligned" means **start-aligned** (right); count shared *start* edges (2–3 per page) [Opinion]

**Color and surface**
- Decorative blurred blobs `[auto slop-blob]`; purple-to-blue "AI" gradients when purple is not the brand; glowing orbs and sparkle icons (ts: tells.md L27) [Emerging]
- Gradient text `[auto slop-gradient-text]` (ts: tells.md L28) — also unresolvable for contrast
- More than one glass (backdrop-blur) surface `[auto slop-glass]` (ts: tells.md L29); glass text over busy images without a solid tint
- Random radii and spacing, 3+ shadow styles, hardcoded hex instead of tokens [General practice]
- Kept on purpose (taste-skill bans rejected): shadows (prefer a tone step), input borders (WCAG 1.4.11), saffron/brick/terracotta (Iranian meaning), one hero gradient `in oklch`

**Type**
- Persian text under 13px `[auto slop-small-fa]` — house rule ≥ 13px (dots and joins blur first); captions move from 12 to 13px
- Persian tracking, italic, uppercase `[auto fa-tracking]`; negative display tracking and leading under 1.2 are Latin-only habits
- One styled accent word (italic serif, colored word) [Opinion] (ts: tells.md L43)
- More than 4 em dashes per page `[auto slop-emdash]` (ts: `scripts/lint.mjs` L86) — a warning, not a ban

**Copy**
- Stock phrases `[auto slop-filler]` and claims needing proof `[auto slop-claim]`: Persian list in `scripts/data/fa-slop.json` (owner-reviewed, dated); English in `en-slop.json` (adapted from ts: `references/copy.md` L156–157, lint.mjs L48)
- Generic button labels `[auto slop-cta]`; the same generic label 2+ times without context `[auto slop-link-purpose]` (WCAG 2.4.4 — add `sr-only` text or `aria-label` naming the target) (ts: lint.mjs L49)
- Invented proof: number claims `[auto slop-stat]`, testimonials `[auto slop-testimonial]`, fake trust seals `[auto slop-trust-seal]` — all listed for the owner
- Lorem/placeholder identities in visible text `[auto slop-lorem]`; emoji as icons `[auto slop-emoji]` (ts: tells.md L33)
- Scroll cues, pulsing dots outside loading `[auto slop-furniture]`; "01/02/03" index labels outside a real `<ol>` `[auto slop-index-numbers]` (ts: tells.md L75 — their own panel data shows numbering is *more* common on strong sites, L67, so it is only a warning)
- "Three of everything"; a second register (formal + slang) [Opinion]

**Motion** (baseline — `components-and-states.md` §Motion baseline)
- `transition-all`, `ease-in`, `scale-0` entrances `[auto slop-motion]` (ts: lint.mjs L51–53) [General practice]
- Reveals without an `html.js` gate `[auto slop-reveal-gate]` (ts: `references/motion.md` L75)
- Scroll hijacking, smooth-scroll libraries, custom cursors, perpetual loops (ts: motion.md L281) [General practice]

**Imagery**
- Placeholder image hosts `[auto slop-image-host]`; foreign hosts `[auto foreign-host]`; mixed icon sets (one set per site, `visual-direction.md` §5)
- One dominant real image beats six small ones; a real UI fragment beats a fake dashboard of grey bars [Emerging] (ts: `references/imagery.md` L3–4)

Persian lists are data: edit `scripts/data/fa-slop.json` (bump `date`, keep `reviewedBy` honest). A project can allow a phrase or a rule with `.slop-allow.json` at its root:
```json
{ "allowPhrases": ["اساتید مجرب"], "allowLabels": ["بیشتر"], "disableRules": ["slop-emdash"] }
```
Use it only with a reason the owner agrees with (e.g. the owner's registered slogan).

## 6. No clichés — Persian identity without ornament [Opinion]
No Persepolis columns, mosque domes, arabesque tiles, Nastaliq as decoration, pomegranates, Simurgh or carpet motifs — **unless they are the subject** (a carpet shop shows its own carpets). Persian identity comes from type, language, real content and Iranian UX conventions (زوج/فرد timetables, Toman with installments, Jalali dates, eNamad, Bale/Eitaa contact). Respect the calendar: no celebratory campaigns in Muharram; Nowruz and Yalda are real moments.

## 7. "One live thing" (optional) [Opinion]
One element built from the owner's real data that the visitor can use: a tuition calculator in Toman with installments, a class-time picker, the placement test's first question. It must work without JS (a plain form or table first) and is never required (ts: SKILL.md L149).

## 8. Redesign mode
Classify first: **Preserve** (polish inside the current look), **Overhaul** (new look, same content and URLs) or **Greenfield** (ts: v2-exp L807). Audit before touching anything. **Never change silently:** URLs and slugs, nav labels, form field names, logo, legal copy, analytics IDs, eNamad/Samandehi code, payment-gateway callback URLs, SMS templates. Order: must-fix (contrast, RTL, foreign CDNs, broken states) → tells → rhythm → signature detail.
