# DESIGN.md

## Color strategy

**Drenched, two-world structure.** The page alternates between two full-bleed worlds, like turning the pages of an engraved invitation:

- **Olive night** (hero, countdown numbers backdrop, footer): deep olive green, drenched.
- **Ivory day** (details, RSVP form): warm candlelit ivory.

Tokens (OKLCH first, hex fallback):

| Token | OKLCH | Hex approx | Use |
|---|---|---|---|
| `--olive-950` | oklch(0.28 0.03 130) | `#2c3126` | hero base |
| `--olive-900` | oklch(0.33 0.035 130) | `#383e2f` | vignette center, footer |
| `--olive-700` | oklch(0.45 0.04 128) | `#57604a` | buttons on ivory, borders |
| `--ivory-50` | oklch(0.955 0.012 90) | `#f4efe4` | day sections base |
| `--ivory-100` | oklch(0.93 0.015 90) | `#ece5d5` | subtle section alternation |
| `--cream-text` | oklch(0.92 0.02 95) | `#e9e2cf` | text on olive |
| `--cream-dim` | oklch(0.80 0.02 100) | `#c4bda6` | secondary text on olive |
| `--ink` | oklch(0.36 0.03 125) | `#3f4434` | text on ivory |
| `--ink-soft` | oklch(0.50 0.025 120) | `#6b705c` | secondary text on ivory |
| `--brass` | oklch(0.68 0.06 95) | `#a89a6f` | hairline rules, focus rings, tiny accents only |

No pure black/white anywhere. All neutrals tinted toward olive/warm hue.

## Typography

- **EN display/serif**: Marcellus (inscriptional roman, single weight). Dates, headings, labels in letter-spaced uppercase (tracking 0.18–0.3em, small sizes).
- **EN script**: Great Vibes, only for the couple's names.
- **AR display**: Aref Ruqaa for the couple's names (calligraphic); Amiri for headings/dates.
- **AR body/UI**: Tajawal (300/400/500/700).
- Scale contrast ≥1.25 between steps; names are the single largest element on the page (clamp ~3rem to 5.5rem).
- Numerals: countdown uses tabular layout, localized digits per locale (Arabic-Indic in ar).

## Elevation & texture

- No drop shadows on the invitation. Depth via color worlds + a soft radial vignette in the hero (lighter olive center glow).
- Hairline rules (`1px`, brass at 35% opacity) as section ornaments, with a small centered diamond/leaf glyph.
- Ivory sections carry a barely-there paper grain (CSS repeating noise via SVG, opacity ≤0.04).

## Components

- **Buttons**: rectangular, letter-spaced uppercase (EN) / medium Tajawal (AR), 1px border, transparent or low-alpha fill; hero RSVP button is cream-outline on olive; on ivory, solid `--olive-700` with cream text. Min touch target 48px.
- **Inputs**: underline style (1px bottom border, ink-soft), floating small uppercase labels, ≥16px font, generous vertical rhythm; focus = brass underline thickening to 2px. No boxed gray inputs.
- **Attendance choice**: two full-width stacked options styled like invitation reply cards; selected = olive fill with cream text.
- **Dashboard** (product surface inside a brand project): same palette on ivory background, ink text, olive primary buttons; data table becomes stacked cards under 640px; status chips: confirmed = olive fill, declined = muted clay `oklch(0.55 0.06 40)`, pending = outlined.
- **Motion**: scroll-reveal fade+rise 12px, 600ms ease-out-quint, once; countdown digits flip without layout shift; no parallax, no scroll-jacking.
