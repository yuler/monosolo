# AGENTS.md

Guidelines for coding agents in this MonoSolo monorepo.

## Layout

- [`core/`](core/) — Rails 8.1 backend → [`docs/core/DEVELOP.md`](docs/core/DEVELOP.md), [`docs/core/STYLE.md`](docs/core/STYLE.md), [`docs/core/ACCOUNT.md`](docs/core/ACCOUNT.md)
- [`apps/web/`](apps/web/) — TanStack Router → [`.agents/web.md`](.agents/web.md)
- `apps/` — other client apps (admin, mobile, desktop)
- `packages/` — shared TypeScript packages
- `scripts/` — monorepo setup / automation

## Development

```bash
mise setup
mise dev
```

`mise dev` → `scripts/dev.sh` prints subdomain URLs, then starts [`Procfile.dev`](Procfile.dev) via overmind:

- Core: http://core.monosolo.localhost:3000 (also http://localhost:3000)
- Web: http://web.monosolo.localhost:5173 (also http://localhost:5173)

`*.localhost` resolves to `127.0.0.1` (no hosts file). Login: `john@example.com`

## Rules

- Git commit title format: `emoji [scope] The main change` — example: `✨ [core] Adopt shared account slug tenancy for personal and team`
- PR title follows the same format as the git commit title.
- Markdown tables must be auto-aligned (pad columns so pipes line up).
- Do not use superpower or other speculative-driven skills unless explicitly declared.
- If something is unclear, ask questions. Keep everything from design to code as simple as possible.
