require "test_helper"

class IdentityPersonalAccountTest < ActiveSupport::TestCase
  test "creates personal account eagerly on identity create" do
    identity = Identity.create!(email: "newbie@example.com")

    personal = identity.accounts.personal.first
    assert personal.present?
    assert_match(/\Anewbie\d*\z/, personal.slug)
    assert_equal 1, identity.accounts.personal.count
  end

  test "ensure_personal_account is idempotent" do
    identity = identities(:john)
    personal = identity.ensure_personal_account

    assert_equal accounts(:john_account), personal
    assert_equal personal, identity.ensure_personal_account
    assert_equal 1, identity.accounts.personal.count
  end

  test "ensure_personal_account creates personal when missing" do
    identity = nil
    Identity.skip_callback(:create, :after, :ensure_personal_account)
    begin
      identity = Identity.create!(email: "orphan@example.com")
    ensure
      Identity.set_callback(:create, :after, :ensure_personal_account)
    end

    assert_empty identity.accounts.personal

    personal = identity.ensure_personal_account
    assert personal.persisted?
    assert personal.personal?
    assert_equal 1, identity.accounts.personal.count
  end
end
