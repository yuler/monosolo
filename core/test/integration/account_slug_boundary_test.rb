require "test_helper"

class AccountSlugBoundaryTest < ActionDispatch::IntegrationTest
  test "long reserved prefixes are not truncated into fake slugs" do
    get "/account_invitations/some-token-value/accept"

    # Unauthenticated → login redirect, not middleware 404 from a partial slug match
    assert_redirected_to new_session_url(script_name: nil)
  end
end
