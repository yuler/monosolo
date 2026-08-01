require "test_helper"

class AccountTest < ActiveSupport::TestCase
  test "slug_path is present for personal and team accounts" do
    personal = accounts(:john_account)
    team = Account.create_with_owner(
      account: { name: "Acme Team", personal: false, slug: "acme_team" },
      owner: { name: "John", identity: identities(:john) }
    )

    assert_equal "/john_account", personal.slug_path
    assert_equal "/acme_team", team.slug_path
  end

  test "personal accounts cannot be destroyed" do
    account = accounts(:john_account)

    assert_not account.destroy
    assert account.persisted?
  end

  test "rejects a second personal account for the same identity" do
    duplicate = Account.create_with_owner(
      account: { name: "Another Personal", personal: true, slug: "john_solo2" },
      owner: { name: "John", identity: identities(:john) }
    )

    assert_not duplicate.persisted?
    assert_includes duplicate.errors[:base], "Identity already has a personal account"
  end

  test "generates slug from name candidate with digits on collision" do
    first = Account.create_with_owner(
      account: { name: "Tester", personal: false },
      owner: { name: "Tester", identity: identities(:john) }
    )
    second = Account.create_with_owner(
      account: { name: "Tester", personal: false },
      owner: { name: "Tester", identity: identities(:yuler) }
    )

    assert_equal "tester", first.slug
    assert second.persisted?
    assert_match(/\Atester\d+\z/, second.slug)
  end
end
