# Core

Rails backend for MonoSolo. Multi-tenant SaaS where each tenant is an Account.

## Language

**Account**:
The tenant boundary — a personal or team workspace that owns users, data, and billing.
_Avoid_: Organization, workspace, team (as domain nouns — use "team account" or "personal account" as qualifiers when the distinction matters)

**Personal account**:
An Account scoped to a single Identity. No URL slug; routes are global (e.g. `/my/accounts`).
_Avoid_: Personal space, user account

**Team account**:
An Account shared by multiple users. Has a URL slug prefix (e.g. `/{slug}/users`).
_Avoid_: Organization, workspace

**Account slug**:
The URL path segment that identifies a team account (e.g. `/acme-corp/users`).
_Avoid_: Tenant ID, org slug, workspace slug
