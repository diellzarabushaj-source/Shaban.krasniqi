# Agent operating contract

## Project context

DRx is a clinical medicine registry for physicians in Kosovo. The primary user is a physician during a consultation, so speed and clarity beat decoration. It also acts as a practical manual for younger physicians with protocols, emergency medicine lessons, and learning material.

Declared product stack: static HTML/CSS/JS, Node functions on Vercel, Supabase. No Python in the product runtime and no self-managed application server. The owner-supplied baseline is 4,013 published medicines.

> This repository was empty when this tooling profile was added. Treat the context above as the owner-supplied operating brief; verify it against application code as the product is added.

## Design system

Do not invent a second system. Use the project's existing tokens when present. Current owner-supplied baseline:

- Brand: `--lp-brand #1f7779`, deep `#155f63`, press `#0d4145`, wash `#eaf4f1`
- Text: `--lp-ink #0d253d`, ink-2 `#273951`, mute `#64748d`
- Surface: `--lp-canvas #ffffff`, canvas-soft `#f6f9fc`, cream `#f5e9d4`
- Lines: `--lp-hairline #e3e8ee`, hairline-input `#a8c3de`
- Status: ok `#027a48`, warn `#b54708`, stop `#b42318`
- Radius: 6 / 8 / 12 / 16 / 9999px
- Typeface: Inter. Headings use light weight and negative tracking. Numeric data uses tabular figures.
- Visual language: Stripe-inspired restrained gradients, generous whitespace, hairline borders instead of heavy shadows, pill actions where appropriate, restrained motion.
- Public pages: teal DRx. Admin console: indigo Stripe-like system.

Read `.superdesign/design-system.md`, `design-md/stripe/DESIGN.md`, and `.claude/rules/design-stack.md` before substantial UI work.

## Tool selection

Choose only tools that fit the task. The repository is configured for ECC, Superpowers, Karpathy behavioral rules, Impeccable, SuperDesign, Repomix, wshobson/agents marketplace access, Playwright MCP, Probity, book-to-skill, and optional external agent labs.

Suggested routing:
- Design: Impeccable, SuperDesign, frontend-design/high-end visual design when available.
- Accessibility: accessibility/WCAG skills and responsive checks.
- Code: Karpathy guidelines, coding standards, frontend patterns, AI-debt review.
- Database: PostgreSQL design/optimization and GDPR handling.
- Testing: TDD, E2E, webapp testing, Playwright MCP.
- Process: brainstorming, writing-plans, systematic-debugging, verification-before-completion.
- Writing: humanizer when appropriate.

Do not invoke every agent or skill. Use the minimum effective set.

## Engineering rules

1. Resolve ordinary design/architecture ambiguity yourself and record why. Ask only when two choices materially change the product.
2. Verify before claiming completion. For UI: Chromium at 1440px and 390px, no horizontal overflow, touch targets >=44px, text contrast >=4.5:1 where WCAG AA requires it. Report measured results.
3. Preserve existing contracts. Read tests before changing IDs, classes, flows, or public behavior.
4. Never remove/disable a test to make CI green.
5. If a test command rewrites generated files, run it in an isolated copy/worktree.
6. Make surgical changes. Do not overengineer or refactor unrelated code.
7. End implementation work with: commit explaining why, push, PR, concise verification summary, and explicit open items.
