# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in this Rails 8.1 starter template repository.

## Rails Starter

TODO: Description about your app

## Development Commands

### Setup and Server

```bash
# Initial setup (installs deps)
core/bin/setup
# Start development server
core/bin/dev
```

Development URL: http://localhost:2000, Then login with: john@example.com

### Testing
```bash
# Run unit tests (fast)
core/bin/rails test
# Run single test file
core/bin/rails test core/test/path/file_test.rb
# Run system tests (Capybara + Selenium)
core/bin/rails test:system
# Run full CI suite (style, security, tests)
core/bin/ci

# For parallel test execution issues, use:
PARALLEL_WORKERS=1 core/bin/rails test
```

### Database
```bash
# Load fixture data
core/bin/rails db:fixtures:load
# Run migrations
core/bin/rails db:migrate
# Drop, create, and load schema
core/bin/rails db:reset
# Drop, create, async schema to sqlite/pqsel/mysql schema
ruby core/script/db_schema_fresh.rb
```

### Other Utilities
```bash
# Manage Solid Queue jobs
core/bin/jobs
# Deploy (requires 1Password CLI for secrets)
core/bin/kamal deploy
```

## Architecture Overview

### Multi-Tenancy (URL-Based)

This project uses **URL path-based multi-tenancy**:
- Each Account (tenant) has a unique `account_slug`
- URLs are prefixed: `/{account_slug}/~/xxx/...`
- Middleware (`AccountSlug::Extractor`) extracts the account ID from the URL and sets `Current.account`
- The slug is moved from `PATH_INFO` to `SCRIPT_NAME`, making Rails think it's "mounted" at that path
- All models include `account_id` for data isolation
- Background jobs automatically serialize and restore account context

**Key insight**: This architecture allows multi-tenancy without subdomains or separate databases, making local development and testing simpler.

### Authentication & Authorization

**Passwordless magic link authentication**:
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

All tables use UUIDs (UUIDv7 format, base36-encoded as 25-char strings):
- Custom fixture UUID generation maintains deterministic ordering for tests
- Fixtures are always "older" than runtime records
- `.first`/`.last` work correctly in tests

### Background Jobs (Solid Queue)

Database-backed job queue (no Redis):
- Jobs automatically capture/restore `Current.account`
- Mission Control::Jobs for monitoring

Key recurring tasks (via `core/config/recurring.yml`):
- Cleanup jobs for expired links, deliveries

### Chrome MCP (Local Dev)

URL: `http://localhost:3006`
Login: john@example.com (passwordless magic link auth - check rails console for link)

Use Chrome MCP tools to interact with the running dev app for UI testing and debugging.

## Code Style Guidelines

@STYLE.md
