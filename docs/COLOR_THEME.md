# MapMyParty Color Theme Guide

The app supports Light and Dark themes. Light is the default, regardless of OS preference. The light palette comes from the `light` branch; the dark palette and application structure come from `main`.

## Theme Selection

- The existing `next-themes` provider applies `light` or `dark` to the HTML element and sets the browser color scheme.
- `mapmyparty-theme` stores the selection in local storage and synchronizes open tabs. Visitors and signed-in users share the same browser preference; login/logout does not reset it. There is no account or cross-device synchronization.
- Missing or invalid values use light. When storage is blocked, switching still works for the current session.
- The HTML bootstrap restores the palette before React renders. The provider sits above routes and toasts so switching does not remount page content.
- Use the shared `ThemeToggle` in public, attendee, organizer, and promoter navigation. Auth, reset, checkout, onboarding, and event analytics also expose it directly; public pages have a footer control.

## Light Palette

| Role | Color | Utility |
| --- | --- | --- |
| Canvas, card, popover | #FFFFFF | bg-background, bg-card, bg-popover |
| Subtle surface | #F8F9FC | bg-surface, bg-muted |
| Brand highlight | #A259C9 | text-primary, border-primary |
| Primary action / link | #8438B0 | bg-primaryCTA, text-accent-foreground |
| Action hover / active | #732F9B / #622783 | bg-primaryCTA-hover / active |
| Soft purple | #F3E8FF | bg-secondary, bg-accent |
| Primary text | #111827 | text-foreground |
| Secondary text | #4B5563 | text-muted-foreground |
| Metadata | #6B7280 | text-subtle |
| Decorative border | #E5E7EB | border-border |
| Input boundary | #6B7280 | border-input |
| Success / warning / error / info | #166534 / #92400E / #B91C1C / #1E40AF | Semantic status utilities |

Use the deeper CTA color for normal-size white button labels. The footer uses the reference inverse palette; media overlays and QR surfaces retain their required contrast.

## Applying Colors

Prefer shared tokens, which switch automatically. Existing hardcoded dark utilities have narrowly scoped `light:` variants carrying the reference colors. Preserve state modifiers, for example `light:data-[state=checked]:bg-primaryCTA`. Legacy dark compatibility rules apply only under `html.dark`; do not add global overrides for white text or black backgrounds.

Keep layout, typography, behavior, and media independent of theme. Charts use CSS variables for changing series, labels, grids, and tracks while retaining distinct comparison colors.

## Verification

Run `npm run lint`, `npm run build`, and, with Vite running on port 8080, `node scripts/theme-smoke.mjs` and `node scripts/landing-navbar-smoke.mjs`. Theme smoke checks use isolated Chrome and local API fixtures for role screens; those checks do not verify a live authenticated backend or payment flow.

Source snapshots for this migration: main `9e0184097c04a2efdada2d31d7b033e8b4d07d97`, light `a83bb016782e238b16f543d0d833849958a3fa59`.

## Source Of Truth

- Theme tokens: `src/index.css`
- Tailwind token mapping: `tailwind.config.ts`
- Button variants: `src/components/ui/button.jsx`

When possible, use tokens and shared components instead of hardcoded hex classes.

## Dark Theme Identity

- Base mood: dark, premium, event-night UI
- Main brand color: Midnight Plum
- Supporting brand color: Royal Mulberry
- Highlight color: Antique Gold
- Surfaces: dark plum cards and glassy panels
- Red usage: only for destructive, error, or urgent status states

## Dark Core Palette

| Role | Token / class | HSL | Hex | Use |
| --- | --- | --- | --- | --- |
| Page background | `--background`, `bg-background` | `275 31% 6%` | `#0F0A13` | Main app/page shell |
| Main text | `--foreground`, `text-foreground` | `274 26% 95%` | `#F2EEF5` | Primary readable text |
| Card surface | `--card`, `bg-card` | `274 31% 10%` | `#1B1222` | Panels, cards, modal bodies |
| Primary / CTA | `--primary`, `bg-primaryCTA` | `276 40% 26%` | `#48285D` | Main action buttons and selected states |
| Primary hover | `--primary-cta-hover`, `hover:bg-primaryCTA-hover` | `276 40% 32%` | `#583172` | Hover state for primary CTAs |
| Primary active | `--primary-cta-active`, `active:bg-primaryCTA-active` | `276 40% 21%` | `#3A204B` | Pressed state for primary CTAs |
| Secondary brand | `--secondary`, `bg-secondary` | `323 56% 30%` | `#772256` | Secondary emphasis, tabs, active menu surfaces |
| Muted surface | `--muted`, `bg-muted` | `275 20% 18%` | `#2F2537` | Soft inactive backgrounds |
| Muted text | `--muted-foreground`, `text-muted-foreground` | `270 16% 73%` | `#B9AEC4` | Helper text, descriptions, metadata |
| Accent / ring | `--accent`, `bg-accent`, `ring-ring` | `25 44% 62%` | `#C99774` | Premium highlight, focus ring, small badges |
| Border / input | `--border`, `--input`, `border-border` | `276 40% 26%` | `#48285D` | Lines, dividers, field borders |
| Destructive | `--destructive`, `bg-destructive` | `0 100% 60%` | `#FF3333` | Delete, cancel, error only |
| Success | `--success` | `155 100% 60%` | `#33FFAA` | Success status only |

## Button Colors

Use the shared `Button` component first.

| Button role | Preferred usage | Color behavior |
| --- | --- | --- |
| Primary action | `<Button>` or `variant="primaryCTA"` | `bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active` |
| Accent action | `variant="accent"` | Same primary CTA colors, stronger weight/shadow |
| Secondary action | `variant="secondary"` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| Outline action | `variant="outline"` | `border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| Ghost action | `variant="ghost"` | Transparent base, accent hover. Use for nav/icon/low-priority controls |
| Destructive action | `variant="destructive"` | Use only for delete, remove, cancel, reject, or danger states |

Do not create new primary button colors per page. If a button is the main action, it should resolve to the primary CTA token set.

## Lines, Borders, And Dividers

Default line color:

- Use `border-border`, `border-border/60`, or `border-border/40`.
- Use `border-input` for form fields.
- Use `ring-ring` or `focus-visible:ring-ring` for focus states.

Card and panel lines:

- Standard cards: `bg-card border-border/50`
- Glass panels: `bg-card/70 border-border/40 backdrop-blur`
- Existing helper: `theme-card`

Avoid:

- Raw `border-gray-*` for new themed product UI
- Random red borders except semantic error/destructive states
- Pure white borders above low-opacity values like `border-white/10`

## Surface Rules

- Page shell: `bg-background text-foreground`
- Card/panel: `bg-card text-card-foreground border-border/50`
- Muted blocks: `bg-muted/50 text-muted-foreground`
- Popovers/modals: `bg-popover text-popover-foreground border-border`
- Sidebar: `bg-sidebar text-sidebar-foreground border-sidebar-border`

Use opacity for depth instead of introducing new colors:

- Strong panel: `bg-card`
- Soft panel: `bg-card/80`
- Glass panel: `bg-card/60 backdrop-blur`
- Divider: `border-border/40`

## Gradients And Highlights

The theme has a controlled violet gradient token:

- `theme-gradient-primary`
- `--gradient-primary`
- `--color-accent-primary: #7c3aed`
- `--color-accent-secondary: #a855f7`

Use this only for special branded highlights, small visual emphasis, or existing page sections that already use it. Do not use it as the default page background or for every card.

## New UI Checklist

- Use `bg-background`, `bg-card`, `text-foreground`, and `text-muted-foreground`.
- Use `Button` variants instead of page-specific CTA colors.
- Use `bg-primaryCTA` for the main action.
- Use `border-border` and opacity modifiers for all lines.
- Keep Antique Gold accents small and intentional.
- Keep red only for destructive/error states.
- Do not introduce unrelated blue, green, orange, or pure white action colors.
