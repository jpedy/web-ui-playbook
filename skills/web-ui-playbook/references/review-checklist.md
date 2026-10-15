# Review Checklist — run on your own output, fix, then report

**When:** after building any page or component, before telling the user it's done.

**How:**
1. Run the automated audit: `node <skill-dir>/scripts/audit.mjs <files-or-folder> [--iran] --contrast --css <css-folder>`. Items marked **[auto]** below are checked by it. `--contrast` checks every text element against its background in light and dark mode; anything it lists under "could not resolve" (dynamic classes, components, background images, unknown colors) is **not** passed — check those in the browser.
2. Check the remaining items by reading your code and, if a browser or preview tool is available, by viewing the page at **375px and 1440px** (plus 320px for overflow).
3. **Fix every failed item** — don't just list it — then re-run the audit.
4. Report with the template at the end.

Only check the sections that apply: A always; B for English/LTR; C for any Persian; D and E when users are inside Iran.

## A. Universal (every build)
**Direction and system**
- [ ] One style direction named and applied consistently (`visual-direction.md`); 1–2 reference sites named with the pattern copied.
- [ ] Tokens defined first; templates use semantic token classes only. **[auto]** no hardcoded hex in classes or styles.
- [ ] Spacing only from the 4px scale; radius from the scale and concentric; ≤ 2 font families; ≤ 3 shadow levels.

**Layout and responsive**
- [ ] Mobile-first; no horizontal scroll at 320px (check `document.documentElement.scrollWidth <= innerWidth`); grid/flex children with truncate/SVG/tables have `min-w-0`; content max-width set; reading text 60–75ch (EN) / 55–70ch (FA).
- [ ] Wide tables (6+ columns) switch to cards below `lg`; time/date/money cells `whitespace-nowrap`; sticky headers are not inside an `overflow-x-auto`-only wrapper **[auto, warning]**.
- [ ] `min-h-dvh` instead of `h-screen`/`100vh` for full-height sections. **[auto]**
- [ ] Touch targets ≥ 44px (≥ 24px floor in dense desktop tables), ≥ 8px apart.

**Components and states**
- [ ] Exactly one solid primary button per section; button labels are verb + object.
- [ ] Hover, focus-visible, active, disabled, loading and error states exist for interactive elements.
- [ ] Empty, loading (skeleton), error and success states are designed for data views; no bare "No data".
- [ ] Forms: visible labels, ≤ 8 visible fields, validation on blur, specific error text, input kept on error, correct `type`/`inputmode`/`autocomplete`.

**Accessibility**
- [ ] Contrast: text ≥ 4.5:1 (large ≥ 3:1), UI borders and icons ≥ 3:1; no gray-400-on-white text. **[auto with --contrast]**; unresolved items checked by eye. Persian text under 14px ≥ 5.5:1 is a house rule (warning).
- [ ] Colors come from the brand-color-system palette (exact brand color kept, links use `text-primary-ink`, labels on primary use `text-primary-fg`, never `text-white`).
- [ ] `<html lang>` set **[auto]**; one `<h1>`, no skipped heading levels; landmarks; skip link.
- [ ] Focus ring visible everywhere; no `outline-none` without a replacement **[auto]**; sticky header doesn't cover focused content.
- [ ] Icon-only buttons have `aria-label` **[auto]**; inputs have labels **[auto]**; images have `alt` (decorative `alt=""`) **[auto]**.
- [ ] Status isn't conveyed by color alone; `prefers-reduced-motion` honored; motion ≤ 300ms on transform/opacity.
- [ ] Modals and sheets trap focus, close on Esc and return focus.

**Performance**
- [ ] Hero/LCP image not lazy-loaded **[auto]**, has `fetchpriority="high"`, AVIF/WebP, ≤ ~150KB.
- [ ] Every `<img>`/`<iframe>`/`<video>` has width and height or an aspect ratio **[auto]**; below-the-fold media lazy-loaded.
- [ ] Fonts self-hosted (one variable woff2 per family, preloaded); no CDN scripts **[auto, error in Iran mode]**.
- [ ] No Tailwind Play CDN; CSS compiled; JS deferred.

**Content and trust**
- [ ] No lorem ipsum, "John Doe" or fake logos/testimonials. Every value the user must replace (numbers, names, prices, contact, eNamad, license) is marked `<!-- PLACEHOLDER: what -->` (Blade: `{{-- PLACEHOLDER: what --}}`). The audit lists them; copy that list into the report.
- [ ] Prices show the total and recurring terms; no fake urgency; cookie choices symmetric if a banner exists.
- [ ] Anti-slop pass (`visual-direction.md` §6): no purple-AI gradients, emoji icons, vague hero copy, card-in-card.

## B. English / LTR
- [ ] Sentence-case labels; display headings use slight negative tracking (−0.02 to −0.03em) only on Latin text.
- [ ] Logical properties used anyway (`ms-`/`me-`/`ps-`/`pe-`/`text-start`), so the UI can be localized later.
- [ ] Numbers right-aligned in tables with `tabular-nums`.

## C. Persian / RTL (any Persian text)
- [ ] `<html lang="fa" dir="rtl">` (or correct `lang`/`dir` on Persian blocks) **[auto]**.
- [ ] Self-hosted Persian font (Vazirmatn/Estedad, or licensed); `persian-base.css` rules applied.
- [ ] Body line-height ≥ 1.75; headings ≥ 1.35; controls ≥ 1.5; no `leading-none`/`leading-tight` on Persian controls.
- [ ] **No** `tracking-*`, `italic` or `uppercase` on Persian text **[auto, warning]**; underline offset set on links.
- [ ] No physical direction utilities or properties (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `float-left`, `border-l`, `rounded-l`…) except intentional `rtl:`/`ltr:` variants **[auto]**; no `flex-row-reverse` used to fake RTL **[auto, warning]**.
- [ ] User-facing numbers in Persian digits (`۰–۹`); Latin digits only inside Latin tokens **[auto, warning]**; **zero** Arabic `٤٥٦` digits **[auto]**; numerals decision stated.
- [ ] No Arabic `ي`/`ك` in text **[auto]**; ZWNJ in می‌/ها/compounds **[auto, warning]**; Persian punctuation `، ؛ ؟ «»` **[auto, warning]**.
- [ ] Phone numbers, emails, URLs, codes, English names isolated with `<bdi>`/`dir="ltr"`; LTR inputs for tel/OTP/card/Sheba/email.
- [ ] Directional icons mirrored (`rtl:-scale-x-100`); media controls, clocks, checkmarks and logos **not** mirrored.
- [ ] Persian `aria-label`s (no English "Close") **[auto, warning]**; Tab order runs right→left; ellipsis on the left.
- [ ] Microcopy: «شما», formal verbs, verbal-noun buttons, glossary strings; no literal translations.
- [ ] Badges and pills don't clip dots (no fixed small heights); checked at 375px.

## D. Iran network (users inside Iran)
- [ ] **Zero** requests to foreign hosts (fonts, CDNs, analytics, reCAPTCHA, Google Maps, YouTube) **[auto with --iran]**; eNamad is the only external request, lazy-loaded in a fixed box.
- [ ] No IP-based blocking or language/currency switching; Persian + Toman by default.
- [ ] Usable on 3G (300ms RTT, 5% loss); text visible early (`font-display: swap`); PWA manifest + offline page if it's an app.

## E. Iran market (users inside Iran)
- [ ] Login = mobile + SMS OTP (LTR numeric input, accepts Persian digits, 120s resend timer, edit-number link); copy says OTP is sent via a service line.
- [ ] Prices in Toman with Persian digits and `٬`; discount and installment line where relevant; Rial equivalent + VPN notice before the gateway.
- [ ] Dates Jalali (Saturday-first grids, Friday red); stored as UTC; times 24h; schedules use زوج/فرد; **every weekday+date pair computed, not guessed** (e.g. with `Intl` fa-IR-u-ca-persian).
- [ ] National ID / card / Sheba / mobile validated with checksums after digit normalization.
- [ ] Footer: eNamad placeholder (`referrerpolicy="origin"`), landline click-to-call, Telegram + Bale/Eitaa, address.
- [ ] Maps/video/live-class embeds use domestic services; imagery fits modesty requirements ⏱.
- [ ] SEO: `lang="fa-IR"`, English or ID slugs (no Finglish), JSON-LD `priceCurrency: "IRR"` with Toman × 10.
- [ ] Every time-sensitive claim shown to the user (providers, prices, regulations) is marked "verify before launch".

---

## Report template (use exactly this at the end of a build)
```
## Review report
Direction: <name> · References: <site — pattern>, <site — pattern>
Audit: <N errors → 0>, <N warnings → M remaining (why acceptable)>
Fixed:
- <what was wrong> → <what I changed> (<file:line>)
- …
Contrast (--contrast): <n> text checks · <n> pass · <n> fixed · <n> could not resolve → checked by eye: <list>
Checked manually: <viewports / keyboard / contrast / dark mode>
Needs your input: <real logos, eNamad ID, prices, photos, legal text…>
Verify before launch (time-sensitive): <providers, prices, regulations used>
```
