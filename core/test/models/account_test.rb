require "test_helper"

class AccountTest < ActiveSupport::TestCase
  test "slug_path is present for personal and team accounts" do
    personal = Account.create_with_owner(
      account: { name: "Pat Personal", personal: true, slug: "pat_user" },
      owner: { name: "Pat", identity: identities(:john) }
    )
    team = accounts(:john_account)

    assert_equal "/pat_user", personal.slug_path
    assert_equal "/#{team.slug}", team.slug_path
  end

  test "personal accounts cannot be destroyed" do
    account = Account.create_with_owner(
      account: { name: "Solo", personal: true, slug: "solo_user" },
      owner: { name: "Solo", identity: identities(:john) }
    )

    assert_not account.destroy
    assert account.persisted?
  end

  test "generates slug from name candidate with digits on collision" do
    first = Account.create_with_owner(
      account: { name: "Tester", personal: true },
      owner: { name: "Tester", identity: identities(:john) }
    )
    second = Account.create_with_owner(
      account: { name: "Tester", personal: true },
      owner: { name: "Tester", identity: identities(:yuler) }
    )

    assert_equal "tester", first.slug
    assert second.persisted?
    assert_match(/\Atester\d+\z/, second.slug)
  end
end
