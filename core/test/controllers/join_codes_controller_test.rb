require "test_helper"

class JoinCodesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @team = Account.create_with_owner(
      account: { name: "Join Team", personal: false, slug: "join_team" },
      owner: { name: "John", identity: identities(:john) }
    )
    @code = @team.join_code.code
  end

  test "global join url is reachable by signed-in non-member" do
    sign_in_as identities(:yuler)

    get join_path(code: @code)

    assert_response :success
  end

  test "slug-prefixed join url works for signed-in non-member of that account" do
    sign_in_as identities(:yuler)

    get "/#{@team.slug}/join/#{@code}"

    assert_response :success
  end

  test "slug-prefixed join url 404s when slug and code account disagree" do
    sign_in_as identities(:yuler)

    get "/#{accounts(:yuler_account).slug}/join/#{@code}"

    assert_response :not_found
  end

  test "signed-in non-member can redeem join code" do
    sign_in_as identities(:yuler)

    post join_path(code: @code), params: { email: identities(:yuler).email }

    assert_includes identities(:yuler).reload.accounts, @team
    assert_redirected_to landing_url(script_name: @team.slug_path)
  end

  test "unauthenticated visitor can open global join page" do
    get join_path(code: @code)

    assert_response :success
  end
end
