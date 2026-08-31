# DRx design system

## Product
Clinical medicine registry and practical physician manual. The interface is used during real consultations; speed, scanability, safety cues, and reliable search are more important than decoration.

## Brand tokens
```css
:root {
  --lp-brand: #1f7779;
  --lp-deep: #155f63;
  --lp-press: #0d4145;
  --lp-wash: #eaf4f1;
  --lp-ink: #0d253d;
  --lp-ink-2: #273951;
  --lp-mute: #64748d;
  --lp-canvas: #ffffff;
  --lp-canvas-soft: #f6f9fc;
  --lp-cream: #f5e9d4;
  --lp-hairline: #e3e8ee;
  --lp-hairline-input: #a8c3de;
  --status-ok: #027a48;
  --status-warn: #b54708;
  --status-stop: #b42318;
}
```

## Typography
Inter. Body copy should be compact and legible. Headings are lighter, with controlled negative tracking. Use `font-variant-numeric: tabular-nums` for doses, strengths, labs, counts, and all numeric tables.

## Shape and depth
Radius scale: 6 / 8 / 12 / 16 / 9999px. Prefer borders and surface contrast to heavy shadows. Pill radius is reserved for actions, filters, and compact chips; clinical status should remain unmistakable rather than decorative.

## Layout
- Wide clinical tables are first-class UI.
- Sticky headers and columns when useful.
- Search/filter controls stay close to the data they affect.
- Public pages use teal branding.
- Admin surfaces may use restrained indigo cues while preserving the same density and typography.
- Mobile must not horizontally overflow; tables need deliberate mobile treatment rather than simple shrink-to-fit.

## Interaction
- Minimum touch target: 44x44px.
- Keyboard-visible focus states.
- Restrained motion; no bouncy or decorative animation in clinical workflows.
- Error and risk states use semantic status tokens, not generic brand colors.

## Design reference
Use `design-md/stripe/DESIGN.md` for information density, whitespace, hierarchy, hairline borders, tables, forms, and motion restraint. Do not copy Stripe brand purple into DRx public UI.

## Quality gate
Before completion: Chromium 1440px + 390px, overflow check, touch target measurements, and WCAG AA contrast checks.
