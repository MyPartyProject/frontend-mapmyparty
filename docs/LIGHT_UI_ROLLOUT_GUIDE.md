# Light UI Rollout Guide

## Purpose

This guide documents the light UI direction currently tested on the landing page only. Use it before applying the new `#f3deff` theme to attendee, organizer, or other existing pages.

The goal is consistency: every converted page should use the same token roles, contrast rules, surfaces, shadows, and overlay behavior instead of one-off page colors.

## Current Source Of Truth

- Landing light theme tokens: `src/index.css`, `.landing-homepage`
- Landing route/page wrapper: `src/landing/LandingPage.jsx`
- Landing navbar treatment: `src/components/Header.jsx`
- Tailwind token mapping: `tailwind.config.ts`
- Shared buttons: `src/components/ui/button.jsx`

Do not copy raw colors across pages unless a token does not exist yet. Prefer `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, and shared button variants.

## Theme Identity

- Base mood: soft premium event UI, light and readable
- Primary page background: `#f3deff`
- Text style: high-contrast plum text on light lavender surfaces
- Surfaces: white or near-white cards with soft lavender borders
- Brand accents: Royal Mulberry and Antique Gold, used intentionally
- Motion and overlays: subtle, not blurry or washed out

## Token Roles

These roles are currently scoped to `.landing-homepage`.

| Role | Token / class | Value | Use |
| --- | --- | --- | --- |
| Page background | `--background`, `bg-background` | `278 100% 94%`, `#f3deff` | Main page shell and section backgrounds |
| Primary text | `--foreground`, `text-foreground` | Dark plum | Headings, nav links, body text that must be fully readable |
| Card surface | `--card`, `bg-card` | White | Cards, panels, popovers, elevated controls |
| Muted surface | `--muted`, `bg-muted` | Pale lavender | Soft inactive surfaces and subtle hovers |
| Muted text | `--muted-foreground`, `text-muted-foreground` | Medium plum-gray | Helper text, metadata, secondary labels |
| Primary CTA | `--primary`, `bg-primaryCTA` | Midnight Plum | Main actions and selected states |
| Secondary accent | `--secondary`, `bg-secondary` | Royal Mulberry | Brand emphasis and supporting highlights |
| Accent | `--accent`, `text-accent`, `bg-accent` | Darkened Antique Gold | Small highlights, icons, hover emphasis |
| Border | `--border`, `border-border` | Soft lavender | Dividers, card borders, field borders |
| Focus ring | `--ring`, `ring-ring` | Midnight Plum | Keyboard focus and active input states |

## Layout Rules

- Page wrappers should use `bg-background text-foreground`.
- Each converted page should have one scoped theme wrapper before deep component changes.
- Avoid applying the light variables globally until the whole product is ready.
- Keep page sections visually connected with `bg-background`; use cards for grouping content.
- Use spacing and border radius consistently with existing landing page cards: rounded `1.25rem` to `2rem` for major panels.

## Navbar Rules

The landing navbar uses a readable light glass surface:

- Surface: `bg-background/92`
- Text: `text-foreground`
- Link weight: `font-semibold`
- Border: `border-border/45`
- Controls: `bg-card/90 border-border/45`
- Backdrop blur: small and functional, not decorative

Do not place low-contrast muted nav text directly over media. If a header overlaps an image or video, make the header surface opaque enough for the text to pass visual review.

## Hero And Media Rules

Hero media should remain clear. Gradients are for readability and transitions, not for hiding the image.

Use:

- A light horizontal readability fade near the text side.
- A small top fade if the navbar overlaps media.
- A bottom fade into `bg-background`.
- Small low-opacity decorative haze only when it does not cover the subject.

Avoid:

- Full-screen brand gradient overlays.
- Multiple stacked full-hero gradients.
- Large `blur-3xl` blobs over the center of the image.
- High opacity overlays that make photos look foggy or blurry.

Recommended overlay strength:

- Horizontal overlay: around `from-background/40` to `from-background/50`.
- Middle overlay: around `via-background/10` to `via-background/20`.
- Bottom transition: no stronger than needed to blend into the section background.
- Decorative gradient blobs: around `opacity-[0.08]` to `opacity-10`.

## Card And Panel Rules

Use tokenized surfaces:

- Standard card: `bg-card border-border/50 shadow-[var(--shadow-card)]`
- Soft card: `bg-card/70 border-border/40`
- Strong control/popover: `bg-card/90` or `bg-card/95`
- Nested subtle block: `bg-background/45 border-border/40`

Avoid dark-theme leftovers:

- `bg-[#050510]`
- `bg-[#040712]`
- `bg-[#0b1220]`
- `bg-black/*`
- `bg-white/5` used as a dark glass surface
- `border-white/10`

When migrating a card, change the surface, border, text, and hover state together. Partial migration often creates low contrast.

## Text Rules

Use high contrast by default:

- Headings: `text-foreground`
- Primary labels: `text-foreground`
- Body copy: `text-foreground` or `text-foreground/80`
- Metadata/help text: `text-muted-foreground`
- Links and small highlights: `text-accent` or `hover:text-accent`

Avoid:

- `text-white`
- `text-white/80`
- `text-white/70`
- `text-gray-300`
- `text-gray-400`

Those classes were readable on the dark theme but can become invisible or visually weak on `#f3deff`.

## Button Rules

Use the shared `Button` component first.

- Main action: default `Button`, `variant="primaryCTA"`, or `variant="accent"`
- Secondary action: `variant="secondary"` or tokenized outline/ghost
- Header controls: `bg-card/90 border-border/45 text-foreground`
- Destructive action: `variant="destructive"` only for delete, reject, cancel, or errors

Do not introduce page-specific CTA colors. If a new button color is needed, add a token first.

## Forms, Modals, And Tables

Forms:

- Inputs should use `bg-background/60` or `bg-card`.
- Borders should use `border-border/50` or `border-input`.
- Focus should use `ring-ring` or `focus-visible:ring-ring`.

Modals and popovers:

- Use `bg-popover text-popover-foreground border-border`.
- Avoid dark modal classes like `bg-[#0e0e18] text-white`.

Tables:

- Header rows can use `bg-muted/50`.
- Body rows should use `bg-card` or transparent over `bg-background`.
- Hover rows should use `hover:bg-muted/45`.

## Migration Checklist

Use this checklist for each page before converting another attendee or organizer route.

1. Add or reuse a scoped light theme wrapper for the page.
2. Confirm the page shell uses `bg-background text-foreground`.
3. Replace hardcoded dark backgrounds with `bg-background`, `bg-card`, or `bg-muted`.
4. Replace white/gray text classes with `text-foreground` or `text-muted-foreground`.
5. Replace white borders with `border-border` opacity variants.
6. Update navbar/header surfaces separately from page content.
7. Review hero/media overlays and remove heavy full-screen gradients.
8. Convert buttons to shared variants or tokenized classes.
9. Check forms, modals, dropdowns, empty states, and loading states.
10. Verify desktop and mobile contrast before expanding rollout.

## Do / Do Not

Do:

- `bg-background text-foreground`
- `bg-card/90 border-border/45`
- `text-muted-foreground` for helper copy
- `theme-gradient-primary` for small highlights only
- `shadow-[var(--shadow-card)]`

Do not:

- `bg-[#050510] text-white`
- `border-white/10`
- `text-white/60`
- Full-screen `theme-gradient-primary` overlays
- Large central `blur-3xl` effects over photos

## Acceptance Criteria For Any Converted Page

- The page uses the light theme tokens instead of raw dark-theme hex values.
- Primary text is readable on `#f3deff` and cards.
- Navbar text is fully visible on desktop and mobile.
- Cards, popovers, and modals use light surfaces.
- Media sections keep images clear and not blurry.
- CTA and focus states are visible.
- Existing dark pages remain unchanged unless intentionally included in the rollout.
- `npm.cmd run build` passes after conversion.

