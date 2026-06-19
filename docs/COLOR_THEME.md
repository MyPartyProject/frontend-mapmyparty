# MapMyParty Color Theme Guide

Use this file before starting any new UI implementation. The current product theme is a white-first product UI with retained MapMyParty brand accents built around Midnight Plum, Royal Mulberry, and Antique Gold.

## Source Of Truth

- Theme tokens: `src/index.css`
- Tailwind token mapping: `tailwind.config.ts`
- Button variants: `src/components/ui/button.jsx`

When possible, use tokens and shared components instead of hardcoded hex classes.

## Theme Identity

- Base mood: clean, bright, premium product UI
- Main brand color: Midnight Plum
- Supporting brand color: Royal Mulberry
- Highlight color: Antique Gold
- Surfaces: white shells, flat neutral panels, restrained borders
- Red usage: only for destructive, error, or urgent status states

## Core Palette

| Role | Token / class | HSL | Hex | Use |
| --- | --- | --- | --- | --- |
| Page background | `--background`, `bg-background` | `0 0% 100%` | `#FFFFFF` | Main app/page shell |
| Main text | `--foreground`, `text-foreground` | `270 28% 12%` | `#201627` | Primary readable text |
| Card surface | `--card`, `bg-card` | `0 0% 100%` | `#FFFFFF` | Panels, cards, modal bodies |
| Primary / CTA | `--primary`, `bg-primaryCTA` | `276 40% 26%` | `#48285D` | Main action buttons and selected states |
| Primary hover | `--primary-cta-hover`, `hover:bg-primaryCTA-hover` | `276 40% 32%` | `#583172` | Hover state for primary CTAs |
| Primary active | `--primary-cta-active`, `active:bg-primaryCTA-active` | `276 40% 21%` | `#3A204B` | Pressed state for primary CTAs |
| Secondary brand | `--secondary`, `bg-secondary` | `323 56% 30%` | `#772256` | Secondary emphasis, tabs, active menu surfaces |
| Muted surface | `--muted`, `bg-muted` | `270 25% 96%` | `#F5F1F8` | Soft panels, inactive backgrounds |
| Muted text | `--muted-foreground`, `text-muted-foreground` | `270 12% 38%` | `#665A6E` | Helper text, descriptions, metadata |
| Accent / ring | `--accent`, `bg-accent`, `ring-ring` | `25 44% 62%` | `#C99774` | Premium highlight, focus ring, small badges |
| Border / input | `--border`, `--input`, `border-border` | `270 18% 86%` | `#DED7E3` | Lines, dividers, field borders |
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

- Standard cards: `bg-card border-border/60`
- Soft panels: `bg-muted/60 border-border/60`
- Existing helper: `theme-card`

Avoid:

- Raw `border-gray-*` for new themed product UI
- Random red borders except semantic error/destructive states
- Pure white borders for standard product surfaces

## Surface Rules

- Page shell: `bg-background text-foreground`
- Card/panel: `bg-card text-card-foreground border-border/60`
- Muted blocks: `bg-muted/50 text-muted-foreground`
- Popovers/modals: `bg-popover text-popover-foreground border-border`
- Sidebar: `bg-sidebar text-sidebar-foreground border-sidebar-border`

Use borders and typography for depth instead of gradients or glow:

- Strong panel: `bg-card`
- Soft panel: `bg-muted/70`
- Light overlay: `bg-background/95`
- Divider: `border-border/40`

## New UI Checklist

- Use `bg-background`, `bg-card`, `text-foreground`, and `text-muted-foreground`.
- Use `Button` variants instead of page-specific CTA colors.
- Use `bg-primaryCTA` for the main action.
- Use `border-border` and opacity modifiers for all lines.
- Keep Antique Gold accents small and intentional.
- Keep red only for destructive/error states.
- Do not introduce gradients, glow blobs, or dark full-page backgrounds.
