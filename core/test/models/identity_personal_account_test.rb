require "test_helper"

class IdentityPersonalAccountTest < ActiveSupport::TestCase
  test "creates personal account eagerly on identity create" do
    identity = Identity.create!(email: "newbie@example.com")

    personal = identity.accounts.personal.first
    assert personal.present?
    assert_match(/\Anewbie\d*\z/, personal.slug)
    assert_equal 1, identity.accounts.personal.count
  end
end
