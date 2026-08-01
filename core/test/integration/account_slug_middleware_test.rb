require "test_helper"

class AccountSlugMiddlewareTest < ActionDispatch::IntegrationTest
  test "unknown account slug returns 404" do
    get "/no-such-acct/users"

    assert_response :not_found
    assert_includes response.media_type, "html"
    assert_match(/doesn'?t exist|not found/i, response.body)
  end

  test "known account slug mounts and sets current account for members" do
    sign_in_as identities(:john), account: accounts(:john_account)

    get "/john_account/users"

    assert_response :success
  end

  test "authenticated non-member receives 404" do
    sign_in_as identities(:john), account: accounts(:john_account)

    get "/yuler_account/users"

    assert_response :not_found
  end

  test "unauthenticated request to account path redirects to login" do
    get "/john_account/users"

    assert_redirected_to new_session_url(script_name: nil)
  end
end
