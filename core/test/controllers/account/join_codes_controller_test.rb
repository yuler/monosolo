require "test_helper"

class Account::JoinCodesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @team = Account.create_with_owner(
      account: { name: "Join Team", personal: false, slug: "join_team" },
      owner: { name: "John", identity: identities(:john) }
    )
    @code = @team.join_code.code
  end

  test "account-scoped join url works for signed-in non-member of that account" do
    sign_in_as identities(:yuler)

    get account_join_path(code: @code, script_name: @team.slug_path)

    assert_response :success
  end

  test "account-scoped join url 404s when slug and code account disagree" do
    sign_in_as identities(:yuler)

    get account_join_path(code: @code, script_name: accounts(:yuler_account).slug_path)

    assert_response :not_found
  end

  test "signed-in non-member can redeem join code" do
    sign_in_as identities(:yuler)

    post account_join_path(code: @code, script_name: @team.slug_path), params: { email: identities(:yuler).email }

    assert_includes identities(:yuler).reload.accounts, @team
    assert_redirected_to landing_url(script_name: @team.slug_path)
  end

  test "unauthenticated redeem sends magic link without joining" do
    email = "newbie@example.com"

    assert_difference -> { MagicLink.count }, 1 do
      assert_no_difference -> { @team.users.count } do
        post account_join_path(code: @code, script_name: @team.slug_path), params: { email: email }
      end
    end

    identity = Identity.find_by!(email: email)
    assert_not_includes identity.accounts, @team
    assert_redirected_to session_magic_link_url(script_name: nil)
  end

  test "signed-in user cannot enroll a different email via join code" do
    sign_in_as identities(:yuler)
    email = "victim@example.com"

    assert_difference -> { MagicLink.count }, 1 do
      assert_no_difference -> { @team.users.count } do
        post account_join_path(code: @code, script_name: @team.slug_path), params: { email: email }
      end
    end

    identity = Identity.find_by!(email: email)
    assert_not_includes identity.accounts, @team
    assert_redirected_to session_magic_link_url(script_name: nil)
  end

  test "unauthenticated visitor can open account-scoped join page" do
    get account_join_path(code: @code, script_name: @team.slug_path)

    assert_response :success
  end
end
