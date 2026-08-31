# Agent tooling status

This repository was empty before this setup, so the tooling was added without touching application code.

## Active/project-local

- ECC: declared in `.claude/settings.json`; bootstrap uses ECC 2.2 guided install and is safe to rerun.
- Superpowers: enabled from the official Claude plugin marketplace.
- Karpathy behavior: project rules in `CLAUDE.md` + `.claude/rules/karpathy-guidelines.md`.
- Repomix: dev dependency, run with `npm run repomix`.
- Probity: dev dependency + `probity.config.ts`; used instead of TDD Guard for this new project.
- Playwright MCP: project `.mcp.json`.
- SuperDesign: bootstrap installs the project skill; design system lives at `.superdesign/design-system.md`.
- Impeccable: bootstrap installs it under `.claude/skills/impeccable`.
- Stripe reference: `design-md/stripe/DESIGN.md`.
- book-to-skill: bootstrap clones it under `.claude/skills/book-to-skill`.
- wshobson/agents: marketplace is registered; install only specialist plugins that a task actually needs.

## Isolated / optional, deliberately outside the product runtime

- Claude Subconscious: marketplace registered, but activation requires `LETTA_API_KEY`.
- OpenClaw: bootstrap installs the CLI if missing; onboarding/daemon setup is explicit.
- Claude Squad: source checkout under `.tools/external`; prerequisites such as tmux/gh remain host-level.
- screenshot-to-code: checkout under `.tools/external`; use only when needed.
- Dify: checkout only. It is a separate Docker application and is never started automatically.
- Ant Design: checkout as a design/component reference. It is not added to the product because the declared app stack is static HTML/CSS/JS, while Ant Design is a React component library.
- LangGraph, DSPy, Pydantic AI, CrewAI: optional isolated tooling lab only (`-InstallOptionalLabs` in PowerShell). They are not product dependencies and do not change the no-Python runtime rule.
- Awesome Claude Code: reference library, not something that should be blindly installed wholesale.

## Intentionally unresolved

- `agent`: the name is too ambiguous to map to one trustworthy repository. No arbitrary package is installed for it.
- `Behaviour / Karpathy skill`: treated as the same `multica-ai/andrej-karpathy-skills` source to avoid duplicate behavioral rules.

## Run

Windows PowerShell:
```powershell
./scripts/bootstrap-agent-tools.ps1
# Optional isolated Python agent lab:
./scripts/bootstrap-agent-tools.ps1 -InstallOptionalLabs
```

macOS/Linux/WSL:
```bash
bash ./scripts/bootstrap-agent-tools.sh
```

Both bootstrap paths are designed to continue when an item is already installed.
