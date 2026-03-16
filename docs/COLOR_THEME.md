# Website Color Theme Documentation

## Source of truth

This theme documentation is based on the promoter dashboard UI, which is the reference implementation for the product theme.

Primary references:

- [src/index.css](C:\Users\COBUY\Desktop\project\frontend-mapmyparty\src\index.css)
- [src/pages/PromoterDashboard.jsx](C:\Users\COBUY\Desktop\project\frontend-mapmyparty\src\pages\PromoterDashboard.jsx)
- [src/components/promoter/PromoterOverview.jsx](C:\Users\COBUY\Desktop\project\frontend-mapmyparty\src\components\promoter\PromoterOverview.jsx)

## Theme identity

Theme name: `Crimson Glass`

Visual direction:

- Dark premium base
- Plum and mulberry primary surfaces
- Antique gold accent
- Frosted glass cards and overlays
- Soft text contrast instead of pure white everywhere

## Core palette

These values are defined in `src/index.css` as the main design tokens.

### Base colors

- Background: `#0F0A13`
- Foreground: `#F2EEF5`
- Card: `#1B1222`
- Card foreground: `#F2EEF5`
- Popover: `#1B1222`
- Popover foreground: `#F2EEF5`

### Brand colors

- Primary: `#48285D`
  Use for primary buttons, active states, strong branded surfaces.

- Secondary: `#772256`
  Use for secondary emphasis, strong highlights, tinted action surfaces.

- Accent: `#C99774`
  Use for badges, highlights, focus rings, important small accents.

### Supporting colors

- Muted: dark plum-muted surface from token `--muted`
- Muted foreground: `#B9AEC4`
- Border: same family as primary, token `--border`
- Input: same family as primary, token `--input`
- Ring: antique gold, token `--ring`

### Functional colors

- Destructive: token `--destructive`
- Success: token `--success`

Do not replace the brand palette with random blue, green, or pure white CTA colors unless the state is explicitly semantic.

## Typography

Typography is also part of the theme.

### Font families

- Primary UI font: `Josefin Sans`
- Display/supporting font available: `League Gothic`
- Additional support font available: `League Spartan`

### Typography rules

- Default body text uses `Josefin Sans`
- Headings also use `Josefin Sans`
- Use muted text for secondary descriptions instead of lowering clarity too much
- Avoid black text on white surfaces in themed dashboards and product shells

## Token usage

Use theme tokens instead of hardcoded colors whenever possible.

Recommended classes:

- `bg-background`
- `text-foreground`
- `bg-card`
- `text-card-foreground`
- `border-border`
- `bg-primary`
- `text-primary-foreground`
- `bg-secondary`
- `text-secondary-foreground`
- `bg-accent`
- `text-accent-foreground`
- `text-muted-foreground`

## Reference component patterns

These are the patterns used by the promoter dashboard and should be reused across the product.

### App shell

- Root shell: `bg-background text-foreground`
- Sidebar: `bg-sidebar border-sidebar-border/60`
- Sticky top bar: `bg-card/70 backdrop-blur border-border/60`

### Cards

Preferred dashboard card treatment:

- `bg-white/5 border-white/10`
- Backed by theme overrides inside `.dashboard-theme`
- This resolves visually to card-toned glass, not literal white blocks

### Buttons

Primary button:

- `bg-primary text-primary-foreground hover:bg-primary/90`

Secondary/emphasis button:

- `bg-secondary text-secondary-foreground hover:bg-secondary/80`

Outline button:

- `border-border/60 text-foreground/80 hover:bg-muted`

Accent-only usage:

- Use for indicators, chips, focus rings, and selective highlights
- Do not overuse accent as full-page background

### Text hierarchy

- Main text: `text-foreground`
- Secondary text: `text-muted-foreground`
- Tertiary text: lower-opacity muted variants only where necessary
- Avoid pure white plus hardcoded gray combinations if token versions exist

### Borders

- Prefer `border-border` or `border-border/60`
- For glass cards, use `border-white/10` only when inside a themed scope that remaps it correctly

## Themed scopes in the codebase

The project currently uses theme scopes to normalize legacy classes.

Important scopes:

- `.promoter-theme`
- `.dashboard-theme`
- `.app-theme`
- `.organizer-dashboard-theme`
- `.event-detail-theme`

When updating an older page with many hardcoded colors, it is acceptable to use a scoped theme wrapper first, then gradually migrate classes to token-based styling.

## Implementation rules

### Do

- Use `bg-background` for page shells
- Use `bg-card` or glass-card patterns for panels
- Use `text-foreground` and `text-muted-foreground` for text hierarchy
- Use `bg-primary` for primary CTAs
- Use `bg-secondary` only for alternate emphasis, not as the default everywhere
- Use `bg-accent` sparingly for premium highlights
- Reuse `shadow-[var(--shadow-card)]` and `shadow-[var(--shadow-elegant)]` where appropriate

### Do not

- Do not use plain white CTA buttons in themed product pages
- Do not use bright random blues, purples, or reds outside the token set
- Do not create light-theme organizer/promoter/product pages unless explicitly requested
- Do not hardcode `bg-white text-zinc-900` for core actions
- Do not introduce competing gradients unrelated to the theme palette

## Quick mapping guide

If you see old UI colors, migrate them like this:

- `bg-white` button -> `bg-primary text-primary-foreground`
- `text-zinc-900` on CTA -> `text-primary-foreground`
- `bg-red-600` brand action -> `bg-secondary`
- `hover:bg-red-700` -> `hover:bg-secondary/80` or `hover:bg-primary/90` depending on role
- `bg-gray-900` surface -> `bg-card` or themed `bg-background`
- `text-gray-400` secondary text -> `text-muted-foreground`
- `border-gray-700/800` -> `border-border`

## Example usage

```jsx
<div className="promoter-theme dashboard-theme min-h-screen bg-background text-foreground">
  <div className="border-b border-border/60 bg-card/70 backdrop-blur">
    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
      Primary Action
    </Button>
  </div>

  <Card className="bg-white/5 border-white/10">
    <CardHeader>
      <CardTitle>Dashboard Overview</CardTitle>
      <CardDescription className="text-white/70">
        High-level summary aligned with the product theme.
      </CardDescription>
    </CardHeader>
  </Card>
</div>
```

## Enforcement note

For all new UI work, the promoter dashboard should be treated as the canonical style reference for:

- color palette
- text colors
- card treatment
- top bar treatment
- sidebar treatment
- primary and outline button styling

If a new page does not visually feel consistent with `/promoter/overview`, it is not aligned with the design system and should be corrected before completion.
