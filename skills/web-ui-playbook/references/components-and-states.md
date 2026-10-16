# Components & States — exact specs

Build every component from tokens (`design-foundations.md`) and give it **all** its states. A component missing hover, focus, disabled, loading or error states is unfinished. Mostly general practice; values from reports A and B are marked `[Proven]`.

RTL note: everything here uses logical properties (`ps-*`/`pe-*`/`ms-*`/`me-*`/`start-*`/`end-*`), so it mirrors automatically under `dir="rtl"`. Persian line-height adjustments are in `persian-rtl.md` §3.

## Contents
1. State matrix
2. Buttons
3. Form controls
4. Cards
5. Navigation: header, sidebar, bottom nav, footer, breadcrumbs, tabs
6. Overlays: modal, sheet/drawer, popover, tooltip, toast
7. Data display: badge, avatar, table, pagination, stat card
8. Feedback: loading, empty, error, success, offline
9. Icons
10. Charts (dashboards)
11. UX copy (English and Persian)
12. Motion baseline
13. Common mistakes

---

## 1. State matrix (apply to every interactive element)
| State | Visual rule | Code |
|---|---|---|
| Default | token colors | — |
| Hover (pointer only) | bg one ramp step darker or `surface-subtle`; 150ms | `hover:` |
| Focus-visible | 2px focus ring, 2px offset, ≥ 3:1 | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus` |
| Active/pressed | one more step darker, or `translate-y-px` | `active:` |
| Disabled | 50% opacity, `cursor-not-allowed`, no hover change | `disabled:` + `aria-disabled` when it must stay focusable to explain why |
| Loading | spinner replaces the leading icon, width unchanged, clicks blocked | `aria-busy="true"`, `disabled` |
| Error | danger border + icon + message text | `aria-invalid="true"`, `aria-describedby` |
| Selected/current | primary-subtle bg + primary text, or a 2px indicator bar | `aria-current` / `aria-selected` |

Hover must never be the only way to reveal something: touch has no hover `[Proven, report A]`.

## 2. Buttons
| Size | Height | Padding-inline | Font | Use |
|---|---|---|---|---|
| sm | 32px | 12px | 13–14px/500 | dense tables and toolbars (desktop only) |
| md (default) | 40px | 16px | 14–15px/500–600 | most UI |
| lg | 44–48px | 20–24px | 16px/600 | primary CTA, mobile forms `[Proven: CTA 44–48px, padding 20–24px]` |

- **Variants:**
  - **primary** (solid `bg-primary text-primary-fg`) — **one per view/section**.
  - **secondary** (border, or `surface-subtle` fill).
  - **ghost** (text only, for tertiary actions).
  - **destructive** (`bg-danger`; only for the confirming action itself).
  - **link**.
- Icon + label gap 8px; icon 16–20px. Icon-only buttons are square (40×40 / 44×44) with an `aria-label`.
- Full width on mobile for the primary action of a form (`w-full sm:w-auto`).
- **Labels:** verb + object ("Create project", "Book a free class"). Persian: verbal noun ("ثبت سفارش", "رزرو کلاس رایگان"). Never "Submit", "Click here" or "Learn more" alone.
- Prevent double-submit: disable the button and show the spinner after the first click.
- *EdTech/playful variant:* `border-b-4 border-primary-hover active:border-b-0 active:translate-y-1` (Duolingo-style press).

## 3. Form controls
**Layout:**
- Label **above** the field, always visible. A placeholder is never the label.
- Single column, with 16–24px between fields.
- Group related fields under a heading.
- Mark optional fields "(optional)" rather than starring required ones, when most fields are required.

| Control | Spec |
|---|---|
| Text input | height 40–44px (48px on mobile primary forms), padding-inline 12–14px, radius md, 1px border **`border-border-strong`** (≥ 3:1 vs bg — the lighter `border-border` is for cards/dividers only), **font-size ≥ 16px on mobile** (smaller makes iOS Safari zoom) |
| Label | 14px/500, 6–8px gap to the field |
| Helper text | 13–14px muted, below the field |
| Error message | 13–14px danger + icon, below the field, specific fix: "Enter an 11-digit mobile number starting with 09" `[Proven, report B]` |
| Textarea | min 3 lines; `field-sizing: content` to auto-grow (newly available, so add `min-h`) |
| Select | same height as inputs; native `<select>` on mobile |
| Checkbox/radio | 18–20px box inside a ≥ 44px tall clickable label row |
| Switch | 44×24 track; only for instant-effect settings (no "Save" needed) |
| OTP code | one input 56px tall, 24px bold digits, centered (`.otp-input` in persian-base.css) — or 4–6 boxes of 44–48px; `inputmode="numeric" autocomplete="one-time-code" dir="ltr"`; no letter-spacing on Persian pages (persian-base zeroes it); auto-submit when complete |

**Validation `[Proven, report B]`:**
- Validate on **blur**, then re-validate on each keystroke once the field is in error, so the message clears the moment the input is valid.
- Async checks are debounced 300ms.
- Never clear the user's input on error. On submit failure, focus the first invalid field and show an error summary at the top for long forms.

**Input attributes cheat-sheet:**
| Field | Attributes |
|---|---|
| Email | `type="email" autocomplete="email" dir="ltr"` |
| Phone | `type="tel" inputmode="tel" autocomplete="tel" dir="ltr"` |
| One-time code | `inputmode="numeric" autocomplete="one-time-code" dir="ltr"` |
| Full name | `autocomplete="name"` (one "Full name" field, not first/last) `[Proven]` |
| Password | `autocomplete="current-password"` or `"new-password"`, paste allowed, show/hide toggle |
| Card number | `inputmode="numeric" autocomplete="cc-number" dir="ltr"`, auto-group 4-4-4-4 |
| Amount | `inputmode="numeric"`, thousands separators while typing, unit shown as a suffix |

## 4. Cards
- Padding 16px mobile, 24px desktop (32px for feature cards); radius lg (12–16px); border **or** `shadow-sm`.
- **Whole-card click:** a single `<a>` on the title with a `::after` overlay (stretched link), so the card has one tab stop. Hover: shadow sm→md and/or border darkens; optional `-translate-y-0.5`.
- Equal-height rows: CSS grid. Push the CTA to the bottom with `mt-auto` in a flex column, or use `subgrid` for aligned header/body/footer.
- At most 4 data points per bento cell `[Proven, report B]`.

## 5. Navigation
| Element | Spec |
|---|---|
| Top header | 56–64px desktop, 56px mobile; sticky with a solid or 90%-opaque bg; logo at start, primary nav 5–7 items max, one primary CTA at end `[Proven: 5–7 items]` |
| Mega-menu | 3–4 columns with headings; opens on click/Enter, not hover-only |
| Mobile menu (content sites) | full-height drawer from the **start** edge, focus-trapped, close button 44px |
| App sidebar | 240–260px expanded, 48–56px icon rail collapsed; active item = primary-subtle bg + 2px indicator at the start edge `[Proven]` |
| Bottom nav (mobile apps; Iranian consumer sites) | 4–5 tabs, 56–64px + `env(safe-area-inset-bottom)`, icon 24 + label 11–12px (Persian ≥ 12px), active = primary color + filled icon |
| Breadcrumbs | 13–14px muted, separator chevron mirrored in RTL, current page not a link (`aria-current="page"`) |
| Tabs | 40–44px tall, 2px active underline, arrow-key navigation, `role="tablist"`; scroll horizontally on mobile instead of wrapping |
| Footer | 3–4 link columns, contact, legal, language switch; Iran: eNamad seal + phone (see `iran-market.md`) |
| Skip link | first focusable element: "Skip to content" / «رفتن به محتوای اصلی» |

## 6. Overlays
| Element | Spec |
|---|---|
| Modal | widths 400 (confirm) / 560 (form) / 720 (rich); max-height 85dvh with internal scroll; padding 24px; overlay `rgb(0 0 0 / .45)`; focus trapped, Esc closes, focus returns to the trigger; title in `<h2>`; primary action at end, cancel before it |
| Mobile (< 640px) | replace centered modals with a **bottom sheet**: top radius 16px, drag handle 32×4px, max 90dvh |
| Side sheet/drawer | 360–480px wide, slides from the end edge (detail panels) or start edge (navigation) |
| Popover/dropdown | min-width 180px, item height 36–40px, 4–8px offset from the trigger, closes on outside click and Esc |
| Tooltip | 12–13px, max-width 240px, 300–500ms delay; never holds essential info; not for touch-only UIs |
| Toast | bottom-center on mobile, bottom-end on desktop, max 3 stacked; auto-dismiss 4–6s (errors stay until dismissed); `role="status"` (errors `role="alert"`); "Undo" action for reversible deletes |
| Confirm dialog | only for destructive/irreversible actions; name the object: "Delete project 'Alpha'?"; destructive button labeled with the verb ("Delete"), not "OK" |

## 7. Data display
- **Badge/pill:** 20–24px tall, padding-inline 8–10px, 12px/500, `radius-full`. Status = 50-tint bg + 700 text + optional dot. Persian badges: **no fixed `h-5`**; use `py-0.5` + line-height 1.6 so dots aren't clipped.
- **Avatar:** 24/32/40/56px, circle, initials fallback on a neutral-200 bg.
- **Stat/KPI card:** label 13–14px muted → value 28–32px/700 `tabular-nums` → delta badge (▲ 12% green / ▼ red, **with** the arrow, not color alone) → optional sparkline 32–40px tall → period text ("vs last 30 days").
- **Table:** see `patterns-web-apps.md` §3. Two rules found in testing: (1) a table with 6+ columns shows only from `lg` (1024px) up — below that render the same data as cards (`hidden lg:block` / `lg:hidden`); (2) `whitespace-nowrap` on time, date, money and ID cells so «۱۸:۰۰ تا ۱۹:۳۰» or "$12,000.00" never wrap.
- **Pagination:** prev/next plus page numbers (max 7 visible with ellipsis), 40px targets, "Showing 21–40 of 312". In RTL, "next" points left.
- **Lists:** row height 48–64px for touch, a divider or 8px gap, primary text 14–16px plus secondary 13px muted.

## 8. Feedback states (design these for every data view)
| State | Rule |
|---|---|
| Loading < 300ms | show nothing (avoids flicker) |
| Loading 300ms–2s | skeleton matching the final layout's shapes (no spinner-only pages) |
| Loading > 2s | skeleton + progress text; > 10s → progress bar + allow leaving |
| Empty (first use) | illustration/icon + one sentence of value + primary CTA (create, import, use template, load sample data). **Never just "No records found"** `[Proven, report B]` |
| Empty (no results) | show the query, suggest fixes, offer "Clear filters" |
| Error | what happened + what to do + retry button; keep the user's data; no raw error codes as the headline |
| Success | inline confirmation or toast; after forms, show the next step |
| Offline / slow network (Iran) | banner "No connection — changes will sync" / «اتصال اینترنت برقرار نیست»; keep cached content visible |

## 9. Icons
- One set (Lucide, Heroicons, Tabler or Phosphor), inline SVG, `currentColor`, stroke 1.5–2.
- Sizes: 16 (inline/dense), 20 (buttons, inputs), 24 (nav, mobile), 32–48 (feature/empty states).
- Decorative: `aria-hidden="true"`. Meaningful without text: `aria-label` on the button, not on the svg.
- Directional icons (arrows, chevrons, send, back) mirror in RTL with `rtl:-scale-x-100`. Non-directional icons never mirror — see `persian-rtl.md` §10.

## 10. Charts (dashboards)
| Question | Chart |
|---|---|
| Trend over time | line (≤ 4 series) or area (1–2 series) |
| Compare categories | bar; horizontal bar when labels are long or > 7 categories |
| Part of a whole | stacked bar or 100% bar; donut only for ≤ 4 slices; never 3D or pie > 5 slices |
| Distribution | histogram / box plot |
| Single KPI | big number + delta + sparkline (not a gauge) `[Proven, report B]` |

- **Colors:** one hue for a single series; ≤ 6 categorical colors, colorblind-distinguishable (blue, orange, teal, purple, gray, yellow-dark); highlight the important series and gray the rest.
- **Axes:** bar charts start at 0; light gridlines (`border` token at 50%); label units; `tabular-nums`; tooltips on hover **and** focus; legend only if > 1 series (or label lines directly).
- **Accessibility:** give every chart a title and a one-sentence takeaway in text; provide the numbers in a table or `aria-label`.
- **RTL/Persian:** keep cartesian time axes chronological left→right (the common, mathematically safe choice) but render labels in Persian digits and Jalali months. Whichever direction you pick, keep it the same across the whole product `[Emerging, report C]`.
- **Libraries:** use any npm-installed chart library bundled locally (e.g. Chart.js, ApexCharts) — never a CDN script. (General practice — not from reports.)

## 11. UX copy
**English:**
- Sentence case for buttons, labels and headings ("Create project", not "Create Project").
- Buttons are verb + object. Links describe their destination.
- Errors state the problem and the fix: "Card number is 16 digits — you entered 15". No "Oops!" and no blame.
- Use digits ("3 items"), active voice, and second person ("your").
- Empty state = value + action: "No invoices yet. Create your first invoice to get paid faster."

**Persian:** see `persian-rtl.md` §13 (polite «شما», verbal-noun buttons, standard error phrasing, glossary of common UI strings).

## 12. Motion baseline
**Baseline only** — the minimum every page follows; detailed motion recipes are not part of this version. Default for Iranian audiences: **calm** (state feedback + reveal-once; at most one signature move). Ideas adapted from taste-skill `references/motion.md` L75–87 and L281 (see `anti-generic.md`).
1. **Content is visible without JavaScript.** Hide-before-reveal styles apply only under `html.js`, set by one inline line in `<head>`; if JS fails or loads slowly, everything is simply visible:
   ```html
   <script>document.documentElement.classList.add('js')</script>
   <style>
     @media (prefers-reduced-motion: no-preference) {
       .js [data-reveal] { opacity: 0; transform: translateY(12px); transition: opacity .3s ease-out, transform .3s ease-out; }
     }
     .js [data-reveal].is-in { opacity: 1; transform: none; }
     @media (prefers-reduced-motion: reduce) { .js [data-reveal] { opacity: 0; transition: opacity .2s linear; } }
   </style>
   ```
2. **Reveal once.** Add `is-in` the first time the element enters the viewport, never again on scroll back (Alpine: `x-intersect.once="$el.classList.add('is-in')"`; plain JS: `IntersectionObserver` + `unobserve`). Not on body text inside articles.
3. **Reduced motion keeps fades** — it removes movement, not feedback (the `reduce` rule above keeps a short opacity fade); state feedback (hover, focus, pressed) stays.
4. **No scroll hijacking:** no smooth-scroll/inertia libraries, no scroll-jacked horizontal pans, no custom cursors. A pinned story is CSS `position: sticky`.
5. Hygiene: transform/opacity only, 150–300ms, ease-out for entering; never `transition-all`, `ease-in` or `scale(0)` entrances (`audit.mjs --slop` warns). RTL directions: `persian-rtl.md` §11.

## 13. Common mistakes
- Two or more solid primary buttons competing in one section.
- Placeholder used as the label; errors shown only as a red border.
- Fixed-height badges that clip Persian dots; `h-8` buttons with `leading-none`.
- Input borders in the light `border` color (fails 3:1) — use `border-border-strong`.
- Removing the outline on an input inside a command palette/search bar "because it looks cleaner" — keep a `focus-visible` ring (inset `-outline-offset-2` works inside tight containers).
- Modals on mobile instead of bottom sheets; modals without a focus trap or Esc.
- Spinners for whole pages; "No data" empty states.
- Icon-only buttons without `aria-label`; arrows not mirrored in RTL (or clocks mirrored).
- Pie charts with 9 slices; charts with no takeaway text; color-only deltas.
