# Decision table — industry → recipes and fonts

The default choices in `scripts/lib/brief.mjs` (`DECISION`). They are starting points: the user's own preference always wins. Sources: Version 1.2 logo research report §7 (personality and business tables), adjusted to the bundled fonts and the eight recipes; [Opinion] where the table is this skill's choice.

| `industry` | Container (direction A) | Symbols, ranked (B uses the first) | Persian font | Latin font | Why |
|---|---|---|---|---|---|
| `education` | R1 monogram | R3 book+bubble, R6 arrow, R2 rings | `vazirmatn-black` | `plus-jakarta-sans:800` | clear and friendly; "learn to speak" |
| `kids` | R1 | R3, R7 cube, R2 | `estedad:800` | `plus-jakarta-sans:800` | round, wide, playful but legible |
| `finance` | R4 shield | R2, R6, R7 | `vazirmatn-extrabold` | `inter:700` | stable, restrained, trustworthy |
| `government` | R4 | R2, R6 | `vazirmatn-bold` | `inter:700` | sober; no state emblems ever (legal-iran.md §3) |
| `health` | R4 | R2, R6 | `sahel-bold` | `inter:700` | calm and clean; avoid red crosses/crescents |
| `legal` | R4 | R2, R6 | `parastoo-bold` | `lora:700` | Naskh + serif: tradition, documents |
| `saas` | R1 | R7, R6, R2 | `vazirmatn-black` | `inter:800` | neutral, technical |
| `ecommerce` | R1 | R6, R7, R2 | `estedad:800` | `plus-jakarta-sans:800` | friendly, works as app icon |
| `food` | R1 | R2, R6 | `estedad:900` | `plus-jakarta-sans:800` | bold and warm — or a human-made mark (logo-fundamentals.md §6) |
| `culture` | R5 taaq arch | R8 shamsa, R2 | `noto-naskh:700` | `lora:700` | heritage forms, only because the subject is cultural |
| `luxury` | R5 | R8, R2 | `parastoo-bold` | `lora:600` | restrained serif pairing |
| `travel` | R5 | R6, R2 | `estedad:800` | `plus-jakarta-sans:800` | arch = gateway; arrow = journey |
| anything else | R1 | R6, R2, R7 | `vazirmatn-black` | `inter:800` | safe neutral default |

Direction C is always the wordmark-led option: the Persian name with one accent-colored letter dot, and R1 with the same accent dot as the icon.

## Personality adjustments [Opinion]
| The user says | Change |
|---|---|
| "modern", "tech" | keep defaults; `inter` for Latin |
| "friendly", "for families" | `estedad:800` + `plus-jakarta-sans:800` |
| "premium", "classic" | `parastoo-bold` or `noto-naskh:700` + `lora:600`; fewer colors (primary + ink only) |
| "academic", "serious" | `noto-naskh:700` + `lora:700`; R4 container |
| "bold", "street", "playful" | `estedad:900`; consider a human designer for a custom display wordmark |

Set these in the brief (`"fonts": {"fa": "…", "en": "…"}`); `industry` only sets the defaults.

## Common mistakes
- Using R5/R8 for an unrelated business because it "looks Iranian".
- Shield for every "trust" brand — check the wordmark carries the identity.
- Overriding the user's stated preference with the table.
