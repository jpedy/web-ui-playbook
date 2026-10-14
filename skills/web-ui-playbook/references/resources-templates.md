# Templates, UI Kits, Fonts & Resources

Use this when the user asks "which template, kit or library should I use?". Always answer with: **recommendation by project type and budget → license in plain words → can it be paid for from Iran → RTL readiness → date marker**.

Sources: Parts B/C of all four catalogs, plus the 2026-10-14 spot-check.

⏱ **All prices, licenses and maintenance statuses are as of Oct 2026 — verify on the vendor page before buying.** Corrected values are marked "verified 2026-10-14".

## Contents
1. Decision table: project type × budget
2. Free libraries and kits (with licenses)
3. Accessible primitives and app libraries
4. Paid kits and marketplaces
5. Persian marketplaces and fonts
6. How to evaluate a template (8-point test)
7. Red flags
8. Excluded or unreliable sources
9. License glossary

---

## 1. Decision table (Laravel-first)
| Project | Free ($0) | Low ($50–150) | Premium ($150–300+) |
|---|---|---|---|
| Laravel admin / CRM / back-office | **Filament** (MIT) · Flowbite Admin (Blade) · TailAdmin free (Blade edition) | Cruip Mosaic Pro (~$49–99) · Metronic 9 Tailwind (~$69, full RTL build) | Filament + **Flux UI Pro** + **Tailwind Plus** |
| SaaS app (Livewire) | **MaryUI** (MIT) · Flux UI free core · Preline UI | Flux UI Pro single project **$149** | Flux UI Pro unlimited **$299** + Tailwind Plus **$299** |
| SaaS app (Inertia + React) | **shadcn/ui** (MIT) · Shadcn Admin (MIT) · Tremor (charts) | Cruip templates | Tailwind Plus (incl. Catalyst React kit) |
| SaaS marketing / landing | HyperUI + Preline starter pages + Flowbite blocks | Cruip (~$49) · Lexington Themes (~$99) | Tailwind Plus templates |
| **Persian / RTL web app or site** | **Preline UI**, **Flowbite**, **DaisyUI**, Meraki UI, Filament, shadcn/ui (with direction provider) + **Vazirmatn** | Metronic 9 (native RTL) · Flux UI Pro | **Preline Pro** (first-class RTL, ~$129–299) · Tailwind Plus (logical properties) |
| E-commerce | Flowbite e-commerce blocks + HyperUI + DaisyUI | Preline Pro e-commerce | Tailwind Plus e-commerce |
| Education / LMS / language school | Preline UI + MaryUI, or shadcn/ui with custom video + syllabus panes | Cruip + UI8 LMS Figma kits | Tailwind Plus (course templates) + Flux UI Pro |
| Persian WordPress (if the user accepts WP) | Zhaket free themes | Ahura (Mihan WP) for content/corporate | Bakala (Digikala-style shop) · Hamyar Learn (LMS) |

**Default if the user doesn't care:** Laravel + Tailwind v4 + Blade components from this skill + **Preline UI** or **Flowbite** (free, MIT, RTL-ready, Blade-friendly). Add Flux UI or MaryUI for Livewire apps and Filament for admin.

## 2. Free libraries and kits
| Name | URL | License (commercial?) | Stack | RTL | Notes |
|---|---|---|---|---|---|
| Preline UI | https://preline.co | MIT + fair use (commercial yes; no reselling as a kit) | HTML/Tailwind v4 + vanilla JS, React, Vue | **full native** | 300+ components; re-init after `wire:navigate` |
| Flowbite | https://flowbite.com | MIT core (Pro paid) | Tailwind v4 + vanilla JS/Blade/React/Vue | **full official** (`ms-*`/`me-*`) | Laravel+Vite install guide |
| DaisyUI v5 | https://daisyui.com | MIT | pure Tailwind plugin, zero JS | **native** (logical CSS) | semantic classes (`btn`, `card`), 30+ themes |
| HyperUI | https://hyperui.dev | MIT | HTML + Tailwind v4 | partial (some icons need `rtl:rotate-180`) | copy-paste marketing/e-commerce blocks |
| Meraki UI | https://merakiui.com | MIT | HTML + Tailwind + Alpine | built for RTL | slower releases |
| MaryUI | https://mary-ui.com | MIT | Laravel Blade + Livewire 3 + DaisyUI | good (via DaisyUI) | free Flux alternative |
| Filament | https://filamentphp.com | MIT | Laravel + Livewire + Alpine + Tailwind | **native RTL + `fa` locale** | admin panels, forms, tables; serve fonts locally |
| TailAdmin (free) | https://tailadmin.com | MIT (free version) | Tailwind v4; HTML, React, Vue, **Laravel Blade** | Pro only; free needs sidebar fixes | dashboard starter |
| shadcn/ui | https://ui.shadcn.com | MIT | React + Tailwind v4 + Radix | official RTL via direction provider | ships in Laravel's React starter kit ⏱; audit copied classes for `left/right` |
| Shadcn Admin | https://github.com/satnaing/shadcn-admin | MIT | React + shadcn | via shadcn RTL config | 10+ admin pages for Inertia |
| Tremor | https://tremor.so | Apache-2.0/MIT | React + Tailwind + Recharts | layout OK; reverse axes manually | **acquired by Vercel, Jan 2025 (verified 2026-10-14)** |
| Bootstrap 5.3 RTL | https://getbootstrap.com | MIT | official `bootstrap.rtl.min.css` | **official** | for non-Tailwind legacy projects |
| Figma Community kits | https://www.figma.com/community | mostly CC BY 4.0 (check each file) | Figma | varies — search "RTL", "Persian", "Vazirmatn" | check the last-updated date |

## 3. Accessible primitives and app libraries
| Name | License | Why |
|---|---|---|
| Headless UI (https://headlessui.com) | MIT | accessible unstyled menus, dialogs, listboxes for React/Vue |
| Radix UI (https://www.radix-ui.com) | MIT | the engine behind shadcn; `DirectionProvider` flips arrow-key behavior for RTL |
| Mantine (https://mantine.dev) | MIT | React; best built-in RTL (`DirectionProvider`); date pickers are Gregorian → use react-multi-date-picker for Jalali |
| react-multi-date-picker (https://github.com/shahabyazdi/react-multi-date-picker) | MIT | Jalali + Gregorian, ranges |
| @persian-tools/persian-tools (https://github.com/persian-tools/persian-tools) | MIT | digits, number-to-words, national ID, Sheba, bank card, operator detection |

## 4. Paid kits and marketplaces ⏱
| Name | URL | Price & license | Stack | RTL | Verdict |
|---|---|---|---|---|---|
| **Tailwind Plus** (formerly Tailwind UI) | https://tailwindcss.com/plus | **$299 personal / $979 team (≤ 25 people), one-time, lifetime updates** (verified 2026-10-14; report said $999 team) | Tailwind v4 HTML, React, Vue, Catalyst, templates | logical properties | best overall investment for Tailwind developers |
| **Flux UI Pro** | https://fluxui.dev | **$149 per project / $299 unlimited / $799 team, one-time** (verified 2026-10-14) | Laravel Livewire + Tailwind v4 | logical classes; date picker needs work | must-buy for Livewire apps |
| Preline Pro | https://preline.co/pro | ~$129–299 one-time, unlimited projects | Tailwind v4, HTML/React/Vue, 780+ blocks | **first-class RTL** | top pick for Persian Blade apps |
| Cruip | https://cruip.com | ~$49 single / $99–149 bundle | Tailwind v4, HTML/Alpine, React, Vue | partial (audit left/right) | best value SaaS + Mosaic admin |
| Lexington Themes | https://lexingtonthemes.com | ~$99 single / $199–299 bundle | Tailwind + Astro (portable to Blade) | swap physical utilities | design-forward marketing |
| KeenThemes Metronic 9 | https://keenthemes.com | ~$49–69 (via ThemeForest) | Tailwind v4 / Bootstrap 5; Laravel starter | **dedicated RTL build** | heavyweight enterprise admin |
| UI8 | https://ui8.net | ~$18–148 per item or ~$238/yr | mostly Figma kits, 3D, icons | rarely native | visual foundations only |
| Creative Tim | https://www.creative-tim.com | ~$69–149 | Tailwind/Bootstrap, Laravel kits | select items | audit DOM quality first |
| Framer / Webflow marketplaces | https://www.framer.com/marketplace · https://webflow.com/templates | ~$49–149 single project | hosted no-code; no Laravel export | Webflow OK, Framer limited | marketing-only sites |
| ThemeForest | https://themeforest.net | $19–89; Regular license = one end product, **no paid-access SaaS without the Extended (~$1000+) license** | mixed | mixed | generally avoid for modern apps |

**Paying from Iran** ⏱: international cards don't work. The report mentions intermediaries such as Iranicard, or crypto, for international purchases. Domestic marketplaces (§5) accept Shetab cards.

## 5. Persian marketplaces and fonts ⏱
| Name | URL | What | Price & license | Notes |
|---|---|---|---|---|
| Zhaket (ژاکت) | https://www.zhaket.com | largest Iranian WordPress/WooCommerce marketplace; free themes too | ~300k–2.9M Toman; single-domain license, often ionCube-locked ("Zhaket Guard") | encryption blocks code audits and PHP upgrades |
| Rastchin / RTL-Theme (راست‌چین) | https://www.rtl-theme.com | WP themes, **HTML/Tailwind and Laravel admin templates**, UI kits | ~250k–2.5M Toman; per-domain | strong for RTL HTML/Laravel dashboards |
| Mihan WordPress — Ahura | https://mihanwp.com | native Persian WP theme | ~600k–1.9M Toman; single domain | clean native RTL code |
| DesignCore — Bakala | https://designcore.shop | Digikala-style WooCommerce theme | ~1.2–2.5M Toman | large Persian stores on WP |
| UniWoodMart | https://uniwoodmart.ir | Persianized WoodMart bundle | ~498k–1.8M Toman | **bundles 100+ unlicensed commercial fonts — remove them** |
| **Fontiran** (فونت‌ایران) | https://fontiran.com | official commercial Persian fonts (IRANSansX, Yekan Bakh, Dana, Peyda, Morabba…) | packages ~498k–898k Toman; web license **~400k (personal) / 2.5M (corporate) / 9.5M (holding) Toman per domain** | the legal source inside Iran; enforces licenses |
| Noon Font | https://noonfont.com | Iranian type designers sold internationally (Yekan Bakh, Ravi, Abar…) | ~€69–139+ per family | legal channel for buyers outside Iran |
| Iconly Pro | https://iconly.pro | icon system used by many Iranian teams | ~$60–120/yr | rounded style matches Persian geometric fonts |
| Ali Sarshad RTL kits | https://asarshad.gumroad.com | Persian RTL Figma kits (Flowbite RTL ~$10, Material 3 RTL) | Gumroad, USD (verified 2026-10-14) | design files, not code |
| **Vazirmatn** | https://github.com/rastikerdar/vazirmatn | the free Persian UI font | **SIL OFL 1.1 — free commercial use**; npm `@fontsource-variable/vazirmatn` (OFL-1.1, v5.3.0 on 2026-10-14) | the default |
| Estedad | https://github.com/aminabedi68/Estedad | free geometric Persian font | SIL OFL 1.1 | alternative display/body |
| Lalezar, Amiri, Noto Naskh Arabic | Google Fonts (download and self-host) | display / Naskh text fonts | OFL | campaigns, literary sites |

**Font licensing rule:** a template that "includes 30 Persian fonts" almost certainly redistributes commercial fonts illegally. Delete the bundled `/fonts` folder and use Vazirmatn/Estedad, or buy a Fontiran web license for the domain.

## 6. How to evaluate a template (8-point test on the live demo) `[Proven]`
1. **RTL:** in DevTools, set `dir="rtl"` on `<html>`. Pass if the sidebar flips, spacing mirrors and nothing overlaps. Fail if it uses `ml-`/`mr-`/`left-`/`text-left`.
2. **Persian typography:** inject `font-family: Vazirmatn; line-height: 1.7` on `body`. Badges, table rows and buttons must not clip dots or descenders.
3. **Tailwind version:** v4 (`@theme` in CSS) or clean v3.4. Reject 4,000-line `@apply` files.
4. **Keyboard:** open a modal and dropdown with the keyboard only. Focus must be trapped, Esc must close, and focus must return to the trigger.
5. **Performance:** Lighthouse mobile ≥ 80 (≥ 90 preferred), run outside the marketplace iframe; no jQuery or 15+ plugins.
6. **Framework fit:** for Livewire, interactive parts must be Alpine-based or re-initializable after DOM morphs.
7. **Dark mode:** driven by tokens or `dark:` pairs, not duplicate HTML files.
8. **License:** confirm it allows your use: client project, SaaS with paying users, number of domains. MIT/OFL are simplest.

## 7. Red flags
- The marketplace preview iframe hides `100vh` bugs and slow mobile scrolling — open the demo outside the frame.
- Beautiful but fake components (date pickers and tables with no JS behind them).
- `w-[423px]`, `left-[24px]`, `float-left` everywhere — breaks on longer Persian strings and in RTL.
- Directional icons not flipped in RTL, or clocks and checkmarks flipped.
- No update in 9–12+ months; Tailwind v2 / early v3, React 17, jQuery.
- Encrypted (ionCube) PHP you can't audit; bundled pirated fonts.
- Missing dark mode, low-contrast gray-on-gray text.

## 8. Excluded or unreliable sources
- **Nulled/pirated repositories** (e.g. PluginYab, Telegram "free premium theme/font" channels): malware risk, broken updates, legal exposure. Never recommend them.
- **FarsiUI** (https://farsiui.ir): ❓ the site is live and claims 500+ Persian components, but no license was shown on the homepage on 2026-10-14. Verify license and maintenance before use.
- **next-persian-fonts**, **"VSCode Persian Copilot"**: ❓ not found on 2026-10-14 — don't recommend.
- **Sonnat UI**: MIT but **archived (2024-06-18, verified)** — reference only, don't build new projects on it.

## 9. License glossary (plain words)
| License | Meaning |
|---|---|
| MIT / Apache-2.0 | free for any use including commercial; keep the license notice |
| SIL OFL 1.1 (fonts) | free to use, embed and self-host commercially; you can't sell the font itself |
| CC BY 4.0 | free, including commercial, but you must credit the author |
| "Personal / single project" | one end product; a second client or site needs another license |
| Envato Regular vs Extended | Regular: one end product, users can't be charged for access; Extended: allowed but costs ~$1000+ |
| Per-domain (Persian marketplaces, Fontiran) | locked to one domain; a new domain needs a new license |
