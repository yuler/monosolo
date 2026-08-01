# AGENTS.md

Guidelines for coding agents in this MonoSolo monorepo.

## Layout

- [`core/`](core/) — Rails 8.1 backend → [`docs/core/DEVELOP.md`](docs/core/DEVELOP.md), [`docs/core/STYLE.md`](docs/core/STYLE.md), [`docs/core/ACCOUNT.md`](docs/core/ACCOUNT.md)
- `apps/` — client apps (www, web, admin, mobile, desktop)
- `packages/` — shared TypeScript packages
- `scripts/` — monorepo setup / automation

## Development

```bash
mise setup
mise dev
```

App: http://localhost:3000 — login with `john@example.com`

## Rules

- Git commit title format: `emoji [scope] The main change` — example: `✨ [core] Adopt shared account slug tenancy for personal and team`
- PR title follows the same format as the git commit title.
- Markdown tables must be auto-aligned (pad columns so pipes line up).
