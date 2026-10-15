# Persian (Farsi) & RTL — language layer

Apply this file to **every** interface that contains Persian text, wherever its users live. If the users are inside Iran, also apply `iran-market.md` and `iran-network-resilience.md`.

Sources: report C §1/§7, report B §6, and the Persian catalogs. Where reports conflict, the safer value is used and noted.

## Contents
1. Root setup
2. Fonts and licensing
3. Type scale, line-height, weights
4. Latin habits that break Persian (tracking, italics, uppercase, underline)
5. Numerals
6. ZWNJ (نیم‌فاصله)
7. Punctuation
8. Mixed-direction (bidi) text and inputs
9. Logical CSS and the Tailwind mapping
10. Mirroring: what flips and what never flips
11. Layout conventions
12. Persian accessibility
13. Microcopy register and a glossary of UI strings
14. Text normalization for search and storage
15. Common rendering bugs and mistakes

---

## 1. Root setup `[Proven]`
```html
<html lang="fa" dir="rtl">   <!-- Laravel: lang="{{ str_replace('_','-',app()->getLocale()) }}" dir="{{ app()->getLocale()==='fa' ? 'rtl' : 'ltr' }}" -->
```
- Set `dir` on `<html>`, not with `text-align: right`. Without real `dir="rtl"`, parentheses reverse, ellipses land on the wrong side and the Tab order runs left→right.
- English blocks inside a Persian page: `<div lang="en" dir="ltr">`. Persian blocks in an English page: `<div lang="fa" dir="rtl">`.
- Load `assets/persian-base.css` (scoped `:lang(fa)` rules for font, line-height, tracking and italics).
- Never fake RTL with `flex-direction: row-reverse`. Under `dir="rtl"` it reverses twice and puts things back in LTR order.

## 2. Fonts and licensing
| Font | License | When | Status |
|---|---|---|---|
| **Vazirmatn** | SIL OFL 1.1 (free, commercial OK) | **Default** for every project, especially when there's no font license budget. Variable 100–900; variants: `FD` (Farsi digits), `NL` (non-Latin), `RD` (round dots), `UI` (tighter vertical metrics for controls) | `[Proven]` ✓ |
| **Estedad** | SIL OFL 1.1 | free alternative, more geometric with wider apertures; good for EdTech/consumer headings | `[Proven]` |
| IRANSansX | commercial (Fontiran) | enterprise, fintech, government — **only with a domain license** | `[Proven]` |
| Yekan Bakh, Peyda, Dana, Morabba | commercial (Fontiran / Noon Font) | consumer startups, EdTech, campaigns — license required | `[Proven]` / Peyda `[Emerging]` |
| Shabnam, Samim, Sahel | OFL | legacy, no variable versions | `[Possibly outdated]` |
| Tahoma, Arial, B Nazanin, B Mitra, B Titr | system/print | **never** for modern UI (uneven metrics, few weights) | obsolete |

- **Self-host one variable woff2** (~110KB for Vazirmatn instead of ~1.1MB for 9 static weights) and preload it.
  - npm: `@fontsource-variable/vazirmatn` (font-family name `"Vazirmatn Variable"`), or copy the woff2 into `public/fonts/`.
  - Never `fonts.googleapis.com` — it hangs inside Iran (`iran-network-resilience.md`).
- **License warning:** many Persian templates bundle pirated commercial fonts, and Fontiran enforces its licenses `(⏱ verify)`. If you can't confirm a license, use Vazirmatn or Estedad. Details: `resources-templates.md` §5.
- **Font stack:**
  - Persian-only page: `font-family: "Vazirmatn Variable", Vazirmatn, Tahoma, sans-serif;` (Tahoma only as the last fallback).
  - English-heavy bilingual page: Latin font first (see `visual-direction.md` §4).

## 3. Type scale, line-height, weights `[Proven]`
Persian glyphs look smaller than Latin at the same size and need vertical room for ascenders, descenders and up to three dots.

| Role | Size desktop / mobile | Line-height | Weight | Max line length |
|---|---|---|---|---|
| Display H1 | 36px / 28px (can go up to ~48px in campaigns) | 1.35–1.45 | 700–800 | 20–35ch |
| H2 | 28px / 22px | 1.45–1.55 | 700 | 25–45ch |
| H3 | 20px / 18px | 1.55–1.65 | 600 | 30–55ch |
| Body | 16px / 15–16px (prefer 16) | **1.75–1.9** | 400 | 55–70ch |
| Long-form article | 18px | ~1.9 (Virgool: 18px / 34px) | 400 | 60–70ch |
| UI controls (buttons, inputs) | 14–16px | 1.5–1.6 | 500–600 | — |
| Captions, badges | 12–13px (never < 12) | 1.6–1.7 | 400–500 | 40–60ch |

- *Conflict:* report B says body line-height 1.7–1.85; report C says 1.75–1.9 → **minimum 1.75**.
- **Tailwind classes for this table** (tested):
  - H1: `text-3xl md:text-4xl font-extrabold` (30→36px)
  - H2: `text-2xl md:text-3xl font-bold`
  - H3: `text-lg md:text-xl font-bold`
  - Body: `text-base` (lead text: `text-lg`)
  - Controls: `text-sm`/`text-base font-semibold`
  - Captions: `text-xs`/`text-sm`
  - Don't add `leading-*`: `persian-base.css` redefines Tailwind's per-size line-heights under `:lang(fa)` (body 1.8, headings 1.4–1.55), so plain `text-*` classes come out correct.
- When translating an English design, make Persian text **1–2px larger** and its line-height 10–15% taller.
- **Weights:** never 100/200 for Persian text; nothing under 400 below 16px (dots blur).
- **Contrast:** ≥ 4.5:1 (WCAG); under 14px aim for ≥ 5.5:1 — a house rule of this skill for dot legibility, not a WCAG requirement. `audit.mjs --contrast` reports it as a warning.
- **Controls:** buttons and inputs must not combine `leading-none`/`leading-tight` with fixed heights and `overflow:hidden`, or the descenders of گ چ ی get clipped. Use padding (`py-2.5`) + `leading-normal`/1.55, or the Vazirmatn `UI` variant.

## 4. Latin habits that break Persian `[Proven]`
| Habit | Why it breaks | Do instead |
|---|---|---|
| `letter-spacing` / `tracking-*` (tight or wide) | disconnects cursive joins | `letter-spacing: 0` on everything `:lang(fa)` (in persian-base.css) |
| `italic` / `<em>` default | synthetic slant distorts letterforms; Persian has no italic | emphasize with weight (+2 steps: 400→600/700), color, or a pill highlight |
| `uppercase` / small-caps | Persian has no case; it only affects mixed Latin words oddly | weight/size/color |
| Default underline | cuts through descenders and dots | `text-underline-offset: 0.38em; text-decoration-skip-ink: auto` |
| Tatweel/kashida `ـ` in body text | breaks search and screen readers | only the font's kashida axis, only in display headings |
| `text-align: justify` without care | uneven gaps | prefer `start`; justify only long articles |
| Latin quotes "…" | collide with dots | guillemets «…» |

## 5. Numerals `[Proven]`
| Set | Codepoints | Use |
|---|---|---|
| Persian `۰۱۲۳۴۵۶۷۸۹` | U+06F0–U+06F9 | **all user-facing numbers in Persian UI**: prices, dates, counts, phone numbers in prose, percentages, steps, timers |
| Arabic-Indic `٠١٢٣٤٥٦٧٨٩` | U+0660–U+0669 | **never** — `٤ ٥ ٦` look like broken Arabic to Iranian users |
| ASCII `0123456789` | U+0030–U+0039 | inside Latin tokens: model names (iPhone 16), URLs, emails, code, IPs, hashes; and **always** in stored/submitted data |

- **Convert in code, not with font tricks.**
  - JS: `new Intl.NumberFormat('fa-IR').format(n)` → `۱٬۲۳۴٬۵۶۷`.
  - Helpers: `assets/persian-helpers.js`, `assets/PersianHelpers.php`.
  - *Conflict:* report C says the OpenType feature `ss01` swaps digits, while the Persian catalog says `ss02` → behavior differs per font. Don't rely on it, and never apply digit features globally (`MP4` turns into `MP۴`). Whole-page "FD/FaNum" font builds are `[Possibly outdated]` for mixed content.
- **Separators:** thousands `٬` (U+066C), decimal `٫` (U+066B), percent `٪`. `Intl` with `fa-IR` produces these.
- **Normalize input:** convert Persian and Arabic digits to ASCII before validation, storage and API calls. Phone and OTP fields must accept all three sets.
- **Tables, prices, timers:** `font-variant-numeric: tabular-nums` so digits don't jitter. Check that the font honors it (watch a countdown); if not, set a fixed `min-width` on the number box.
- **Numerals decision** (state it in the build):
  - Persian consumer UI → Persian digits everywhere except Latin tokens.
  - Technical/admin UI used bilingually → Latin digits allowed **if used consistently**.
  - Never mix both sets within one component.

## 6. ZWNJ — نیم‌فاصله (U+200C, `&zwnj;`) `[Proven]`
Required between:
- prefixes می‌ / نمی‌ and the verb: می‌روم، نمی‌خواهید
- plural ها / های: کتاب‌ها، دوره‌های آنلاین
- comparatives تر / ترین: بزرگ‌تر، بزرگ‌ترین (exception: بهتر and بهترین are conventionally written joined)
- the ezafe ی after silent ه: خانه‌ی (formal style)
- compounds: نرم‌افزار، ثبت‌نام، شگفت‌انگیز، به‌روزرسانی

- A plain space (می روم) splits the word across lines, and text-to-speech reads می as "mey" (wine). No separator at all (میروم) fuses the letters illegibly.
- Type it in source as the real character or `&zwnj;`. On a standard Persian keyboard it's Shift+Space (general practice).
- Check every Persian string you write, especially buttons: «ثبت‌نام», «ورود به حساب», «افزودن به سبد خرید». `scripts/audit.mjs` flags the common space-instead-of-ZWNJ patterns.

## 7. Punctuation `[Proven]`
- Persian comma `،` (U+060C), semicolon `؛` (U+061B), question mark `؟` (U+061F), guillemets `«…»`.
- No space **before** punctuation, one space **after**: `سلام، خوش آمدید.` — `قیمت:` not `قیمت :`.
- Parentheses and brackets mirror automatically when `dir="rtl"` is set correctly.

## 8. Mixed-direction (bidi) text and inputs `[Proven]`
The Unicode bidi algorithm reorders neutral characters (`+ - . : / @ ( )`) next to LTR runs, so `+98 912…` turns into `912… 98+`. Isolate every LTR token inside Persian text:
```html
گوشی <bdi>iPhone 16 Pro</bdi> موجود است.
با شماره <span dir="ltr" class="bidi-ltr">+98 912 345 6789</span> تماس بگیرید.
```
- Wrap in `<bdi>` or `dir="ltr"` + `unicode-bidi: isolate`: phone numbers, emails, URLs, promo codes, order IDs, card numbers, Sheba numbers, code, math, English product names, user-generated names of unknown direction.
- **Inputs:**
  - Persian text fields: inherit RTL.
  - Phone, email, URL, OTP, card, Sheba, national ID, numeric codes: `dir="ltr"` (digits read left→right). Align them with the RTL labels (`text-align: right`); OTP centered.
  - User-generated text that may be either language: `dir="auto"`.
- **Foreign-language content** (e.g. English sentences in a language-school quiz): `<div dir="ltr" lang="en" class="text-left">`, while the surrounding chrome (progress, buttons, timer) stays RTL.
- Code blocks: always `dir="ltr"`.

## 9. Logical CSS and the Tailwind mapping `[Proven]`
Write logical properties **only**. Then the same markup works in both directions with zero overrides.

| Physical (never) | Logical CSS | Tailwind (v3.3+/v4) |
|---|---|---|
| `margin-left/right` | `margin-inline-start/end` | `ms-*` / `me-*` |
| `padding-left/right` | `padding-inline-start/end` | `ps-*` / `pe-*` |
| `left: 0` / `right: 0` | `inset-inline-start/end` | `start-0` / `end-0` |
| `text-align: left/right` | `text-align: start/end` | `text-start` / `text-end` |
| `border-left` / `border-right` | `border-inline-start/end` | `border-s` / `border-e` |
| `border-top-left-radius` | `border-start-start-radius` | `rounded-ss-*`, `rounded-s-*`, `rounded-e-*` |
| `float: left` | `float: inline-start` | `float-start` |
| `ml-auto` (push to end) | `margin-inline-start: auto` | `ms-auto` |
| `space-x-*` | use `gap-*` (works in both directions) | `gap-*` |
| `translate-x-*` slide-ins | flip with a variant | `translate-x-full rtl:-translate-x-full` |
| directional icon | `transform: scaleX(-1)` in RTL | `rtl:-scale-x-100` |

- Use `rtl:` / `ltr:` variants only for real exceptions (icons, transforms, gradients that imply direction).
- shadcn/Radix: wrap the app in `<DirectionProvider dir="rtl">` and replace any `left-`/`right-`/`ml-`/`mr-` in copied components. MUI: `stylis-plugin-rtl`. Ant Design: `ConfigProvider direction="rtl"`. Mantine: `DirectionProvider` `[Proven, report C]`.

## 10. Mirroring `[Proven]`
| Element | Mirror? | Rule |
|---|---|---|
| Back/next arrows, breadcrumb chevrons, "continue →" | **Yes** | in RTL, next/forward points **left** (←); back points right (→) |
| Send, reply, undo/redo, logout, chat bubble tails | Yes | outgoing flow goes to the left |
| Progress bars, sliders, steppers, carousels | Yes | start (0%, step 1, first slide) at the **right** |
| Tables and forms | Yes | identifier column at the far right, actions at the far left; labels at start |
| Sidebars, drawers, timelines, list bullets | Yes | dock at the right |
| Question-mark help icon | Yes | Persian uses ؟ |
| **Media controls** (play, pause, seek, timeline, volume) | **No** | stay LTR (Iranian players like Aparat and Filimo do) |
| Clocks, circular refresh, spinners | **No** | always clockwise |
| Checkmarks, search magnifier, logos, real objects (camera, cup) | **No** | — |
| Digits inside numbers, phone, card, dimensions (1920×1080) | **No** | always left→right |
| Charts | Context | keep time axes consistent across the product; Persian digits in labels `[Emerging]` |

## 11. Layout conventions `[Proven]`
- Visual hierarchy starts **top-right**: logo at the right, primary navigation reads right→left, primary CTA at the **left end** of the header.
- Two-column heroes: text on the right (start), visual on the left (end).
- Forms: labels right-aligned (start); primary button at the start (right) or full width on mobile.
- Tab order must run right→left. Rely on DOM order + flex/grid in RTL; never `float:left`, `left:` coordinates or hardcoded `grid-column: 1` to place things visually.
- Truncation: `text-overflow: ellipsis` / `line-clamp` with real `dir="rtl"` puts `…` on the left. Never `.slice(0,20)+'...'` in JS (it can cut mid-word or at a ZWNJ).

## 12. Persian accessibility `[Proven]`
- `lang="fa"` on `<html>` and `lang="en"` on English fragments, so NVDA/TalkBack switch voices. Without `lang="fa"`, English voices skip or garble Persian.
- Every icon-only control gets a **Persian** `aria-label`: «بستن»، «جستجو»، «منوی اصلی»، «سبد خرید»، «حذف». An English "Close" on a Persian page is a defect.
- ZWNJ correctness affects pronunciation (§6). For ambiguous words in short labels (کرم = cream or generosity), add context in the `aria-label`.
- Floating labels: `transform-origin: top right` (or logical start) in RTL.
- Test with NVDA + a Persian voice (Windows OneCore fa-IR, eSpeak NG, or the "Dual Voice" add-on) and TalkBack with a Persian Google TTS voice `(⏱ verify)`.

## 13. Microcopy register `[Proven]`
- **Address:** polite plural «شما» with formal verbs («وارد کنید», not «وارد کن»). Informal «تو» only for kids' games.
- **Buttons and tabs:** verbal nouns or infinitives — «ثبت سفارش», «افزودن به سبد خرید», «ورود به حساب», «مشاهده همه», «ادامه».
- **Hints and empty states:** polite imperative — «شماره موبایل خود را وارد کنید».
- **Errors:** what happened + what to do, without slang — «خطایی در ارتباط با سرور رخ داد؛ لطفاً دوباره تلاش کنید.» Never literal translations like «آخ! یک چیزی اشتباه رفت».
- Prices: «۲٬۴۵۰٬۰۰۰ تومان». Dates: «۲۱ مهر ۱۴۰۵». Times: «ساعت ۱۸:۰۰». Durations: «۴ ساعت و ۲۰ دقیقه».

**Glossary (use these exact strings):**
| English | Persian |
|---|---|
| Log in / Sign up | ورود / ثبت‌نام |
| Log in or sign up | ورود یا ثبت‌نام |
| Mobile number | شماره موبایل |
| Verification code | کد تأیید |
| Resend code | ارسال مجدد کد |
| Edit number | ویرایش شماره |
| Continue / Back | ادامه / بازگشت |
| Next / Previous | بعدی / قبلی |
| Save / Cancel | ذخیره / انصراف |
| Saved | ذخیره شد |
| Edit / Delete | ویرایش / حذف |
| Search | جستجو |
| Close | بستن |
| View all | مشاهده همه |
| Add to cart | افزودن به سبد خرید |
| Checkout / Pay | ثبت سفارش / پرداخت |
| Free consultation | مشاوره رایگان |
| Free trial session | جلسه آزمایشی رایگان |
| Placement test | آزمون تعیین سطح |
| Register for class | ثبت‌نام در کلاس |
| Schedule | برنامه کلاس‌ها |
| Required / Optional | الزامی / اختیاری |
| Loading… | در حال بارگذاری… |
| No results found | نتیجه‌ای پیدا نشد |
| Try again | تلاش دوباره |
| Skip to content | رفتن به محتوای اصلی |

## 14. Text normalization for search and storage `[Proven]`
Normalize on input **and** in the database index:
- Arabic ي (U+064A) / ى (U+0649) → Persian ی (U+06CC)
- Arabic ك (U+0643) → Persian ک (U+06A9)
- digits → ASCII
- strip diacritics and tatweel
- collapse repeated ZWNJs

When searching, treat ZWNJ and space as equivalent. Sort with `Intl.Collator('fa-IR')` (the default sort misplaces پ چ ژ گ ک ی). The helpers are in `assets/persian-helpers.js` and `assets/PersianHelpers.php`.

## 15. Common rendering bugs and mistakes
| Symptom | Cause | Fix |
|---|---|---|
| Letters look disconnected (پ ی ش ن ه ا د) | inherited `tracking-*` | `letter-spacing:0` on `:lang(fa)` |
| Bottom of گ چ ی cut off in buttons/badges | `leading-none` + fixed height + `overflow:hidden` | line-height ≥ 1.55, padding instead of fixed height |
| `٤٥٦` in prices | Arabic locale or font | `Intl.NumberFormat('fa-IR')` / `toPersianDigits` |
| `)` and `(` reversed, `...` on the wrong side | `text-align:right` without `dir="rtl"` | real `dir="rtl"` |
| `+98` jumps to the end | no bidi isolation | `<span dir="ltr">` / `<bdi>` |
| Tab moves left→right | floats or absolute positioning | DOM order + logical layout |
| Search misses «علی» | Arabic ي/ك in data | normalize input + DB |
| Words split oddly at line ends | space instead of ZWNJ | ZWNJ |
| Page looks "translated" | Latin quotes, commas, «تو», literal idioms | Persian punctuation + formal register |
| Icons pointing the wrong way, or clocks flipped | blanket mirroring | mirror only directional icons (§10) |
| Persian text on top of an image with a glass blur | low contrast for dots | solid tint behind text, ≥ 5.5:1 (house rule) |
