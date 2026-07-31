# Core

Rails backend for MonoSolo. Multi-tenant SaaS where each tenant is an Account.

Canonical tenancy / URL rules: [`docs/core/account.md`](../docs/core/account.md) (repo root).

## Language

**Account**:
The tenant boundary — a personal or team workspace that owns users, data, and billing.
_Avoid_: Organization, workspace, team (as domain nouns — use "team account" or "personal account" as qualifiers when the distinction matters)

**Personal account**:
An Account scoped to a single Identity. Always exists, cannot be deleted, and has a URL slug in the shared owner namespace (`/{slug}/...`). The UI may call this slug the user's "username".
_Avoid_: Personal space, user account, slugless solo mode

**Team account**:
An Account shared by multiple users. Same URL shape as personal (`/{slug}/...`).
_Avoid_: Organization, workspace

**Account slug**:
The URL path segment that identifies any Account — personal or team — in one shared namespace (e.g. `/acme-corp/users`, `/john/settings`).
_Avoid_: Tenant ID, org slug, workspace slug (as the path term); do not imply slugs are team-only

**Identity**:
Global login principal (email / session). Not an Account; does not occupy the slug namespace.
_Avoid_: User (use Identity for login; User for membership inside an Account)
