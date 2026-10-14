# Iran Network Resilience — make it load inside Iran

Apply this to every site with users inside Iran. Source: report C §4 and its network checklist.

**⏱ Everything about blocking, throttling and providers here is as of the Oct 2026 report — verify before relying.** The *principle* (zero runtime dependency on foreign hosts) is stable; the provider names are not.

## Contents
1. Why: the "double firewall"
2. Rule 1 — zero foreign runtime requests
3. Rule 2 — tolerate VPN users, never geo-switch
4. Rule 3 — survive national-network-only mode
5. Replacement table for common third-party services
6. Hosting and CDN options
7. Performance budget for unstable mobile networks
8. PWA and offline
9. Laravel/Vite specifics
10. Test procedure
11. Checklist

---

## 1. Why
- **Outbound sanctions:** many US/EU services block Iranian IPs — Firebase, Google Cloud APIs, Stripe, PayPal, Twilio, some AWS CloudFront distributions, Docker Hub, OpenAI/Anthropic APIs ⏱.
- **Inbound filtering:** international links are throttled or filtered. Google Fonts, Google Tag Manager, reCAPTCHA and some Cloudflare IP ranges can hang for **5–15 seconds** ⏱ when bandwidth is degraded or a user's VPN drops.
- **The result:** a blank white page or unstyled text for real users, even though the site "works" when you test it from outside Iran.

## 2. Rule 1 — zero foreign runtime requests `[Proven]`
Every font, icon, script, stylesheet, image and video the browser loads must come from **your own origin** or a domestic CDN. Banned in client HTML/CSS/JS:

`fonts.googleapis.com` · `fonts.gstatic.com` · `fonts.bunny.net` · `use.typekit.net` · `use.fontawesome.com` · `kit.fontawesome.com` · `cdn.jsdelivr.net` · `unpkg.com` · `cdnjs.cloudflare.com` · `cdn.tailwindcss.com` · `code.jquery.com` · `googletagmanager.com` · `google-analytics.com` · `google.com/recaptcha` · `gstatic.com/recaptcha` · `maps.googleapis.com` · `youtube.com/embed` · `player.vimeo.com` · `connect.facebook.net`

- **How:**
  - Install with npm and bundle with Vite (Laravel default).
  - Copy font woff2 files into `public/fonts` or import `@fontsource-variable/*`.
  - Inline SVG icons.
  - Host images yourself (AVIF/WebP).
- **Exception:** the domestic eNamad seal (`trustseal.enamad.ir`), lazy-loaded inside a fixed-size box so it never blocks rendering.
- `scripts/audit.mjs` flags all the hosts above.

## 3. Rule 2 — tolerate VPN users, never geo-switch `[Proven]`
- ⏱ An estimated **40–60%** of Iranian users browse with a VPN (foreign IP) at any moment.
- **Never block non-Iranian IPs.** A DDoS geo-block locks out half of your domestic users.
- **Never auto-select language or currency by IP.** A Tehran user on a Frankfurt VPN must still get `fa-IR` + Toman. Default to Persian and offer a manual language switch.
- Before the Shaparak redirect, ask users to turn off their VPN (`iran-market.md` §7).

## 4. Rule 3 — survive national-network-only mode `[Proven]`
- ⏱ During severe disruptions, international routing can be cut while the **National Information Network (شبکه ملی اطلاعات)** stays up.
- If 100% of HTML, CSS, JS, fonts, icons, media and API endpoints resolve to **domestic IPs**, the site keeps working. Any synchronous foreign dependency breaks it.
- **Server-side calls to sanctioned APIs** (OpenAI, Telegram Bot API, GitHub…): host the user-facing app inside Iran and route only those outbound calls through a small relay VPS abroad (e.g. Hetzner in Germany/Finland) ⏱.

## 5. Replacement table ⏱
| Need | Avoid in the client | Use |
|---|---|---|
| Web fonts | Google Fonts, Bunny Fonts, Adobe Fonts | self-hosted woff2 (Vazirmatn variable ~110KB) |
| Icons | Font Awesome kit/CDN | inline SVG from an npm icon set |
| CSS/JS libraries | CDN `<script>`/`<link>`, Tailwind Play CDN | npm + Vite bundle |
| Analytics | client-side GA4, Mixpanel | self-hosted Umami, Plausible or Matomo; Microsoft Clarity via proxy |
| Error tracking | Firebase Crashlytics, hosted Sentry | self-hosted Sentry on a domestic VPS |
| CAPTCHA | Google reCAPTCHA | ArvanCloud Captcha, self-hosted **Altcha** (proof-of-work), or a server-generated SVG captcha |
| Push | Firebase Cloud Messaging | Najva, Pushe, Chabok + Web Push service worker |
| Maps | Google Maps | Neshan, Balad, ParsiMap, self-hosted OSM tiles |
| Video | YouTube, Vimeo | Aparat, ArvanCloud VOD |
| Live classes | Zoom, Google Meet | Skyroom, self-hosted BigBlueButton |
| Login | Google/Apple sign-in, Firebase Auth | mobile + SMS OTP via a domestic provider |
| Payments | Stripe, PayPal | Shaparak gateways (`iran-market.md` §7) |
| Chat support | Intercom, Crisp (risky) | Goftino, Raychat |

## 6. Hosting and CDN ⏱
| Audience | Recommendation |
|---|---|
| > 80% inside Iran, uses Shaparak/eNamad | host **inside Iran**: Liara (PaaS), Hamravesh, ArvanCloud, Parspack, or a domestic VPS. Low latency (< 25ms), cheaper domestic traffic, survives isolation. |
| Mixed audience or diaspora | EU host (e.g. Hetzner) fronted by a domestic CDN reverse proxy (ArvanCloud, Sotoon, Derak) |
| CDN | domestic PoPs (ArvanCloud, Sotoon, Derak). Cloudflare is `[Possibly outdated / volatile]` for Iranian audiences: some of its IPs are intermittently throttled by Iranian mobile ISPs. |
| Avoid | Vercel, Netlify, Firebase Hosting, Render, Heroku for Iran-facing apps (blocked or slow) |

## 7. Performance budget for unstable mobile networks
(Report C targets plus general practice.)
- **Must work** on simulated 3G: 300ms RTT, 5% packet loss.
- **First load (mobile)** — general practice targets:
  - HTML+CSS+critical JS ≤ 200KB gzipped
  - fonts: **1 variable woff2** preloaded (~110KB)
  - hero image ≤ 150KB AVIF/WebP
  - total ≤ 1MB
- **Server rendering** (Blade, Livewire, Inertia SSR) so content shows before JS; optimistic UI to hide latency.
- `font-display: swap` + a matching fallback (Tahoma for Persian) so text appears immediately.
- No render-blocking third-party scripts; `defer` everything non-critical.
- Lazy-load below-the-fold images and iframes; reserve their space (no CLS).

## 8. PWA and offline `[Proven]`
- `manifest.webmanifest`: Persian `name`/`short_name`, `"dir": "rtl"`, `"lang": "fa"`, icons 192/512, `display: standalone`, `theme_color` = the primary token.
- **Service worker:**
  - Cache the app shell (CSS, JS, font, logo) on install.
  - Network-first for HTML with an offline fallback page («اتصال اینترنت برقرار نیست»).
  - Cache-first for static assets.
- iOS: an "Add to Home Screen" guide sheet (`iran-market.md` §1).
- Show an offline banner and queue form submissions where sensible.

## 9. Laravel/Vite specifics
(Not from reports — verify against your Laravel version.)
- **Fonts:** Laravel's default welcome page and some starter kits load fonts from **`fonts.bunny.net`**. Remove that `<link>` and self-host instead (`npm i @fontsource-variable/vazirmatn`, then `@import "@fontsource-variable/vazirmatn";` in `resources/css/app.css`).
- **Filament:** its panel font setting loads from a remote font provider by default. Configure a **local** font provider and self-host the font files.
- **Alpine, Livewire, Flux:** bundled via npm/composer — no CDN script tags.
- **Avatars:** Gravatar and UI Avatars URLs are foreign. Generate initials avatars server-side or in CSS.
- **Email templates** may still reference external images. Host them on your domain.

## 10. Test procedure
1. DevTools → Network → filter by domain: **zero** requests to hosts outside your origin (eNamad excepted).
2. DevTools → Network throttling: custom profile with 300ms latency and ~400kbps down. Page is usable in ≤ ~5s; text is visible early.
3. Block all external domains (DevTools "Block request domain"). The page must still look complete.
4. Check `<html lang="fa" dir="rtl">`, that the font loads from `/fonts/` or `/build/`, and that the page doesn't switch language when using a foreign IP/VPN.
5. Run `node scripts/audit.mjs <dir> --iran`.

## 11. Checklist
- [ ] Zero client requests to the banned hosts (§2); only own origin + domestic CDN (+ the lazy eNamad seal).
- [ ] Fonts self-hosted (one variable woff2, preloaded), icons inline SVG, all JS/CSS bundled.
- [ ] No IP-based blocking or language/currency switching; Persian + Toman by default.
- [ ] Maps, video, captcha, analytics, push and login use domestic or self-hosted alternatives.
- [ ] Hosting/CDN chosen for the audience (domestic for Shaparak/eNamad sites) ⏱.
- [ ] Usable on 3G with 300ms RTT and 5% loss; PWA shell cached; offline page in Persian.
