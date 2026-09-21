# MapMyParty Light Color Theme

The application uses one light theme regardless of operating-system preference.
White and brand purple define the identity. Amiko fonts, content, and workflow
behavior are unchanged. Sources of truth: `src/index.css`, `tailwind.config.ts`,
and `src/components/ui/button.jsx`.

## Palette

| Role | Hex | Utility |
| --- | --- | --- |
| Canvas, cards, popovers | #FFFFFF | bg-background, bg-card, bg-popover |
| Subtle section/dashboard surface | #F8F9FC | bg-surface, bg-muted |
| Brand highlight | #A259C9 | text-primary, border-primary |
| Accessible actions and links | #8438B0 | bg-primaryCTA, text-accent-foreground |
| Action hover / pressed | #732F9B / #622783 | bg-primaryCTA-hover / active |
| Soft purple | #F3E8FF | bg-secondary, bg-accent |
| Primary text | #111827 | text-foreground |
| Secondary text | #4B5563 | text-muted-foreground |
| Metadata | #6B7280 | text-subtle |
| Inverse labels | #FFFFFF | text-inverse, text-primary-foreground |
| Decorative border | #E5E7EB | border-border |
| Input boundary | #6B7280 | border-input |
| Keyboard focus | #8438B0 | ring-ring |

White text on brand purple is approximately 4.37:1; use the deeper CTA color
(approximately 6.62:1) for normal-size white labels. Brand purple remains suitable
for large headline accents. Reserve #9CA3AF for inactive decoration on light
surfaces. Metadata #6B7280 on white is approximately 4.83:1.

Tokens remain HSL channels consumed as `hsl(var(--token) / opacity)`. Do not put
hex strings into HSL-channel variables. `--primary-cta` is separate from
`--primary`; shared buttons use the accessible action color.

## Components

- Shared Button variants provide action states. Secondary buttons and badges
  use soft purple with deep-purple text. Inputs have visible borders/focus rings.
- Header and mobile navigation use white surfaces and subtle dividers.
- Landing hero: white with an 8% purple radial gradient, existing copy, and a
  separate rectangular video panel. Mobile stacks the panel below the copy.
- Event cards separate image regions from white content areas. Category/price
  pills use soft purple. Avoid light text over arbitrary photography.
- Feature blocks and dashboard canvases use subtle gray behind white panels.
- Card shadow: `0 4px 20px -2px rgba(17,24,39,0.05)`.
  Hover: `0 12px 30px -4px rgba(162,89,201,0.12)`.
- Rich text, calendars, dropdowns, dialogs, and toast portals inherit root tokens.

## Status and Charts

| Status | Foreground | Soft surface |
| --- | --- | --- |
| Success | #166534 | #F0FDF4 |
| Warning | #92400E | #FFFBEB |
| Error | #B91C1C | #FEF2F2 |
| Information | #1E40AF | #EFF6FF |

Retain status labels/icons. Charts may use distinct comparison colors; do not
collapse all series into purple. Use readable tooltip labels, neutral grid
lines, and a purple lead series. Third-party logos retain their brand colors;
uploaded event artwork is not recolored.

## Inverse Exceptions

The footer uses `theme-inverse`: #111827 background, white headings, light-gray
body/link text, and purple highlights. Media/lightboxes and modal scrims may
remain dark. Use inverse labels on dark media; never globally override
`text-white` or `bg-black`. QR codes use dark modules on white.

## Verification

Run `npm run lint` and `npm run build`. Review landing, browse/detail, auth,
checkout, and each role's dashboard at 375, 768, 1440, and 1920px. Check portal
surfaces, validation, loading/empty/error states, autofill, focus, selected and
disabled controls, OS dark preference, reduced motion, and video fallback.
Authenticated screens require an authorized local test session. A successful
build does not establish visual or production verification.
