# Accessibility & Trust (WCAG 2.2 AA, consent, dark patterns)

Accessibility is part of "professional quality", not an extra. Target **WCAG 2.2 Level AA** on everything. Values from reports A §5 and B §6–7. Persian-specific accessibility (screen-reader voices, Persian `aria-label`s, RTL tab order) is in `persian-rtl.md` §12.

Legal context `(⏱ as of Oct 2026 report — verify before relying)`:
- WCAG 2.2 was approved as ISO/IEC 40500:2025 (Oct 2025).
- WCAG 3.0 is still a draft (final expected ~2029), so don't certify against it.
- The European Accessibility Act has applied to EU e-commerce, banking and ticketing since 28 Jun 2025.
- US ADA enforcement is active.
- Iran has no equivalent binding web accessibility law in the reports. Apply AA anyway: it is also good UX.

## Contents
1. The AA checklist with numbers
2. Semantic HTML skeleton
3. ARIA: only when HTML can't
4. Trust, consent and dark patterns
5. Testing
6. Common mistakes

---

## 1. The AA checklist with numbers `[Proven]`
| Area | Requirement |
|---|---|
| Text contrast (1.4.3) | ≥ 4.5:1 normal; ≥ 3:1 large (≥ 24px or ≥ 18.66px bold) |
| Non-text contrast (1.4.11) | input borders, icons, focus rings, chart lines ≥ 3:1 against adjacent colors |
| Use of color (1.4.1) | never color alone — pair it with an icon, text or pattern |
| Target size (2.5.8) | ≥ 24×24px floor; design default **44×44px**, ≥ 8px apart |
| Focus visible (2.4.7) + not obscured (2.4.11) | `:focus-visible` ring 2px + 2px offset; sticky headers/cookie bars never cover the focused item (`scroll-padding-block-start: 5rem` or header height + 16px) |
| Keyboard (2.1.1) | everything works with Tab / Shift+Tab / Enter / Space / Esc / arrows; no keyboard traps except intended modal focus traps |
| Dragging (2.5.7) | every drag-and-drop (kanban, sliders, sortable lists) has a click alternative (move buttons, a menu, number input) |
| Accessible auth (3.3.8) | no cognitive puzzles; allow paste and password managers; `autocomplete="one-time-code"` on OTP |
| Reflow (1.4.10) | no horizontal scroll at 320px width or 400% zoom of a 1280px layout; text resizable to 200% |
| Text spacing (1.4.12) | layout survives user line-height 1.5 / paragraph spacing 2× — avoid fixed heights on text containers |
| Motion (2.3.3 + OS setting) | honor `prefers-reduced-motion: reduce`; no flashing more than 3 times per second |
| Moving content (2.2.2) | auto-moving carousels and tickers have pause/stop |
| Labels (1.3.1, 3.3.2) | every input has a visible `<label>` (or `aria-label` for search-only icons) |
| Errors (3.3.1, 3.3.3) | text error next to the field + suggestion; `aria-invalid`, `aria-describedby`; summary on submit |
| Language (3.1.1, 3.1.2) | `<html lang="…">`; `lang` on inline fragments in another language |
| Images (1.1.1) | meaningful `alt`; decorative `alt=""`; icon-only buttons `aria-label` |
| Headings and landmarks (1.3.1, 2.4.6) | one `<h1>`, no skipped levels; `<header> <nav> <main> <footer>`; skip link first |
| Forced colors | test `@media (forced-colors: active)`; use system colors (`ButtonText`, `CanvasText`) for custom-drawn controls |
| Status messages (4.1.3) | toasts/async results announced with `role="status"`/`aria-live="polite"` (errors `role="alert"`) |

## 2. Semantic HTML skeleton
```html
<html lang="en" dir="ltr">           <!-- Persian: lang="fa" dir="rtl" -->
<body>
  <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
  <header> … <nav aria-label="Main"> … </nav> </header>
  <main id="main"> <h1>…</h1> <section aria-labelledby="pricing-h"> <h2 id="pricing-h">…</h2> </section> </main>
  <footer> … </footer>
</body>
```
- Use `<button>` for actions and `<a href>` for navigation. A `<div onclick>` is a defect.
- Tables: `<table>` + `<th scope="col">` + `<caption>` (it can be visually hidden).
- Accordions: `<details>/<summary>`. Dialogs: `<dialog>` or a well-tested component with a focus trap.

## 3. ARIA: only when HTML can't
- Tabs: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, arrow keys.
- Menus/disclosures: `aria-expanded` and `aria-controls` on the trigger.
- Current page: `aria-current="page"`. Sorting: `aria-sort`.
- Loading regions: `aria-busy="true"`.
- No ARIA is better than wrong ARIA. Never put `role="button"` on a div when a `<button>` would do.
- For complex widgets (combobox, date picker, data grid), use an accessible library component rather than hand-building one (see `resources-templates.md` §3).

## 4. Trust, consent and dark patterns `[Proven]`
Consent and dark-pattern law is EU/US focused `(⏱ verify)`, but symmetric, honest UI also builds trust with Iranian users.

| Surface | Rule | Values |
|---|---|---|
| Cookie banner (only if non-essential tracking exists) | Layer 1 has **Accept all**, **Essentials only** and **Customize** with identical size, weight and contrast | non-blocking bottom bar or corner card, ≤ 25vh on mobile, buttons all 40px tall; reserve space or overlay without layout shift |
| No-banner option | strictly necessary cookies + cookieless self-hosted analytics → no banner needed; state it in the privacy policy | e.g. self-hosted Umami/Plausible/Matomo |
| Global Privacy Control | if `navigator.globalPrivacyControl === true`, silently disable marketing tags | US-state requirement |
| Unbundled consent | Terms acceptance ≠ marketing opt-in; marketing checkboxes unchecked by default | — |
| Cancellation | self-serve "Cancel plan" in Settings → Billing, done in ≤ 2–3 clicks, confirmation email | no forced phone call, retention-bot or guilt screens |
| Urgency | countdowns and "only 2 left" only when true; never reset on reload | fake urgency = dark pattern |
| Confirmshaming | decline links are neutral ("No thanks"), never "No, I hate saving money" | — |
| Security cues at payment | gateway/card logos + short security microcopy within 8–16px of the payment block; official seals only (Iran: eNamad, see `iran-market.md` §8) | — |
| Pricing honesty | total cost (tax, shipping, fees) before the final step; renewal price and date stated next to the subscribe button | — |

## 5. Testing
- **Automated:** axe-core (browser extension or `@axe-core/playwright`) catches about 57% of issues. Lighthouse accessibility should be 100, but that isn't proof of compliance.
- **Manual, 5 minutes per page:**
  - Tab through everything (order logical? focus visible? modals trap and return focus?).
  - Zoom to 200%.
  - 320px width.
  - Reduced motion on.
  - Dark mode.
  - Grayscale (does status still read?).
- **Screen reader spot-check:** NVDA (Windows) or TalkBack (Android) on the main flow. Persian voice setup: `persian-rtl.md` §12.
- **Real users** (report A): 5 users find ~85% of usability issues. Recommend it to the user for important launches.

## 6. Common mistakes
- `outline: none` / `focus:outline-none` with no replacement ring.
- Light-gray placeholder text as the only label.
- Red/green status dots with no text; charts readable only by color.
- Icon buttons without `aria-label` (Persian pages: an English `aria-label="Close"`).
- Clickable `<div>`s; heading levels chosen for size, not structure.
- Sticky header covering focused or anchored content.
- Carousels and tickers that can't be paused; animations that ignore reduced motion.
- Cookie banners with a big "Accept" and a hidden "Reject"; cancellation only by phone.
