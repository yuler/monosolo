# AGENTS.md

Guidelines and commands for agents working in the Rails 8.1 `core` app.

## Development Commands

### Setup and Server

```bash
# Initial setup (installs deps)
bin/setup
# Start development server
bin/dev
```

Development URL: http://localhost:3000 — login with `john@example.com`

From the monorepo root you can also run `mise setup` / `mise dev`.

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

URL path-based multi-tenancy via middleware:

- Each Account (tenant) has a unique `account_slug`
- URLs are prefixed: `/{account_slug}/~/xxx/...`
- Middleware ([`AccountSlug::Extractor`](config/initializers/account_slug.rb)) extracts the slug from the URL and sets `Current.account`
- The slug is moved from `PATH_INFO` to `SCRIPT_NAME`, so Rails is effectively mounted at that path
- All models include `account_id` for data isolation
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

Key recurring tasks (via [`config/recurring.yml`](config/recurring.yml)):

- Cleanup jobs for expired links, deliveries

### Chrome MCP (Local Dev)

App URL: http://localhost:3000  
Login: `john@example.com` (passwordless magic link — check Rails console for the link)

Use Chrome MCP tools against the running dev app for UI testing and debugging.

## Code Style Guidelines

See [STYLE.md](STYLE.md).
