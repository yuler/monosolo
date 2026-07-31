# Account — URL tenancy & request context

Design consensus for MonoSolo account/tenancy (grilled against Fizzy and common SaaS patterns: GitHub, Vercel, Linear, Cloudflare, Stripe, Slack, Notion).

Status: **agreed** — implementation should follow this doc. Older notes that say “personal accounts have no URL slug” are obsolete.

## Language

| Term | Meaning |
|------|---------|
| **Account** | Tenant boundary — personal or team workspace that owns users, data, and billing. Avoid: organization, workspace, team (as domain nouns). Prefer “team account” / “personal account” when the distinction matters. |
| **Personal account** | An Account owned by a single Identity. Always exists; has a URL slug like any other Account. |
| **Team account** | An Account shared by multiple users. Same URL shape as personal. |
| **Account slug** | First path segment identifying an Account (`/{slug}/...`). Shared namespace across personal and team. UI may call the personal slug “username”. |
| **Identity** | Global login principal (email / session). Not an Account; does not occupy the slug namespace. |

## Product model (GitHub-style shared namespace)

- URL shape is **C**: `/{slug}/...` for **both** personal and team accounts. Type is distinguished after lookup (`personal?` / `team?`), not by whether a prefix exists.
- The namespace entity is always **Account**. There is no separate `Identity.username`. The UI label “username” means the personal Account’s `slug`.
- Personal and team slugs share one uniqueness constraint and the same format / `RESERVED` rules / rename semantics.

### Slug generation & rename

- **Initial slug**: derive a username candidate from email local-part or display name; on conflict, append random digits (e.g. `john` → `john8472`). Prefer clean slug when available; do not always force a numeric suffix.
- **User can change** slug later (personal and team, same rules).
- **On rename**: old slug is **released immediately**; **no redirects**. Old links may break; the new name can be claimed by someone else right away. Surface this risk in settings copy.
- **API clients** should not treat slug as a long-lived stable id (see API below).

### Lifecycle

- On registration, **eager-create** a personal account (not lazy on first `personal_account` access).
- Accepting a team invite **also** creates personal if missing; invite only changes membership and first landing, not whether personal exists.
- Every Identity **always** has exactly one personal account; it **cannot be deleted** (rename / display tweaks only). Team accounts follow normal leave/delete rules for owners.

### Post-login landing

- **One** account → go there directly.
- **Multiple** accounts → **always** show an account picker (no auto-skip). Cookie/session may remember last account and **preselect / hint** it; the user must confirm.
- After **accepting an invite**: **force** land on that team once and update “last account”; later logins still follow the rules above.

## Request pipeline

### Middleware (`AccountSlug::Extractor`)

Keep Fizzy-style **SCRIPT_NAME mounting** for Web:

1. If first path segment looks like a slug and is not reserved → move it to `SCRIPT_NAME`, leave the rest as `PATH_INFO` so route helpers stay unprefixed in the route table.
2. `Account.find_by(slug:)` and wrap the request in `Current.with_account(account)`.
3. If slug present but Account **missing** → **404 in middleware** (do not enter the app with a half-set Current).

Middleware does **not** enforce membership or login.

### Global routes (no slug)

Examples: `/login`, account picker, `/my/...`, marketing.

- Middleware leaves **`Current.account = nil`**.
- “Last account” in cookie/session is **only** for picker prefill — it must **not** populate `Current.account` on global routes.
- Code under global routes must not assume a tenant context.

### Authorization (controllers / concerns)

| Situation | Behavior |
|-----------|----------|
| Account exists, **unauthenticated** | Redirect to login with `return_to`. |
| Authenticated, **not a member** | **404** (same external shape as missing account; avoid existence leaks via 403). |
| Authenticated member | Proceed; set `Current.user` for that Account. |

Membership checks stay in application authz, not in the middleware.

## API

Support **both**:

1. **Path aligned with Web**: `/api/v1/{slug}/...` (same mount / strip idea as Web, not a special `/accounts/:slug` digression long-term).
2. **Header** (or token claim) declaring the account when the path has no slug.

**Resolution order** (path wins):

| Path slug | Header | Result |
|-----------|--------|--------|
| Present | Absent | Use path |
| Absent | Present | Use header |
| Present | Present (any value) | **Use path; ignore header** |
| Absent | Absent | Fall back to **personal** account |

Invalid slug after resolution → 404 (same spirit as Web middleware). Non-member → 404. Prefer documenting that machine clients should eventually use stable Account **ids** where rename-safety matters; slug in path is for consistency with Web, not permanence.

## Explicit non-goals (relative to current Fizzy-ish code)

- Do **not** treat “no slug ⇒ silently set `Current.account` to personal” as the tenancy source of truth on global routes.
- Do **not** use session “last account” as request tenant without a slug (or API header) / picker confirmation.
- Personal accounts are first-class URL owners; they are not “slugless solo mode.”

## Comparison snapshot (why this shape)

| Pattern | Examples | We take |
|---------|----------|---------|
| Shared owner namespace | GitHub `/{user\|org}` | **Yes** — personal & team Account slugs |
| Dual track (personal no prefix) | Early Vercel Hobby vs team; prior CONTEXT | **No** |
| Opaque id in path | Cloudflare, Stripe, Fizzy numeric id | Not for Web URLs (readable slug); ids still fine internally/API |
| Subdomain tenant | Slack | **No** (path + SCRIPT_NAME) |
| SCRIPT_NAME mount | Fizzy / Basecamp | **Yes** for Web |

## Implementation touchpoints (indicative)

- `core/config/initializers/account_slug.rb` — middleware behavior, 404 on missing Account, API path shape
- `Identity` / signup / invite flows — eager personal; invite first hop
- `Current` / session — stop personal fallback on global nil-account routes
- Auth concerns — unauthenticated → login; non-member → 404
- Settings — slug rename UX + warning; personal undeletable
- `core/CONTEXT.md` — vocabulary aligned with this doc
- `core/docs/accounts.md` — overview + pointer here for tenancy/URL rules
- `core/AGENTS.md` — multi-tenancy section aligned with this doc

## Open follow-ups (not blocking agreement)

- Exact slug format length / charset (today ~4..16) and RESERVED list ownership (keep in sync with `routes.rb`).
- Rename rate limits (optional product guard; not required by consensus).
- Whether to migrate API off slug to UUID as a later hardening step while keeping path+header resolution rules.

## Implementation notes

- `PATH_INFO_MATCH` requires the slug segment to end at `/` or EOS (`(?=\/|\z)`), so longer first segments like `account_invitations` are never truncated into a fake 16-char slug.
- Account settings live at `/{slug}/settings` (`Account::SettingsController`); slug rename warns that old URLs are released with no redirect.
- Invitation accept: `/{global}/account_invitations/:token/accept` joins the invitee (personal already eager-created) and lands on the invited account, setting `last_account_slug`.
