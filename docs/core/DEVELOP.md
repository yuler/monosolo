# Develop

Guidelines and commands for agents working in the Rails 8.1 `core` app.

## Development Commands

### Setup and Server

```bash
# Initial setup (installs deps)
bin/setup
# Start development server (from core/)
bin/dev
```

Development URLs (login with `john@example.com`):

| URL                                 | Notes                                     |
| ----------------------------------- | ----------------------------------------- |
| http://core.monosolo.localhost:3001 | Preferred local subdomain (`*.localhost`) |
| http://localhost:3001               | Same process, plain loopback              |

From the monorepo root prefer `mise setup` / `mise dev` (runs [`scripts/dev.sh`](../../scripts/dev.sh): prints subdomain URLs, then `overmind start -f Procfile.dev`).

### Local subdomains (`*.localhost`)

Modern OS/browsers resolve `*.localhost` to `127.0.0.1` — no `/etc/hosts` entry required.

| App  | Subdomain                                   | Port env                     |
| ---- | ------------------------------------------- | ---------------------------- |
| web  | http://web.monosolo.localhost:${WEB_PORT}   | `WEB_PORT` (default `3000`)  |
| core | http://core.monosolo.localhost:${CORE_PORT} | `CORE_PORT` (default `3001`) |

Host authorization in development allows any `*.localhost` host (optional port) via `config.hosts` in [`config/environments/development.rb`](../../core/config/environments/development.rb). This is for local hostname convenience only — multi-tenancy remains path-based (`/{slug}/...`), not subdomain-based.

### Testing

```bash
# Run unit tests (fast)
bin/rails test
# Run single test file
bin/rails test test/path/file_test.rb
# Run system tests (Capybara + Selenium)
bin/rails test:system
# Run full CI suite (style, security, tests)
bin/ci

# For parallel test execution issues, use:
PARALLEL_WORKERS=1 bin/rails test
```

### Database

```bash
# Load fixture data
bin/rails db:fixtures:load
# Run migrations
bin/rails db:migrate
# Drop, create, and load schema
bin/rails db:reset
# Drop, create, async schema to sqlite schema
ruby script/db_schema_fresh.rb
```

### Other Utilities

```bash
# Manage Solid Queue jobs
bin/jobs
# Deploy (requires 1Password CLI for secrets)
bin/kamal deploy
```

## Architecture Overview

### Multi-Tenancy (URL-Based)

Canonical design & vocabulary: [`ACCOUNT.md`](ACCOUNT.md).

URL path-based multi-tenancy via middleware:

- Personal and team Accounts share one slug namespace; URLs are `/{slug}/...` for both
- Middleware ([`AccountSlug::Extractor`](../../core/config/initializers/account_slug.rb)) mounts via `SCRIPT_NAME`, looks up the Account, sets `Current.account`; missing slug → 404
- Global routes (no slug) keep `Current.account` nil; do not fall back to personal as tenant truth
- Authz (login / membership) lives in controllers — unauthenticated → login; non-member → 404
- All tenant models include `account_id` for data isolation
- Background jobs automatically serialize and restore account context

This avoids subdomains or separate databases, which keeps local development and testing simpler.

### Authentication & Authorization

Passwordless magic-link authentication:

- Global `Identity` (email-based) can have `Users` in multiple Accounts
- Users belong to an Account and have roles: owner, admin, member, system
- Sessions managed via signed cookies
- Board-level access control via `Access` records

### Core Domain Models

**Account** → The tenant/organization

- Has users, boards, cards, tags, webhooks
- Has entropy configuration for auto-postponement

**Identity** → Global user (email)

- Can have Users in multiple Accounts
- Session management tied to Identity

**User** → Account membership

- Belongs to Account and Identity
- Has role (owner/admin/member/system)
- Board access via explicit `Access` records

### UUID Primary Keys

All tables use UUIDs (UUIDv7, base36-encoded as 25-char strings):

- Custom fixture UUID generation keeps deterministic ordering in tests
- Fixtures are always older than runtime records
- `.first` / `.last` work correctly in tests

### Background Jobs (Solid Queue)

Database-backed job queue (no Redis):

- Jobs automatically capture/restore `Current.account`
- Mission Control::Jobs for monitoring

Key recurring tasks (via [`config/recurring.yml`](../../core/config/recurring.yml)):

- Cleanup jobs for expired links, deliveries

### Chrome MCP (Local Dev)

App URL: http://core.monosolo.localhost:3001 (or http://localhost:3001)  
Login: `john@example.com` (passwordless magic link — check Rails console for the link)

Use Chrome MCP tools against the running dev app for UI testing and debugging.

## Code Style Guidelines

See [`STYLE.md`](STYLE.md).
