# AGENTS.md

Guidelines for coding agents in this MonoSolo monorepo.

## Layout

- [`core/`](core/) — Rails 8.1 backend → see [`core/AGENTS.md`](core/AGENTS.md) and [`core/STYLE.md`](core/STYLE.md)
- `apps/` — client apps (www, web, admin, mobile, desktop)
- `packages/` — shared TypeScript packages
- `scripts/` — monorepo setup / automation

## Development

```bash
mise setup
mise dev
```

App: http://localhost:3000 — login with `john@example.com`
