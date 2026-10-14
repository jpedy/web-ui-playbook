# Iran Market — UX conventions, data formats, payments, trust, SEO

Apply this when the users are **inside Iran**, together with `persian-rtl.md` and `iran-network-resilience.md`. Source: report C §2/§3/§5/§6/§8 and the Persian catalogs.

**⏱ = time-sensitive.** Facts marked ⏱ (services, providers, regulations, prices, blocking) are **as of the Oct 2026 report (Solar Hijri 1405) — verify before relying**. Tell the user to confirm them before launch.

## Contents
1. Devices and navigation
2. Login: mobile number + SMS OTP
3. Prices: Toman, Rial, discounts, installments
4. Jalali calendar and time
5. Class and appointment schedules (زوج/فرد)
6. Validation: national ID, card, Sheba, mobile, postal code
7. Payments (Shaparak)
8. Trust signals and support channels
9. Maps, video and live classes
10. Persian SEO
11. Culture, color, imagery
12. Vertical patterns: e-commerce, education/language schools, fintech, services
13. Common mistakes

---

## 1. Devices and navigation `[Proven]`
- ⏱ Mobile is > 80% of consumer traffic; Android ≈ 80–85%, iOS 15–20%. **Design at 360×800 first** and test on a budget Android.
- **Consumer apps:** a **bottom navigation bar** with 4–5 tabs (e.g. خانه · دسته‌بندی‌ها · سبد خرید · پروفایل من) outperforms the hamburger menu. Use **bottom sheets** instead of centered modals on mobile.
- ⏱ Because of App Store sanctions, many Iranian services ship iOS as a **PWA**. When `!navigator.standalone` on iOS Safari, show a bottom sheet with an icon-based guide: Share icon → «افزودن به صفحه اصلی» (Add to Home Screen).
- Show download and file sizes in MB («حجم: ۲۴ مگابایت»); users are sensitive to data quotas.

## 2. Login: mobile number + SMS OTP `[Proven]`
**Flow (one unified screen for login and sign-up — «ورود یا ثبت‌نام»):**
1. **Screen 1:** «شماره موبایل خود را وارد کنید».
   - One input: `type="tel" inputmode="numeric" dir="ltr" autocomplete="tel"`.
   - Placeholder `۰۹۱۲ ۳۴۵ ۶۷۸۹`.
   - Accepts Persian, Arabic and ASCII digits; normalized to `09xxxxxxxxx`.
   - Validated with `/^(?:\+98|0098|0)?9\d{9}$/` after normalizing.
   - Button «دریافت کد تأیید» / «ادامه».
2. **Screen 2:** «کد ۵ رقمی ارسال‌شده به ۰۹۱۲۳۴۵۶۷۸۹ را وارد کنید».
   - 4–6 digit input(s): `inputmode="numeric" autocomplete="one-time-code" dir="ltr"`.
   - Auto-submit when complete.
   - A **120-second countdown** in Persian digits («۰۱:۵۹ تا ارسال مجدد کد») → «ارسال مجدد کد».
   - Link «ویرایش شماره موبایل».
   - Optional WebOTP on Android Chrome: `navigator.credentials.get({ otp: { transport: ['sms'] } })`.
3. **After verification:** ask for the name only if needed, and never before showing value.

**Rules:**
- No email+password as the primary consumer path.
- ⏱ "Sign in with Google" fails without a VPN, so never make it primary.
- ⏱ Send OTPs through the SMS provider's **pattern/verify API on a service line** («خط خدماتی» / پترن), not bulk promotional lines. Promotional SMS is blocked for an estimated 35–50% of subscribers, and those OTPs silently never arrive.
  - Providers named in the report: Kavenegar, SMS.ir, Melipayamak, Ghasedak, Farapayamak, Magfa.
- **Copy:** «کد تأیید»، «ارسال مجدد کد»، «ویرایش شماره». Error: «کد واردشده صحیح نیست؛ دوباره تلاش کنید.»

## 3. Prices `[Proven]`
- **Display Tomans** with Persian digits and `٬` separators: `۲٬۴۵۰٬۰۰۰ تومان`. Never write "T", "IRT" or "IRR" in the UI. Dense UIs may use a small «تومان» glyph or SVG after the number.
- ⏱ **Shaparak gateways charge in Rials** (1 Toman = 10 Rials). The final checkout summary and pay button must show both: «مبلغ قابل پرداخت: ۲٬۴۵۰٬۰۰۰ تومان (معادل ۲۴٬۵۰۰٬۰۰۰ ریال در صفحه بانک)». Otherwise users see an extra zero at the bank and abandon.
- ⏱ Official currency redenomination is in progress; consumer UIs still use Tomans. Recheck before launch.
- **Money inputs:**
  - Live thousands separators while typing.
  - Unit suffix «تومان».
  - The amount in words underneath: «معادل: بیست و پنج میلیون تومان» (`numberToPersianWords` in the helpers). This prevents zero-count mistakes.
- **Discounts:** old price struck through (muted) + new price (bold) + pill «۱۵٪ تخفیف» (danger or brand color).
- ⏱ **Installments (BNPL)** directly under the price/CTA: «۴ قسط ماهانه ۶۱۲٬۵۰۰ تومانی با اسنپ‌پی — بدون کارمزد و ضامن». Leading providers: SnappPay, DigiPay. Show the actual provider only if the business has a contract — otherwise use a generic «امکان پرداخت اقساطی».

## 4. Jalali calendar and time `[Proven]`
- The civil calendar is **Solar Hijri (Jalali)**. Oct 2026 ≈ Mehr/Aban **1405**.
- **Months:** فروردین، اردیبهشت، خرداد، تیر، مرداد، شهریور (31 days each) · مهر، آبان، آذر، دی، بهمن (30 days each) · اسفند (29, or 30 in leap years).
- **Week:** starts **شنبه (Saturday)** and ends **جمعه (Friday, the weekend)**.
  - Calendar grid, right→left: ش ی د س چ پ ج.
  - Fridays and official holidays shown in red.
- **Store in UTC** (ISO-8601 / timestamps). Convert to Jalali only for display and input. Never store `"1405/07/21"` strings as the date column.
- ⏱ **Time zone:** `Asia/Tehran` is UTC+03:30 **all year**. DST was abolished in 2022 — stale tzdata shows a 1-hour error in spring and summer.
- **Display formats:** «۲۱ مهر ۱۴۰۵» (long), «۱۴۰۵/۰۷/۲۱» (short), «سه‌شنبه ۲۱ مهر» (with weekday), «۵ دقیقه پیش» (relative). 24-hour time «۱۸:۳۰», no AM/PM (ق.ظ/ب.ظ).
- **Date inputs:**
  - **Birth date:** three selects for day, month name and year (۱۳۰۰–۱۴۰۵). Never a calendar grid the user must page back through decades.
  - **Booking or travel:** a 2-month Jalali grid starting on Saturday + a «تقویم میلادی» toggle when Gregorian dates matter (international flights).
- **Tools:**
  - Display: `new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'long' })` (0KB, built into browsers).
  - Math/state: `date-fns-jalali` or `jalaali-js` (~2KB).
  - React picker: `react-multi-date-picker`.
  - Avoid `moment-jalaali` in new code `[Possibly outdated]`.
  - Laravel/PHP: `morilog/jalali` or `hekmatinasser/verta` (not from reports — verify).
  - Laravel + Alpine: format server-side, or use `Intl` in the browser.

## 5. Class and appointment schedules `[Proven]`
- «روزهای زوج» = **شنبه، دوشنبه، چهارشنبه** (Sat, Mon, Wed). «روزهای فرد» = **یکشنبه، سه‌شنبه، پنج‌شنبه** (Sun, Tue, Thu). «آخر هفته» = پنج‌شنبه و جمعه (weekend intensive).
- Never use Western "Mon/Wed/Fri" groupings.
- **Compute real start dates; never guess weekdays** (found in testing: "شنبه ۳ آبان ۱۴۰۵" was wrong — 3 Aban 1405 is a Sunday).
  - Generate dates with `Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', … , timeZone: 'Asia/Tehran' })` or a Jalali library.
  - Check that a زوج class starts on شنبه/دوشنبه/چهارشنبه, a فرد class on یکشنبه/سه‌شنبه/پنج‌شنبه, and a weekend class on پنج‌شنبه/جمعه.
- Times in 24-hour Persian digits with the time zone: «ساعت ۱۸:۰۰ تا ۱۹:۳۰ (به وقت تهران)».
- **Schedule UI:**
  - Desktop: a table — rows = classes/levels; columns = level, days (زوج/فرد), time, start date (Jalali), format (online/in-person), seats left, price, CTA.
  - Mobile: cards.
  - Filters: level, days, time of day (صبح/عصر/شب), format, branch.
  - Show «ظرفیت باقی‌مانده: ۳ نفر» only if true.
- ⏱ Online classes: show the platform badge (Skyroom, or self-hosted BigBlueButton — both work inside Iran without a VPN).

## 6. Validation (normalize digits first, then validate) `[Proven]`
Implementations: `assets/persian-helpers.js` (browser) and `assets/PersianHelpers.php` (Laravel, untested here). Library alternative: `@persian-tools/persian-tools` (MIT).

| Field | Rule |
|---|---|
| National ID (کد ملی) | 10 digits, stored as a **string** (leading zeros matter); reject 10 identical digits; Mod-11: `s = Σ d[i]·(10−i)` for i=0..8, `s %= 11`; valid if `s<2 ? d9===s : d9===11−s` |
| Bank card (شماره کارت) | 16 digits, shown LTR in 4-groups `6037 9912 3456 7890`; Luhn mod-10; the first 6 digits (BIN) identify the bank → show its logo while typing (e.g. 603799 Melli, 610433 Mellat, 621986 Saman, 502229 Pasargad ⏱) |
| Sheba (شبا) | `IR` + 24 digits; ISO 7064 mod-97: move the first 4 chars to the end, I=18, R=27, `BigInt % 97n === 1n`; show the prefix «IR» as a fixed adornment |
| Mobile | `/^(?:\+98|0098|0)?9\d{9}$/` after normalizing; store as `09xxxxxxxxx` or E.164 `+989xxxxxxxxx` |
| Postal code (کد پستی) | 10 digits; the report's stricter regex `/^(?!(\d)\1{3})[13-9]{4}[1346-9][013-9]{5}$/` is **❓ unverified** — use plain 10-digit validation unless confirmed |

- Inputs must accept Persian, Arabic and ASCII digits, and strip spaces and dashes before checking.

## 7. Payments (Shaparak) ⏱ `[Proven]`
- Online card payments run only on the domestic **Shetab/Shaparak** network. No Visa, Mastercard, Stripe or PayPal.
- **Gateway options:**
  - **Direct bank PSPs:** Behpardakht Mellat, Saman/SEP, Sadad, Parsian, Asan Pardakht, Pasargad. No fees; require eNamad and a tax file.
  - **Aggregators:** Zarinpal, Vandar, Zibal, PayPing, IDPay. REST APIs, ~1–1.5% fee.
  - **BNPL:** SnappPay, DigiPay.
- **Checkout UI:**
  - Toman + Rial amounts (§3).
  - A **notice before redirecting**: «در حال انتقال به درگاه امن شاپرک… لطفاً فیلترشکن خود را خاموش کنید» (Shaparak blocks most foreign/VPN IPs).
  - Gateway logos next to the pay button.
- **Technical:**
  - The redirect `Referer` must match the registered domain; don't send `Referrer-Policy: no-referrer` on the payment page.
  - The callback must call **Verify server-to-server, idempotently, within 10–15 minutes**, or the bank auto-reverses the payment.
- **Receipt page** («نتیجه پرداخت»):
  - Success/failure state.
  - **Tracking code** (کد رهگیری / شماره مرجع).
  - Order ID, Jalali date and time, amount.
  - On failure: «در صورت کسر وجه، مبلغ حداکثر تا ۷۲ ساعت آینده به حساب شما بازمی‌گردد.»
  - *Conflict:* report C gives auto-reversal as 30–72 **minutes** in one place and promises "up to 72 **hours**" in the user copy → tell users **72 hours** (the safer promise).

## 8. Trust signals and support ⏱ `[Proven]`
- **eNamad** (نماد اعتماد الکترونیکی) in the footer. Required for gateways; users check for it before paying. Also Samandehi when applicable.
  ```html
  <a referrerpolicy="origin" target="_blank" href="https://trustseal.enamad.ir/?id=ID&Code=CODE"
     class="inline-flex size-[96px] items-center justify-center rounded-xl border border-border bg-white p-2"
     aria-label="نماد اعتماد الکترونیکی">
    <img referrerpolicy="origin" src="https://trustseal.enamad.ir/logo.aspx?id=ID&Code=CODE"
         alt="نماد اعتماد الکترونیکی" width="72" height="80" loading="lazy" id="CODE">
  </a>
  ```
  - `referrerpolicy="origin"` is required, or the seal breaks.
  - The fixed box prevents layout shift when enamad.ir is slow.
  - This is the one sanctioned external request: it's domestic, lazy-loaded and non-blocking.
  - The site owner provides the ID and code; use a placeholder box until then.
- **Support** (Iranian users distrust anonymous contact forms):
  - Click-to-call **landline** with area code («۰۲۱-۹۱۰۰۰۰۰۰»), working hours.
  - Live chat (Goftino, Raychat).
  - **Telegram + a domestic messenger** (Bale / Eitaa / Rubika), so users can reach you with or without a VPN.
  - Physical address.
- **Product and service trust:** guarantees («ضمانت بازگشت وجه ۷ روزه»), license or accreditation seals (e.g. Ministry of Education or Technical & Vocational Organization permits for schools), real reviews with city names.

## 9. Maps, video, live classes ⏱ `[Proven]`
- **Maps:** Neshan (`@neshan-maps-platform/*`), Balad or ParsiMap — not Google Maps (billing sanctions plus throttling).
- **Video:** Aparat or ArvanCloud VOD — not YouTube or Vimeo (filtered, so the embed shows a black box).
- **Live classes:** Skyroom or a self-hosted BigBlueButton.
- Video piracy deterrent for paid courses: HLS encryption + a dynamic watermark with the user's mobile number.

## 10. Persian SEO `[Proven]`
- `<html lang="fa-IR" dir="rtl">` (or `lang="fa"`); `hreflang="fa-IR"` for alternates. Google has ~95% of searches in Iran ⏱.
- **Slugs:**
  - Short English (`/courses/ielts-prep`) or ID-prefixed (`/p/1042/…`) + a "copy short link" button.
  - Persian slugs work for Google but percent-encode into very long links when shared.
  - **Never Finglish** (`/amoozesh-zaban`).
- **Titles and H1:** proper ZWNJ spelling. Use common spoken variants and model names in subheadings and FAQ («نرم افزار» / «نرم‌افزار», «گلکسی اس ۲۴» / «S24»).
- **JSON-LD:** `Offer.priceCurrency` must be `"IRR"` with `price = toman × 10` — never "IRT" or "Toman". Visible text stays in Tomans. Use `Course`, `FAQPage`, `Organization`, `LocalBusiness` where relevant.
- ⏱ **E-commerce:** a Torob/Emalls product feed (JSON: id, page_url, price in Toman, availability, old_price) + `<meta name="torob-verification">`.
- Video SEO: host on Aparat.

## 11. Culture, color, imagery `[Proven]`
- **Colors:**
  - Crimson red signals sales and urgency (Digikala «پیشنهاد شگفت‌انگیز»), as well as errors, so pair errors with an icon.
  - Green: finance, settlement, success.
  - Turquoise (فیروزه‌ای): heritage, education, travel.
- **Copy:** formal-warm register (`persian-rtl.md` §13).
- ⏱ **Imagery:** people in photos and illustrations must follow modest-dress rules on `.ir` sites, eNamad-certified sites and gateway-connected sites. Unmodified Western stock photos can fail compliance review.
- **Social links:** Instagram + Telegram + Bale/Eitaa. Skip Facebook/Pinterest.
- Seasonal moments: Nowruz, Yalda, Mehr (back to school) — campaign landings with real countdowns.

## 12. Vertical patterns

### E-commerce `[Proven]`
- **Product card:** image 1:1, title (2-line clamp), price (Toman), old price + discount pill, installment line, rating, fast-delivery badge.
- **Product page:**
  - Multi-seller/warranty box (Digikala): seller, warranty «گارانتی اصالت و سلامت فیزیکی کالا», delivery time.
  - **Sticky bottom buy bar on mobile:** price + «افزودن به سبد خرید».
- **Cart:** total upfront; checkout with OTP login; address form with province/city selects; Neshan map pin optional.
- Footer: eNamad + phone + returns policy.

### Education / language school `[Proven, report C §8 + catalogs]`
1. **Course hero, two columns (RTL):**
   - **Right:** title (H1), value line, teacher credentials, student count («۳٬۴۵۰ زبان‌آموز»), rating («۴٫۸ از ۵»), trust badges (certificate, support on Telegram/Bale).
   - **Left (sticky on desktop):** trailer video (domestic host), «جلسه آزمایشی رایگان» button, price in Toman, installment widget.
   - **Mobile:** stacked, with a sticky bottom bar (price + CTA).
2. **Persona segmentation:** tabs or cards for Adults · Teens · Kids · IELTS/TOEFL · Business (Iran Europe pattern).
3. **Level path:** A1→C2 visual chart (CEFR) with duration per level.
4. **Free online placement test** («تعیین سطح آنلاین و رایگان»):
   - Starts **without login**.
   - The English question text is `dir="ltr" lang="en"` inside the RTL test shell.
   - Progress «سوال ۱۲ از ۳۰», timer «زمان باقی‌مانده: ۰۸:۴۵».
   - «سوال بعدی ←» on the left.
   - The CEFR result is gated by mobile + OTP, followed by an offer to book a free 15-minute oral assessment.
5. **Schedule:** زوج/فرد table (§5) with seats left and a register CTA.
6. **Syllabus accordion:** chapter titles at the start; durations in Persian digits at the end («۱۲ جلسه • ۱۸ ساعت»); green «رایگان» badge on preview lessons.
7. **Teachers:** photo, name, certifications (CELTA/TESOL, years of experience), a short audio or video sample.
8. **Testimonials:** voice-note style (Telegram-like audio bubbles), video interviews, real first name + city + achieved score («آیلتس ۷٫۵»).
9. **Pricing:** per term or level, in Toman, with an installment line and discounts for multi-term or siblings, if real.
10. **Free phone consultation form — exactly 2 fields:** «نام و نام خانوادگی» + «شماره موبایل» → «درخواست مشاوره رایگان».
11. **FAQ:** online vs in-person, certificates, refunds, makeup sessions, level changes.
12. **Accreditation and footer:** license seals, eNamad, branch addresses with map links (Neshan/Balad), landline, Telegram + Bale.

### Fintech
- Clean, calm, high-contrast; big amounts with `tabular-nums`; national ID + mobile matching awareness (Shahkar ⏱); bank logo detection on card and Sheba inputs; amount in words under inputs.

### Classifieds and services
- Low-bandwidth list rows: thumbnail + title + price + relative time + neighborhood («دقایقی پیش در تهران، سعادت‌آباد»).
- City/neighborhood picker; masked phone reveal behind OTP.
- Booking wizards as bottom sheets on mobile (Komakkar pattern).

## 13. Common mistakes
- Email/password-first sign-up; OTP over a promotional line; no resend timer; phone input that rejects Persian digits.
- Prices in Rials on cards, or "T" abbreviations; no Rial notice before the bank page; JSON-LD with "IRT".
- Gregorian-only date pickers; weeks starting Monday; storing Jalali strings; AM/PM times.
- Western Mon/Wed/Fri class schedules.
- No eNamad, or eNamad without `referrerpolicy="origin"`; only an email contact form.
- Google Maps or YouTube embeds; Google sign-in or reCAPTCHA as hard dependencies.
- Western stock photos that fail modesty review; Finglish URLs.
- Blocking foreign IPs (locks out the ~half of users on a VPN) — see `iran-network-resilience.md`.
