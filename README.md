# MonoSolo

**MonoSolo** ([**Mono**lith](https://signalvnoise.com/svn3/the-majestic-monolith/) + **Solo**) emphasizes using a single repository for your entire codebase, tailored specifically for solo developers and One Person Companies (OPCs).

## Struct

```bash
.
├── core/                # Rails backend (API, Background Jobs & Core Logic)
├── apps/                # Client applications (Consumer-facing)
│   ├── www/             # Astro (Marketing, Documentation & SEO-optimized site)
│   ├── web/             # Nuxt (Primary web application / SaaS product)
│   ├── admin/           # Vite + Vue3 (Internal dashboard & B2B management)
│   ├── mobile/          # Mobile application (Capacitor/React Native)
│   └── desktop/         # Desktop application (Tauri/Electron)
├── packages/            # Shared workspace packages
│   ├── api-client/      # Auto-generated SDK/Hooks for Rails API
│   ├── shared-utils/    # Shared TypeScript types, constants & helpers
│   └── ui-kit/          # Design system & shared component library
├── scripts/             # Global automation (Setup, CI/CD, Dev-ops)
├── package.json         # Root workspace manifest & global task runner
└── README.md            # Project documentation & MonoSolo philosophy
```

## Core (Rails)

Opinionated Rails 8.1 template for rapid development.

- **Solid:** Solid Queue, Solid Cache, and Solid Cable on SQLite
- **Multi-tenancy:** Shared slug namespace `/{slug}/...` for personal and team accounts (see [docs/core/account.md](docs/core/account.md), [AccountSlug::Extractor](core/config/initializers/account_slug.rb))
- **API:** JWT-authenticated controllers

## 🛠️ Development

```bash
mise setup
mise dev
```

App: http://localhost:3000 — login with `john@example.com`