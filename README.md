# web-ui-playbook

A self-contained [Claude Code](https://claude.com/claude-code) skill that lets Claude design and build professional web interfaces for people with no design background. It is tuned for **Laravel + Tailwind CSS v4** and for **Persian (Farsi) / RTL** sites used **inside Iran**.

What it does, every time:
1. Asks up to 6 short questions: audience, goal, feel, language, devices, and whether users are inside Iran.
2. Picks one of 8 style directions and names 1–2 real reference sites with the exact pattern to borrow.
3. Defines design tokens (colors, type, spacing, radius, shadows) before writing markup.
4. Builds the page with tested component specs and page patterns.
5. Applies the Persian/RTL and Iran rules automatically when relevant:
   - Vazirmatn font, Persian digits, ZWNJ, bidi isolation
   - Jalali dates, Toman prices, SMS-OTP login, Shaparak, eNamad
   - no foreign CDNs
6. Audits its own output with `scripts/audit.mjs`, fixes the problems, and reports what it fixed plus the placeholders you need to fill.

## Install

Requires [Claude Code](https://claude.com/claude-code). Node.js 18+ is needed for the audit and preview scripts.

**Option A — as a plugin (recommended, easy updates).** Inside Claude Code, run:

```
/plugin marketplace add jpedy/web-ui-playbook
/plugin install web-ui-playbook@web-ui-playbook
```

Update later with `/plugin marketplace update web-ui-playbook`.

**Option B — as a plain personal skill.** Copy the skill folder into your skills directory:

```bash
git clone https://github.com/jpedy/web-ui-playbook.git
cp -r web-ui-playbook/skills/web-ui-playbook ~/.claude/skills/
```

On Windows, `~` is `C:\Users\<you>`. Use only one option, so the skill isn't loaded twice.

## Use

Just ask Claude Code for UI work — the skill activates on its own. Or start your message with `/web-ui-playbook`.

- "Build a Persian landing page for my English language school; users are in Iran."
- "Make an admin dashboard for my Laravel shop."
- "Review `resources/views/welcome.blade.php` and fix the design."
- "Which UI kit should I use for a Persian admin panel? Budget about $100."

Run the checker yourself on any folder (from a clone of this repo):

```bash
node skills/web-ui-playbook/scripts/audit.mjs path/to/resources/views --iran
```

## Repository layout

```
.claude-plugin/
  plugin.json          plugin manifest
  marketplace.json     lets `/plugin marketplace add jpedy/web-ui-playbook` work
skills/web-ui-playbook/
  SKILL.md             workflow, intake questions, project-type decision table, rules, reference map
  references/          design foundations, 8 style directions, component specs, page patterns,
                       accessibility, Persian/RTL, Iran market + network rules, Laravel/Tailwind setup,
                       curated examples, templates/licenses, review checklist
  assets/              Tailwind v4 token starter, Persian base CSS, Persian helpers (JS + Laravel PHP)
  scripts/             audit.mjs (zero-dependency checker), serve.mjs (local preview), test fixture
```

## Notes

- Built from seven deep-research reports dated **October 2026**. Facts about services, providers, prices, licenses and regulations are marked "verify before relying".
- `assets/PersianHelpers.php` is a port of the tested JS helpers but has **not** been run.
- Recommendations point to real, licensed resources only; pirated "nulled" themes and fonts are explicitly excluded.

## License

[MIT](LICENSE) © 2026 jpedy
