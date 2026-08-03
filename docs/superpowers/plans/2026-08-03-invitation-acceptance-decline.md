# Invitation Acceptance & Decline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep invitation links at `/{slug}/invitations/:token`, record accept/decline as `InvitationAcceptance` / `InvitationDecline` rows (Invitation kept), and finish the already-started `JoinController` split.

**Architecture:** Invitation show stays on `Account::InvitationsController`. Accept and decline are nested singular resources posting to `InvitationAcceptancesController` / `InvitationDeclinesController`, which create response records and (for accept) join the account. Status is derived from `has_one` associations — no `accepted_at` / `declined_at` on Invitation.

**Tech Stack:** Rails 8, SQLite, Minitest, existing `Account` / `Identity` / `User` models under `core/`.

## Global Constraints

- Invitation URL remains `/{slug}/invitations/:token` (param name stays `token`, not `code`).
- Do not destroy Invitation on accept or decline.
- At most one response per invitation (acceptance XOR decline).
- Timestamps come from response `created_at` only.
- Email uniqueness applies to **pending** invitations only.
- Join public flow stays `/{slug}/join/:code` → `Account::JoinController` (keep WIP; do not revert).
- Follow `docs/core/STYLE.md`; commit messages use emoji + `[core]` scope like recent branch commits.
- Working directory for Rails commands: `core/`.

## File map

| File | Responsibility |
| ---- | -------------- |
| `core/db/migrate/*_create_account_invitation_responses.rb` | New tables + drop blanket invitation email unique index |
| `core/app/models/account/invitation_acceptance.rb` | Acceptance record |
| `core/app/models/account/invitation_decline.rb` | Decline record |
| `core/app/models/account/invitation.rb` | Status helpers, accept/decline without destroy, pending email uniqueness |
| `core/app/controllers/account/invitations_controller.rb` | Admin CRUD + public show |
| `core/app/controllers/account/invitation_acceptances_controller.rb` | `create` accept |
| `core/app/controllers/account/invitation_declines_controller.rb` | `create` decline |
| `core/app/views/account/invitations/show.html.erb` | Preview / pending actions / outcome |
| `core/config/routes.rb` | Nested acceptance/decline; keep join routes |
| `core/config/initializers/account_slug.rb` | Reserved: `invitations`, `join`, `join_code` — not standalone `acceptances` |
| Delete WIP | `acceptances_controller.rb`, `views/account/acceptances/`, related wrong tests |

---

### Task 1: Finish JoinController WIP (keep as-is behavior)

**Files:**
- Keep: `core/app/controllers/account/join_controller.rb`
- Keep: `core/app/controllers/account/join_codes_controller.rb` (admin only)
- Keep: `core/app/views/account/join/show.html.erb`, `inactive.html.erb`
- Keep: `core/test/controllers/account/join_controller_test.rb`
- Modify: `core/config/routes.rb` (ensure join routes match below)
- Modify: `core/config/initializers/account_slug.rb` reserved list
- Delete if present: `core/test/controllers/account/join_codes_controller_test.rb` (show/create tests moved)

**Interfaces:**
- Produces: `account_join_path(code)` / `account_join_url(code)` for GET+POST

- [ ] **Step 1: Ensure routes include join + admin join_code**

```ruby
get  "join/:code", to: "join#show", as: :join
post "join/:code", to: "join#create", as: nil
resource :join_code, only: %i[ edit update destroy ]
```

Reserved slugs must include `join` and `join_code`; remove `join_codes` if unused; do **not** add top-level `acceptances`.

- [ ] **Step 2: Run join tests**

Run: `PARALLEL_WORKERS=1 bin/rails test test/controllers/account/join_controller_test.rb`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add core/app/controllers/account/join_controller.rb \
  core/app/controllers/account/join_codes_controller.rb \
  core/app/views/account/join \
  core/app/views/landings/show.html.erb \
  core/test/controllers/account/join_controller_test.rb \
  core/config/routes.rb \
  core/config/initializers/account_slug.rb
# also git rm obsolete join_codes show/create test if still tracked
git commit -m "$(cat <<'EOF'
♻️ [core] Split public join redemption into JoinController

EOF
)"
```

---

### Task 2: Migration + response models

**Files:**
- Create: `core/db/migrate/20260803050000_create_account_invitation_responses.rb`
- Create: `core/app/models/account/invitation_acceptance.rb`
- Create: `core/app/models/account/invitation_decline.rb`
- Modify: `core/app/models/account/invitation.rb`
- Test: `core/test/models/account/invitation_test.rb`
- Test: `core/test/models/account/invitation_acceptance_test.rb`
- Test: `core/test/models/account/invitation_decline_test.rb`

**Interfaces:**
- Produces:
  - `Account::Invitation#pending?` / `#accepted?` / `#declined?` → Boolean
  - `Account::Invitation#acceptance` / `#decline` → `has_one`
  - `Account::InvitationAcceptance` attrs: `invitation`, `identity`, `user`
  - `Account::InvitationDecline` attrs: `invitation`, `identity`

- [ ] **Step 1: Write failing model tests**

`core/test/models/account/invitation_test.rb`:

```ruby
require "test_helper"

class Account::InvitationTest < ActiveSupport::TestCase
  setup do
    @account = accounts(:john_account)
    @invitation = Account::Invitation.create!(
      account: @account,
      email: "newbie@example.com",
      invited_by: users(:john)
    )
  end

  test "pending until a response exists" do
    assert @invitation.pending?
    assert_not @invitation.accepted?
    assert_not @invitation.declined?
  end

  test "accepted? when acceptance exists" do
    identity = Identity.create!(email: "newbie@example.com")
    user = identity.users.find_by!(account: accounts(:john_account)) rescue nil
    # join first so user exists for acceptance
    identity.join(@account, role: :member, verified_at: Time.current)
    user = identity.users.find_by!(account: @account)

    @invitation.create_acceptance!(identity: identity, user: user)

    assert @invitation.reload.accepted?
    assert_not @invitation.pending?
  end

  test "allows a new invitation after decline for same email" do
    identity = Identity.create!(email: "newbie@example.com")
    @invitation.create_decline!(identity: identity)

    assert_difference -> { Account::Invitation.count }, 1 do
      Account::Invitation.create!(
        account: @account,
        email: "newbie@example.com",
        invited_by: users(:john)
      )
    end
  end

  test "rejects a second pending invitation for same email" do
    duplicate = Account::Invitation.new(
      account: @account,
      email: "newbie@example.com",
      invited_by: users(:john)
    )

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:email], "has already been invited"
  end
end
```

`core/test/models/account/invitation_acceptance_test.rb`:

```ruby
require "test_helper"

class Account::InvitationAcceptanceTest < ActiveSupport::TestCase
  test "invitation_id is unique" do
    account = accounts(:john_account)
    invitation = Account::Invitation.create!(
      account: account, email: "a@example.com", invited_by: users(:john)
    )
    identity = Identity.create!(email: "a@example.com")
    identity.join(account, role: :member, verified_at: Time.current)
    user = identity.users.find_by!(account: account)

    Account::InvitationAcceptance.create!(invitation: invitation, identity: identity, user: user)

    duplicate = Account::InvitationAcceptance.new(
      invitation: invitation, identity: identity, user: user
    )
    assert_not duplicate.valid?
  end
end
```

Mirror a unique test in `invitation_decline_test.rb` (decline only needs `identity`).

- [ ] **Step 2: Run tests — expect fail**

Run: `PARALLEL_WORKERS=1 bin/rails test test/models/account/invitation_test.rb test/models/account/invitation_acceptance_test.rb test/models/account/invitation_decline_test.rb`
Expected: FAIL (missing tables/models/methods)

- [ ] **Step 3: Migration**

```ruby
class CreateAccountInvitationResponses < ActiveRecord::Migration[8.2]
  def change
    create_table :account_invitation_acceptances, id: :uuid do |t|
      t.references :invitation, null: false, foreign_key: { to_table: :account_invitations }, type: :uuid, index: { unique: true }
      t.references :identity, null: false, foreign_key: true, type: :uuid
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end

    create_table :account_invitation_declines, id: :uuid do |t|
      t.references :invitation, null: false, foreign_key: { to_table: :account_invitations }, type: :uuid, index: { unique: true }
      t.references :identity, null: false, foreign_key: true, type: :uuid
      t.timestamps
    end

    remove_index :account_invitations, name: "index_account_invitations_on_account_id_and_email"
    add_index :account_invitations, [:account_id, :email],
      name: "index_account_invitations_on_account_id_and_email"
  end
end
```

Note: drop unique on `(account_id, email)`; pending uniqueness is enforced in the model (SQLite cannot express “pending” across other tables in a partial index easily).

- [ ] **Step 4: Models**

`invitation_acceptance.rb`:

```ruby
class Account::InvitationAcceptance < ApplicationRecord
  belongs_to :invitation, class_name: "Account::Invitation"
  belongs_to :identity
  belongs_to :user

  validates :invitation_id, uniqueness: true
end
```

`invitation_decline.rb`:

```ruby
class Account::InvitationDecline < ApplicationRecord
  belongs_to :invitation, class_name: "Account::Invitation"
  belongs_to :identity

  validates :invitation_id, uniqueness: true
end
```

Update `Account::Invitation`:

```ruby
has_one :acceptance, class_name: "Account::InvitationAcceptance", foreign_key: :invitation_id, dependent: :destroy
has_one :decline, class_name: "Account::InvitationDecline", foreign_key: :invitation_id, dependent: :destroy

validates :email, uniqueness: {
  scope: :account_id,
  message: "has already been invited",
  conditions: -> {
    where.missing(:acceptance, :decline)
  }
}

def pending?
  acceptance.nil? && decline.nil?
end

def accepted?
  acceptance.present?
end

def declined?
  decline.present?
end
```

(Use Rails `where.missing` / validation `conditions` — if validation `conditions` proves awkward on this Rails version, use a custom `validate` that queries pending siblings.)

- [ ] **Step 5: Migrate + run model tests**

Run: `bin/rails db:migrate` then the model test command from Step 2  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add core/db/migrate core/db/schema.rb \
  core/app/models/account/invitation.rb \
  core/app/models/account/invitation_acceptance.rb \
  core/app/models/account/invitation_decline.rb \
  core/test/models/account/
git commit -m "$(cat <<'EOF'
✨ [core] Add invitation acceptance and decline records

EOF
)"
```

---

### Task 3: Domain accept / decline (no destroy)

**Files:**
- Modify: `core/app/models/account/invitation.rb`
- Modify: `core/test/models/account/invitation_test.rb`

**Interfaces:**
- Consumes: `Identity#join`, acceptance/decline models
- Produces:
  - `Account::Invitation#accept!` → creates acceptance, joins, raises `EmailMismatch` / `AlreadyResponded`
  - `Account::Invitation#decline!` → creates decline, raises same errors

- [ ] **Step 1: Failing tests for accept! / decline!**

```ruby
test "accept! joins, records acceptance, keeps invitation" do
  identity = Identity.create!(email: "newbie@example.com")
  Current.identity = identity

  assert_difference -> { Account::InvitationAcceptance.count }, 1 do
    @invitation.accept!
  end

  assert Account::Invitation.exists?(@invitation.id)
  assert_includes identity.reload.accounts, @account
  assert @invitation.reload.accepted?
end

test "decline! records decline without joining" do
  identity = Identity.create!(email: "newbie@example.com")
  Current.identity = identity

  assert_difference -> { Account::InvitationDecline.count }, 1 do
    @invitation.decline!
  end

  assert Account::Invitation.exists?(@invitation.id)
  assert_not_includes identity.reload.accounts, @account
  assert @invitation.reload.declined?
end

test "accept! after decline raises AlreadyResponded" do
  identity = Identity.create!(email: "newbie@example.com")
  Current.identity = identity
  @invitation.decline!

  assert_raises(Account::Invitation::AlreadyResponded) { @invitation.accept! }
end
```

Also cover email mismatch still raising `EmailMismatch`.

- [ ] **Step 2: Run — expect fail**

Run: `PARALLEL_WORKERS=1 bin/rails test test/models/account/invitation_test.rb`
Expected: FAIL on missing `accept!` / `AlreadyResponded`

- [ ] **Step 3: Implement**

```ruby
class AlreadyResponded < StandardError; end

def accept!
  ensure_email_matches!
  ensure_pending!

  transaction do
    Current.identity.join(account, role: :member, verified_at: Time.current)
    user = Current.identity.users.find_by!(account: account)
    create_acceptance!(identity: Current.identity, user: user)
  end
end

def decline!
  ensure_email_matches!
  ensure_pending!
  create_decline!(identity: Current.identity)
end

private
  def ensure_email_matches!
    if email != Current.identity.email
      raise EmailMismatch, <<~message.strip
        Your email does not match the email of the invitation.
        Current logged in user email: #{Current.identity.email},
        Invitation email: #{email}
        Please sign in or sign up with the correct email.
      message
    end
  end

  def ensure_pending!
    raise AlreadyResponded, "Invitation already responded" unless pending?
  end
```

Remove old `accept` that called `destroy!` (or make `accept` an alias of `accept!` only if callers remain — prefer renaming call sites to `accept!` / `decline!`).

Update `accept_url` to `account_invitation_url(token, script_name: account.slug_path, ...)`.

- [ ] **Step 4: Run model tests — PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "$(cat <<'EOF'
✨ [core] Record accept and decline without destroying invitations

EOF
)"
```

---

### Task 4: Routes + controllers + remove wrong AcceptancesController

**Files:**
- Modify: `core/config/routes.rb`
- Modify: `core/app/controllers/account/invitations_controller.rb`
- Create: `core/app/controllers/account/invitation_acceptances_controller.rb`
- Create: `core/app/controllers/account/invitation_declines_controller.rb`
- Delete: `core/app/controllers/account/acceptances_controller.rb`
- Delete: `core/app/views/account/acceptances/`
- Delete: `core/test/controllers/account/acceptances_controller_test.rb`
- Modify: `core/test/integration/account_slug_boundary_test.rb` (use `/invitations/...` again)
- Modify: `core/test/controllers/sessions_controller_test.rb` (`account_invitation_path`)

**Interfaces:**
- Produces route helpers:
  - `account_invitation_path(token)`
  - `account_invitation_acceptance_path(token)` (POST)
  - `account_invitation_decline_path(token)` (POST)

- [ ] **Step 1: Routes**

```ruby
resources :invitations, only: %i[ index new create ]
resources :invitations, param: :token, only: %i[ show ] do
  resource :acceptance, only: %i[ create ], controller: "invitation_acceptances"
  resource :decline, only: %i[ create ], controller: "invitation_declines"
end
```

Remove `resources :acceptances, ...`.

- [ ] **Step 2: InvitationsController — admin + show**

```ruby
class Account::InvitationsController < ApplicationController
  allow_unauthenticated_access only: :show
  allow_unauthorized_access only: :show
  before_action :ensure_admin, only: %i[ index new create ]
  before_action :set_invitation_by_token, only: :show

  # index/new/create unchanged from admin-only version

  def show
    if Current.identity.blank?
      session[:return_to_after_authenticating] = account_invitation_url(
        @account_invitation.token,
        script_name: @account_invitation.account.slug_path
      )
    end
  end

  private
    def set_invitation_by_token
      @account_invitation = Current.account.invitations.find_by!(token: params.expect(:token))
    end
    # account_invitation_params as today
end
```

- [ ] **Step 3: InvitationAcceptancesController**

```ruby
class Account::InvitationAcceptancesController < ApplicationController
  allow_unauthorized_access
  before_action :set_invitation

  def create
    @account_invitation.accept!

    cookies.permanent[:last_account_slug] = @account_invitation.account.slug
    redirect_to root_url(script_name: @account_invitation.account.slug_path),
      notice: "You've joined #{@account_invitation.account.name}."
  rescue Account::Invitation::EmailMismatch => error
    redirect_to account_invitation_path(@account_invitation.token), alert: error.message
  rescue Account::Invitation::AlreadyResponded
    redirect_to account_invitation_path(@account_invitation.token),
      alert: "This invitation has already been responded to."
  end

  private
    def set_invitation
      @account_invitation = Current.account.invitations.find_by!(token: params.expect(:invitation_token))
    end
end
```

- [ ] **Step 4: InvitationDeclinesController**

Same structure; call `decline!`; redirect to `my_accounts_url(script_name: nil)` with decline notice; same rescues.

Nested param name: confirm with `bin/rails routes` — likely `invitation_token`.

- [ ] **Step 5: Smoke routes**

Run: `bin/rails routes | rg 'invitation|acceptance|decline|join'`  
Expected: show on `/invitations/:token`; POST acceptance/decline nested; join on `/join/:code`; no top-level `/acceptances`.

- [ ] **Step 6: Commit**

```bash
git add core/config/routes.rb core/app/controllers/account/
git rm -f core/app/controllers/account/acceptances_controller.rb \
  core/test/controllers/account/acceptances_controller_test.rb 2>/dev/null || true
git rm -rf core/app/views/account/acceptances 2>/dev/null || true
git commit -m "$(cat <<'EOF'
♻️ [core] Nest invitation acceptance and decline controllers

EOF
)"
```

---

### Task 5: Show view + request tests

**Files:**
- Create/restore: `core/app/views/account/invitations/show.html.erb`
- Modify: `core/test/controllers/account/invitations_controller_test.rb`
- Create: `core/test/controllers/account/invitation_acceptances_controller_test.rb`
- Create: `core/test/controllers/account/invitation_declines_controller_test.rb`

**Interfaces:**
- Consumes: invitation status helpers; `account_invitation_acceptance_path` / `account_invitation_decline_path`

- [ ] **Step 1: Failing request tests**

Cover:

1. Guest show → success, Login link, sets `return_to` to `account_invitation_url`
2. Invitee pending → Accept + Decline buttons (`button_to` POST)
3. POST acceptance → joins, keeps invitation, creates acceptance, sets cookie, redirects to account root
4. POST decline → decline row, no join, invitation kept, redirect to my accounts
5. Wrong email → redirect back with alert
6. Already responded → redirect with alert (no second row)
7. Wrong account slug → 404
8. Accepted show → no Accept/Decline buttons; shows joined outcome copy
9. Declined show → no buttons; shows declined outcome copy

Example accept test:

```ruby
test "accepting creates acceptance and keeps invitation" do
  identity = Identity.create!(email: "newbie@example.com")
  sign_in_as identity

  assert_difference -> { Account::InvitationAcceptance.count }, 1 do
    post account_invitation_acceptance_path(@invitation.token, script_name: @account.slug_path)
  end

  assert Account::Invitation.exists?(@invitation.id)
  assert_includes identity.reload.accounts, @account
  assert_redirected_to root_url(script_name: @account.slug_path)
end
```

- [ ] **Step 2: Run — expect fail**

Run: `PARALLEL_WORKERS=1 bin/rails test test/controllers/account/invitation_acceptances_controller_test.rb test/controllers/account/invitation_declines_controller_test.rb test/controllers/account/invitations_controller_test.rb`
Expected: FAIL (view/buttons/paths)

- [ ] **Step 3: Implement show view**

Pending invitee branch:

```erb
<%= button_to "Accept invitation",
      account_invitation_acceptance_path(@account_invitation.token),
      method: :post,
      class: "btn btn--primary" %>

<%= button_to "Decline",
      account_invitation_decline_path(@account_invitation.token),
      method: :post,
      class: "btn btn--ghost" %>
```

Resolved branches: render plain outcome text (e.g. “You joined …” / “You declined …”) with `created_at` if useful; no action buttons.

Guest / wrong-email branches: keep current login CTAs; `return_to` uses `account_invitation_path`.

- [ ] **Step 4: Run request tests — PASS**

- [ ] **Step 5: Commit**

```bash
git add core/app/views/account/invitations/show.html.erb \
  core/test/controllers/account/
git commit -m "$(cat <<'EOF'
✨ [core] Wire invitation show to acceptance and decline actions

EOF
)"
```

---

### Task 6: Docs + final verification

**Files:**
- Modify: `docs/core/ACCOUNT.md` (invite accept keeps invitation; acceptance/decline records)
- Modify: `docs/superpowers/specs/2026-08-03-invitation-acceptance-decline-design.md` — set Status: accepted

- [ ] **Step 1: Update ACCOUNT.md lifecycle bullets** to match: invite link `/{slug}/invitations/:token`; accept/decline create records; invitation retained; pending-only email uniqueness.

- [ ] **Step 2: Full related suite**

Run:

```bash
PARALLEL_WORKERS=1 bin/rails test \
  test/models/account/invitation_test.rb \
  test/models/account/invitation_acceptance_test.rb \
  test/models/account/invitation_decline_test.rb \
  test/controllers/account/invitations_controller_test.rb \
  test/controllers/account/invitation_acceptances_controller_test.rb \
  test/controllers/account/invitation_declines_controller_test.rb \
  test/controllers/account/join_controller_test.rb \
  test/controllers/sessions_controller_test.rb \
  test/integration/account_slug_boundary_test.rb
```

Expected: all PASS

- [ ] **Step 3: Commit docs**

```bash
git add docs/core/ACCOUNT.md docs/superpowers/specs/2026-08-03-invitation-acceptance-decline-design.md
git commit -m "$(cat <<'EOF'
📝 [docs] Document invitation acceptance and decline records

EOF
)"
```

---

## Spec coverage check

| Spec requirement | Task |
| ---------------- | ---- |
| URL `invitations/:token` | 4, 5 |
| POST acceptance / decline nested | 4, 5 |
| Models `InvitationAcceptance` / `InvitationDecline` | 2, 3 |
| No accepted_at/declined_at; use `created_at` | 2, 3 |
| Keep invitation row | 3, 5 |
| One response XOR | 2, 3, 5 |
| Pending-only email uniqueness / re-invite after decline | 2 |
| Actor identity (+ user on accept) | 2, 3 |
| Show outcome when resolved | 5 |
| JoinController unchanged path | 1 |
| Remove wrong `/acceptances` WIP | 4 |

## Placeholder scan

None intentional — validation `conditions: -> { where.missing(...) }` may need a small tweak if Rails version rejects it; fall back to custom `validate :email_unique_among_pending`.
