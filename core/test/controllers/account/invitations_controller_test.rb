require "test_helper"

class Account::InvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @account = accounts(:john_account)
  end

  test "new invitation form" do
    sign_in_as identities(:john), account: @account

    get new_account_invitation_path(script_name: @account.slug_path)

    assert_response :success
    assert_select "form[action=?]", account_invitations_path(script_name: @account.slug_path)
    assert_select "input[name=?]", "account_invitation[email]"
  end

  test "users index invite member links to new invitation" do
    sign_in_as identities(:john), account: @account

    get account_users_path(script_name: @account.slug_path)

    assert_response :success
    assert_select "a.btn[href=?]", new_account_invitation_path(script_name: @account.slug_path), text: "Invite Member"
  end
end
