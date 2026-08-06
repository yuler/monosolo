# apps/web

Primary web application for MonoSolo, built with [TanStack Router](https://tanstack.com/router) and Vite.

## Stack

- [TanStack Router](https://tanstack.com/router) — file-based routing with full type safety
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Biome](https://biomejs.dev/) — linting and formatting

## Development

From the monorepo root:

```bash
mise dev        # prints subdomain URLs, then overmind + Procfile.dev
```

| URL                                | Notes                     |
| ---------------------------------- | ------------------------- |
| http://web.monosolo.localhost:5173 | Preferred local subdomain |
| http://localhost:5173              | Plain loopback            |

`*.localhost` → `127.0.0.1` (no hosts file). Vite allows `.localhost` via `server.allowedHosts` in `vite.config.ts`. Port: `WEB_PORT` in root `.env`.

Or standalone:

```bash
pnpm dev        # http://web.monosolo.localhost:5173
```

## Routes

Routes live in `src/routes/` and follow TanStack Router's file-based conventions:

| File                        | Path  |
| --------------------------- | ----- |
| `src/routes/index.tsx`      | `/`   |
| `src/routes/__root.tsx`     | root layout (wraps all routes) |

To add a route, create a new file under `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` — do not edit that file manually.

## Path aliases

`#/*` maps to `./src/*` (configured via `tsconfig.json` and Vite's built-in `resolve.tsconfigPaths`).

## Linting & formatting

```bash
pnpm lint
pnpm format
pnpm check
```

## Build

```bash
pnpm build      # outputs to dist/
pnpm preview    # preview the production build
```
