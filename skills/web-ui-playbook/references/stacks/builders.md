# Tier 3 — site builders and hosted themes (detect and warn)

Stacks: **Shopify** themes (`shopify`), and pages made in **Wix, Webflow, Elementor-only WordPress, Squarespace, Framer** (`builder`). `detect-stack.mjs` recognizes them from `layout/theme.liquid` / `config/settings_schema.json` (Shopify) and from generator tags or builder markup in saved HTML.

**Tell the user plainly, once:** this plugin can design for these platforms and check the result, but it cannot edit the platform's templates for them, guarantee right-to-left layout, or remove the platform's own scripts, fonts and CDNs. Never call these stacks supported.

## What applies
- **Design core:** direction, layout, components and states, copy, accessibility, Persian/RTL rules — as a written spec and token values the owner (or their developer) enters in the builder.
- **Colors:** `generate-palette.mjs --format css-variables` (and `palette.json`) — give the owner the hex values per role (`palette-report.md` "Tokens" table) to type into the builder's color settings; every pair is already checked.
- **Logo and icons:** the logo kit's SVG/PNG files; upload the favicon and the 512px icon in the platform's site settings (`export-kit.mjs`'s static `head-snippet.html` only helps where custom head code is allowed).
- **Fonts:** upload the self-hosted Vazirmatn / Inter files where the platform allows custom fonts; otherwise use the platform's closest font and say so.
- **Checks on the result:** open the published page in Chrome/Edge, save it ("Save page as… → Webpage, Complete"), then `node <skill>/scripts/audit.mjs saved.html --render saved.html --contrast` — contrast in light/dark, overflow and headline lines at 375/768/1440, tap targets, the no-JS view, and every foreign host the page requests or references. Only local files and local servers can be rendered.

## What does not apply
- No source audit of Liquid / builder templates (they are not readable files in the project).
- No token files the platform can import directly (⚠ not checked per platform).
- No control over the platform's own assets: builder pages load scripts, fonts and images from the platform's CDNs.

## Market Iran
Expect `render-external` / `render-foreign-ref` **errors** for the platform's own hosts — they cannot be removed from inside the builder. Before the owner commits to a builder, check whether the platform serves visitors in Iran, accepts Iranian payment gateways (Shaparak) and lets an Iranian business hold the account (⚠ not verified here — sanctions and availability change; see `iran-network-resilience.md`). A self-hosted stack (Laravel, WordPress, Next.js, static HTML) avoids the problem.

## Elementor (WordPress page builder)
The site is WordPress, so the WordPress adapter (`wordpress.md`) applies to the theme, fonts, palette (`--format wordpress` or `css-variables`) and the rendered checks; pages built in Elementor are only seen by `--render`. ⚠ Not verified here: Elementor's own font loading and global color settings — check in the rendered audit that no Google Fonts host appears.
