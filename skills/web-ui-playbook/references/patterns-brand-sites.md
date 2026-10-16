# Patterns — Brand, Marketing & Landing Pages

Use this for company sites, product and SaaS marketing pages, campaign landings, course and school landing pages, and portfolios. Values come from report B §1/§3/§9 unless marked otherwise. Persian or Iranian landing pages also need `persian-rtl.md`, and for Iran-specific sections (installments, consultation form, eNamad) `iran-market.md` §12.

## Contents
1. Default page skeleton
2. Section specs (hero, social proof, features, how it works, testimonials, pricing, FAQ, final CTA, footer)
3. Motion and media restraint
4. Decision guide by brand type
5. Before/after
6. Launch checklist (brand-specific)
7. Common mistakes

---

## 1. Default page skeleton (landing / home)
Order matters: answer "what is it, is it for me, can I trust it, what does it cost, what do I do next".

**Argument first** (`anti-generic.md` §1): treat the list below as the questions to answer, not a fixed template. Write the page as claims with the owner's proof, one line per section; the claims decide which sections exist and their order. A section with no real proof is cut, or kept with a visible PLACEHOLDER and listed for the owner.

1. **Header**: logo · 5–7 nav links · 1 primary CTA
2. **Hero**: outcome headline + subheadline + primary CTA (+ secondary) + product/visual proof
3. **Social proof bar**: logos or metrics directly under the hero
4. **Problem → value**: 2–3 short benefit statements tied to user pain
5. **Features**: a bento grid or alternating rows (max 6 features)
6. **How it works**: 3 numbered steps
7. **Testimonials / results**: real names, photos, roles, numbers
8. **Pricing**: tiers + comparison (or "from X" with a consultation CTA for services)
9. **FAQ**: 5–8 real objections
10. **Final CTA**: repeat the primary action with a one-line reassurance
11. **Footer**: links, contact, legal, trust seals, language switch

Mobile (general practice and Iranian convention): on long landing pages, show a **sticky bottom CTA bar** (56–64px + safe-area) after the hero scrolls out of view.

## 2. Section specs

### Hero `[Proven]`
- **Do:** an outcome headline (what the user gets) + one primary CTA + a product preview (live UI, a short muted loop, or an image).
- **Avoid:** carousels, auto-playing full-screen video, vague "Learn more". Carousels dilute the message, and heavy hero media pushes LCP past 2.5s.
- **Headline (EN):** `clamp(2.5rem, 5vw + 1rem, 4.5rem)`, line-height 1.05–1.15, letter-spacing −0.03em, max ~20ch. Persian uses its own scale and **no** letter-spacing (`persian-rtl.md` §3).
- **Subheadline:** 18–20px, 55–65ch max, contrast ≥ 4.5:1.
- **CTA:** 44–48px tall, padding-inline 20–24px. Secondary CTA as an outline/ghost button next to it.
- **Fit:** headline, subheadline and CTA visible within `100dvh` at 1440×900 and 390×844.
- **Hero image:** the LCP element. Use AVIF/WebP, `fetchpriority="high"`, `loading="eager"`, explicit width and height, ≤ ~150KB (see `performance-and-tech.md`).
- **Layout:** text at start + visual at end (2 columns ≥ `lg`), stacked on mobile with text first.

### Social proof bar `[Proven]`
- 5–7 logos per row on desktop (gap 32–48px), 2–3 per row on mobile, monochrome at 60–70% opacity → 100% on hover (150ms).
- Or 3–4 metric cards — **only numbers the owner gave you** (a source comment is not proof; `audit.mjs --slop` lists every number for confirmation). No number yet → a visible placeholder, not an invented one.
- Moving logo tickers need a pause control (WCAG 2.2). A static grid is simpler.
- Only real, verifiable proof. If the user has none yet, leave clearly marked placeholders and tell them.

### Features — bento grid `[Proven]`
- 2–3 column asymmetric grid. One hero card spans 2 columns. Each cell shows **one** workflow with ≤ 4 data points.
- Container max-width 1200–1280px; gap 16–24px; card padding 24–32px; radius 12–16px; 1px border at 8–12% foreground.
- Cells show a real UI fragment (DOM, not screenshots) when possible: a live toggle, a mini table, a calendar.
- Data-dense enterprise products: use a plain, scannable card grid instead of a bento.
- Alternative for ≤ 4 features: alternating text/visual rows (zig-zag); flip the order on mobile so the text comes first.

### How it works
- 3 steps, numbered (Persian digits on Persian pages), icon/number 40–48px, title + one sentence each. Horizontal on desktop (connected by a line), vertical on mobile. The step order follows reading direction (step 1 at the start edge).

### Testimonials
- Only real quotes from real customers, with their consent, supplied by the owner (the audit lists every quote for confirmation). 2–3 strong ones beat 12 weak ones: photo 40–56px, name, role or company (or city, for Iranian consumers), a quote ≤ 3 lines, and a result number if one exists.
- Video or voice-note testimonials convert well for Iranian education services `[Proven, report C §8]`. Embed them from a domestic host for Iran (`iran-network-resilience.md`).

### Pricing `[Proven]`
- 3–4 tiers: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`.
- **Recommended tier:** a "Most popular" badge, a primary-colored border, and the only solid CTA.
- **Billing toggle:** monthly/annual, showing the saving ("2 months free").
- **Each card:** name, one-line audience, price (large, `tabular-nums`), ≤ 6 key differentiators, CTA.
- **Comparison table below the cards:** sticky header row (`top` = header height, e.g. 64px), rows 44–52px, ≤ 4 plan columns, features grouped into categories of 5–7 rows, ✓ / — with text alternatives.
- **FAQ right after pricing**, handling objections.
- **Avoid:** "Contact sales" for everything on a self-serve product; more than 4 columns; 35 ungrouped bullets.
- **Services and schools without fixed tiers:** "Starting from …" + a short consultation form (Iran: name + mobile only, `iran-market.md` §12).
- **Iran:** prices in Toman with Persian digits; strike-through old price + discount pill; installment line under the price (`iran-market.md` §3).

### FAQ
- 5–8 questions, native `<details>/<summary>` (keyboard accessible for free). Animate height with `interpolate-size: allow-keywords` (newly available, so it degrades to an instant toggle). First question open by default. Add `FAQPage` JSON-LD.

### Final CTA
- A full-width band, contrasting surface (primary-subtle or a dark surface), headline + the same primary CTA as the hero + a reassurance line ("No credit card required" / «جلسه اول رایگان است»).

### Footer
- 3–4 link columns, contact (phone, email, address), social links, legal (privacy, terms), language switch, copyright.
- Iran: eNamad seal + landline click-to-call + Telegram and Bale/Eitaa links (`iran-market.md` §8).
- Design it as the page's close, not a link dump `[Opinion]`: the one main action again, real contact details and hours, then the legal links.

## 3. Motion and media restraint `[Proven]`
- Motion guides attention or explains a state. It isn't decoration.
- Only `transform` and `opacity`; 60fps on mid-range phones.
- Scroll reveals: translate 8–16px + fade, ~300ms, once, never on above-the-fold content (it delays perceived load); always behind the `html.js` gate (`components-and-states.md` §12 Motion baseline).
- Respect `prefers-reduced-motion`.
- WebGL/3D scenes: only for flagship launches, luxury or studio portfolios `[Emerging]`, with a lighter mobile fallback. For B2B and Persian consumer sites, clarity beats spectacle `[Hype when used on utility products]`.
- Video: muted, `playsinline`, a poster image, play on user click or when visible. Hosted on a domestic platform for Iran.

## 4. Decision guide by brand type
| Brand type | Layout | Direction (`visual-direction.md`) | Must-have sections |
|---|---|---|---|
| B2B SaaS | editorial grid + live UI previews | Calm SaaS | hero proof, bento, transparent pricing + comparison, FAQ |
| Developer tool | code + output split, copyable CLI command in the hero | Dark Developer or Calm SaaS | docs link, pricing calculator if metered |
| Regulated (finance, health, legal, gov) | light-first, high contrast, restrained motion | Trust / Fintech | trust badges, security microcopy, contact, licenses |
| Consumer product / D2C | product-first imagery, sticky buy bar on mobile | Warm Consumer or Bold Campaign | reviews, delivery/return info near the CTA |
| Education / language school | 2-column course hero, schedule, placement test | Playful EdTech | free trial session, schedule, teachers, pricing/installments, consultation form |
| Agency / portfolio | case-study grid with outcome metrics | Editorial or Bold Campaign | outcome-first cards, process, contact |
| Campaign / event | single offer, countdown only if real | Bold Campaign | one CTA, terms, FAQ |

## 5. Before/after `[Proven, report B]`
- **Before:** 15MB background video (LCP 5.2s), white text over bright frames, "Learn More" ghost button, pricing with 35 bullets in tall cards.
- **After:** static SVG/CSS hero (LCP ~1.1s), 56px high-contrast outcome headline, solid "Start free" CTA, lazy-loaded interactive demo below, 3 pricing cards (≤ 6 differentiators each) above a grouped sticky-header comparison table and an FAQ.

## 6. Launch checklist (brand-specific; the full list is in `review-checklist.md`)
- [ ] One creative direction from hero to footer; fluid `clamp()` headings; body 16–18px at 60–75ch (EN).
- [ ] Primary CTA above the fold and repeated at the end; only one solid primary per section.
- [ ] Social proof real and adjacent to the hero; pricing transparent with comparison + FAQ.
- [ ] LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms (p75, mobile).
- [ ] Semantic landmarks, OG image, JSON-LD (`Organization`, `Product`/`Course`, `FAQPage`), sitemap and robots.

## 7. Common mistakes
- Hero carousel or autoplay video; vague headline; two equal CTAs fighting.
- Logo walls of made-up companies; testimonials without names.
- Features as 9 identical icon cards; bento cells crammed with 6+ facts.
- Pricing hidden behind "Contact us" for a simple product; > 4 plan columns; no FAQ.
- Animations on everything, or on above-the-fold text; no reduced-motion handling.
- `loading="lazy"` on the hero image; images without dimensions (CLS).
- Desktop-only layouts that need horizontal scrolling at 360px.
