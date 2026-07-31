# Accounts

**Account** is the tenant boundary (personal or team workspace). Membership is via **User** records linking **Identity** ↔ **Account**.

For URL tenancy, middleware, login landing, slug rename, and API resolution, see the canonical design doc:

→ [`docs/core/account.md`](../../docs/core/account.md)

Domain vocabulary: [`CONTEXT.md`](../CONTEXT.md).

## Overview

- Multi-tenancy is URL path-based: `/{slug}/...` for both personal and team accounts (shared slug namespace).
- On registration, a personal account is **eager-created**; it always exists and cannot be deleted.
- Accepting a team invite also ensures personal exists; first hop lands on the invited team.
- Resources that belong to a tenant should carry `account_id` and be used only when `Current.account` is set (slug-scoped or API-resolved requests). Global routes keep `Current.account` nil.

## Creating Account-Scoped Resources

When generating new resources that should be scoped to an account, include `account:references` in the generator command:

For example, to generate a `Post` model:

```bash
rails generate model Post title:string body:text account:references
```

This will:

- Add an `account_id` foreign key to the migration
- Add the `belongs_to :account` association to the model
- Ensure the resource is properly scoped to an account

## References

- [docs/core/account.md](../../docs/core/account.md) — MonoSolo tenancy consensus
- [Jumpstart Rails - Accounts](https://jumpstartrails.com/docs/accounts)
- [Bullet Train - Teams Should Be an MVP Feature](https://blog.bullettrain.co/teams-should-be-an-mvp-feature/)
