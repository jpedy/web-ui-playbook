# Patterns — Web Apps, Dashboards, Forms & Flows

Use this for SaaS apps, admin panels, CRMs, dashboards, student and customer portals, sign-up, checkout and settings. Values come from report B §2/§3/§10 unless marked otherwise. Component sizes are in `components-and-states.md`.

## Contents
1. App shell
2. Dashboard home
3. Data tables
4. Forms, sign-up and checkout
5. Empty states, onboarding, settings
6. Keyboard-first: command palette and shortcuts
7. Destructive actions, notifications, real-time
8. AI copilot surfaces [Emerging]
9. Decision guide and before/after
10. Common mistakes

---

## 1. App shell `[Proven]`
```
┌──────────┬──────────────────────────────────────────┐
│ Sidebar  │ Header: breadcrumb/title · search · user  │ 48–56px
│ 240–260  ├──────────────────────────────────────────┤
│ (rail    │ Main: padding 24 (16 mobile)              │
│ 48–56)   │ max-width 1280–1440 for data, 640 forms   │
└──────────┴──────────────────────────────────────────┘
```
- **Sidebar:**
  - Groups with 11–12px muted headings (no uppercase in Persian).
  - Items 36–40px tall, icon 20 + label 14px.
  - Active item: `primary-subtle` bg + indicator at the start edge.
  - Collapsible to an icon rail with tooltips (`Ctrl/Cmd+B` or `[`).
  - Workspace/account switcher at the top, user menu at the bottom.
- **RTL:** the sidebar docks on the **right** automatically when using logical properties (`start-0`, `border-e`).
- **Mobile (< 1024px):** the sidebar becomes an off-canvas drawer from the start edge, opened by a 44px menu button. Consumer apps (and Iranian consumer apps in particular) use a 4–5 tab bottom nav instead.
- **Header:** page title or breadcrumbs at start; global search (280–360px) or Cmd+K trigger; notifications; avatar menu at end.
- Page header inside main: H1 24–28px + one-line description + primary action at the end.
- **App density:** body text is 14px with line-height ~1.45, not the fluid 16–18px marketing size (snippet in the `assets/tokens.css` header). Persian apps keep 14–16px with persian-base line-heights.
- **Grid/flex children with truncated text, SVG charts or tables need `min-w-0`.** Without it they overflow the viewport on mobile (a "grid blowout" found in testing).

## 2. Dashboard home `[Proven]`
- **Top: KPI strip.** 3–4 stat cards per row (value, delta with arrow + color, sparkline, period).
- **Below: something actionable.** A triage queue, a recent-activity table or tasks needing attention — not decorative gauges.
- **Then:** 1–2 charts that answer a real question (`components-and-states.md` §10).
- **Layout:** 12-column grid; KPI cards `grid-cols-2 lg:grid-cols-4`; main chart 8 cols + side list 4 cols; everything stacked on mobile.
- **Filter bar:** date range + 1–3 key filters, applied filters shown as removable chips ("Status: Active ✕") (Dub.co pattern).
- **Density:** comfortable by default. Offer a compact toggle for power users.

## 3. Data tables `[Proven]`
| Rule | Value |
|---|---|
| Text columns | aligned to `start` |
| Numbers, money, dates in numeric columns | aligned to `end` + `font-variant-numeric: tabular-nums` (`tabular-nums`) |
| Row height | 36px compact · 44px default · 52px comfortable |
| Cell padding | 8×12px (compact) or 12×16px |
| Header | 12px/600, letter-spacing 0.04em (Latin only), muted color, sticky (`z-20`) |
| First (identifier) column | sticky on horizontal scroll (`z-10`), at the start edge |
| Row actions | at the end edge, **visible on hover and keyboard focus**, otherwise in a "⋯" menu |
| Selection | checkbox column at the start; selecting shows a bulk-action toolbar (count + actions + "clear") |
| Sorting | clickable headers with an arrow icon + `aria-sort` |
| Footer | "Showing 1–25 of 312" + rows-per-page + pagination |

- Never center text columns; never hide the pagination state.
- **Status:** pills with text (not dots alone).
- **Inline editing** for quick fields (Attio pattern). Detail opens in a **side sheet** (Ramp pattern) so the list stays visible.
- **Mobile:** turn rows into cards (title + 2–3 key fields + status), or keep a horizontal scroll with a sticky first column. Never shrink text below 12px. With 6+ columns, show the table only from `lg` up.
- **Sticky header + horizontal scroll** (bug found in testing): a `sticky` `<thead>` inside an `overflow-x-auto` wrapper sticks relative to that wrapper, so `top-14` pushes it over the first rows. Fix it one of two ways:
  - Make the wrapper the scroll container in both axes: `<div class="max-h-[70dvh] overflow-auto">` + `<thead class="sticky top-0 z-20">`.
  - Or drop the horizontal wrapper.
  `audit.mjs` warns on this.
- `whitespace-nowrap` on dates, money and IDs; IDs in `font-mono tabular-nums`.
- **Bulk changes on many rows:** a wizard (select rows → choose field → resolve conflicts → review diff → apply) (Jira pattern).
- Over ~1,000 rows: server-side pagination/filter. Show skeleton rows while loading.

## 4. Forms, sign-up and checkout `[Proven — Baymard data cited in report B]`
**General form rules**
- **≤ 8 visible input fields by default** (12–14 total form elements). Collapse optional ones behind text links: "+ Add apartment/suite", "+ Have a promo code?".
- **One "Full name" field**, not first/last (splitting it is a common, avoidable friction).
- **Smart defaults:** billing = shipping, city/state from postal code where an API exists, country from the locale.
- **Validation:** on blur; clear on fix; never wipe input; specific error text (`components-and-states.md` §3).
- **Long forms:** steps with a progress indicator ("Step 2 of 3"); each step ≤ 5–7 fields; data saved between steps.
- Submit button text = the outcome ("Create account", "Pay ۲٬۴۵۰٬۰۰۰ تومان").

**Sign-up / login**
| Audience | Pattern |
|---|---|
| International / English SaaS | Email magic link or OAuth (Google/GitHub/Microsoft) on screen 1; defer role/company questions to a skippable 2-step wizard after login |
| Iranian users | **Mobile number + SMS OTP** as the primary path; no Google sign-in as primary (fails without a VPN) — full spec in `iran-market.md` §2 |
| Both | allow paste and password managers; `autocomplete` set; Passkeys optional; never cognitive puzzles (WCAG 2.2 3.3.8) |

**Checkout / payment**
- **Cart drawer:** subtotal, shipping, tax and **total** visible before checkout (surprise costs are the #1 actionable reason people abandon).
- **Guest checkout as the primary option.** Offer account creation on the confirmation page (one password field).
- **Distraction-free checkout:** remove the main navigation; keep the logo + a help link.
- **Express wallets at the top:** Apple/Google Pay (international only). Iran uses Shaparak gateways — `iran-market.md` §7.
- **Card fields:** auto-spacing 4-4-4-4, expiry `MM / YY`, security microcopy and card/gateway logos within 8–16px of the card block.
- **High-value items (furniture, jewelry, courses):** return policy, guarantees and installment options next to the pay button.

## 5. Empty states, onboarding, settings `[Proven]`
- **Empty states:** starter templates, a one-click sample data toggle, or import — never a bare "No records found".
- **Onboarding:**
  - Show the product working within the first minute (interactive demo or sample data).
  - Checklist of 3–5 setup steps with progress.
  - Every step skippable.
- **Settings:**
  - Sticky category index at the start (200px) + single-column form (max-width 640px) + search across settings.
  - Explicit save state ("Saved" / «ذخیره شد») or auto-save with a status indicator.
  - Destructive zone at the bottom with a danger border.
- **Billing settings:** plan, usage, invoices, payment method, and **self-serve cancel in ≤ 3 clicks** (`accessibility-and-trust.md` §4).

## 6. Keyboard-first: command palette and shortcuts `[Proven for frequent-use tools]`
- **Command palette (`Cmd+K` / `Ctrl+K`):**
  - Opens in < 50ms with the input focused.
  - Width 560–640px, max-height 420px, positioned 15–20vh from the top.
  - Items 44px (40px allowed: the palette is a desktop keyboard tool).
  - 5–8 recent/suggested actions before typing; fuzzy search.
  - Backdrop `rgb(0 0 0 / .4)` + `backdrop-filter: blur(4px)`.
  - Opens with 120ms `cubic-bezier(0.16,1,0.3,1)`.
  - Never blocks on a network spinner before opening.
- **Single-key shortcuts** for frequent actions (e.g. `C` create, `/` search), shown in tooltips with `<kbd>` badges. Never active inside text inputs.
- **Full keyboard path:** every CRUD flow and view switch must be completable without a mouse.
- **When to skip the palette:** low-frequency tools (a school's student portal) can skip it. A visible search field is enough there.

## 7. Destructive actions, notifications, real-time
- **Reversible actions** (archive, move, delete-to-trash): act immediately + an "Undo" toast for 5–6s. Better than a confirm dialog.
- **Irreversible actions:** a confirm dialog naming the object. For very destructive actions (delete workspace), require typing the name.
- **Optimistic UI:** update instantly, roll back with an error toast on failure (masks latency on slow networks).
- **Notifications:** bell with a count (max "9+"), panel 360–400px, grouped by day, "Mark all read". Persistent settings per channel.
- **Long jobs (export, import):** a progress toast or notification when done; never block the UI.

## 8. AI copilot surfaces `[Emerging]`
- Match the entry point to the job: inline suggestions or selection toolbar (small edits) · `Cmd+K` command (known actions) · side panel 320–480px, default 360px (multi-turn tasks).
- First open shows 3–4 **starter prompt chips** — never an empty box behind a sparkle icon.
- Show the context the AI is using as removable chips ("This document", "Team: Sales").
- Output appears as an **inline diff/preview** with `Accept` (Cmd/Ctrl+Enter), `Discard` (Esc) and Undo — not a chat log the user must copy from. Show sources/citations when answering from data.
- Diff colors (light): insert `oklch(0.92 0.08 145)`, delete `oklch(0.92 0.08 25)` with strikethrough; dark mode equivalents at L≈0.28.

## 9. Decision guide and before/after
| App type | Shell | Density | Must-haves |
|---|---|---|---|
| High-frequency tool (CRM, tracker, inbox) | sidebar + header | compact (36–38px rows) | Cmd+K, single-key shortcuts, saved filters, inline edit |
| Admin / back-office (multi-role) | sidebar with role-scoped items | default (44px) | bulk actions, audit log, filters, exports |
| Customer / student portal | top nav or sidebar; bottom nav on mobile | comfortable | clear next action, status of orders/classes, support contact |
| Analytics dashboard | sidebar + filter bar | default | KPI strip, date range, chart takeaways, CSV export |

- **Before:** 10 items per screen in 72px rows, centered status text, no shortcuts; an "AI Assistant" bubble opens an empty chat whose output the user must copy into 5 fields.
- **After:** 25+ items in 38px rows, `tabular-nums` IDs, status changed inline with a key press, Cmd+K filtering; AI previews labeled changes inline with "Accept all".

## 10. Common mistakes
- Dashboard of decorative gauges and donut charts with no action.
- Tables with centered text, proportional digits, no sticky header, actions only on hover.
- Forms with 16 visible fields, first/last name split, open "Address line 2" and promo fields, errors on every keystroke, inputs cleared after an error.
- Forced account creation before payment; hidden total cost.
- Modals for everything (use side sheets for details, inline editing for small changes).
- "No data" empty states; spinners blocking whole pages.
- Shortcuts that fire while typing in inputs; no visible focus.
- Physical `left`/`right` positioning that breaks when the app is switched to Persian.
