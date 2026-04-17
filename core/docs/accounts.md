# Accounts

[Account] is an abstraction representing organizations, teams, or any group (such as a school, community, company, etc.).

## Overview

- Accounts and Users are connected via the Memberships relationship.
- The accounts system provides multi-tenancy support for the application. When a user is created, a personal (solo) account is automatically created for them.
- Resources should be associated with specific Accounts and their Memberships.

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

- [Jumpstart Rails - Accounts](https://jumpstartrails.com/docs/accounts)
- [Bullet Train - Teams Should Be an MVP Feature](https://blog.bullettrain.co/teams-should-be-an-mvp-feature/)
