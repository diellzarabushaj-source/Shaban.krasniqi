# Design stack precedence

For UI tasks use these sources in this order:

1. Existing application tokens/components/tests — highest authority.
2. `.superdesign/design-system.md` — project-specific design system.
3. `design-md/stripe/DESIGN.md` — visual reference, not a license to copy Stripe product UI.
4. Impeccable rules — critique/polish/accessibility quality floor.
5. SuperDesign — exploration and design-system-aware iteration.

Rules:
- Never replace project teal branding with Stripe purple simply because Stripe is the reference.
- Use Stripe for density, hierarchy, hairlines, whitespace, table/form discipline, and restrained motion.
- Do not introduce a second token system.
- Before declaring a UI task complete, verify 1440px + 390px, horizontal overflow, >=44px touch targets, and WCAG AA text contrast.
