require "test_helper"

class Account::InvitationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @account = accounts(:john_account)
    @invitation = Account::Invitation.create!(
      account: @account,
      email: "newbie@example.com",
      invited_by: users(:john)
    )
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

  test "show prompts guests to login and remembers return path" do
    get account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_response :success
    assert_select "h2", text: "Join #{@account.name}"
    assert_select "a", text: "Login"
    assert_select "button", text: "Accept invitation", count: 0
    assert_select "button", text: "Decline", count: 0
    assert_equal account_invitation_url(@invitation.token, script_name: @account.slug_path),
      session[:return_to_after_authenticating]
  end

  test "show renders accept and decline when signed in as invitee" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    get account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_response :success
    assert_select "h2", text: "Join #{@account.name}"
    assert_match(/Signed in as #{Regexp.escape(identity.email)}/, response.body)
    assert_select "button", text: "Accept invitation"
    assert_select "button", text: "Decline"
    assert_select "a", text: "Login", count: 0
    assert_not_includes identity.reload.accounts, @account
    assert Account::Invitation.exists?(@invitation.id)
  end

  test "show offers login instead of accept when signed in as someone else" do
    identity = Identity.create!(email: "other@example.com")
    sign_in_as identity

    get account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_response :success
    assert_match(/Signed in as #{Regexp.escape(identity.email)}/, response.body)
    assert_select "button", text: "Login"
    assert_select "button", text: "Accept invitation", count: 0
    assert_select "button", text: "Decline", count: 0
  end

  test "accept and decline stay auth-protected for guests" do
    put account_invitation_path(@invitation.token, script_name: @account.slug_path)
    assert_redirected_to new_session_url(script_name: nil)

    delete account_invitation_path(@invitation.token, script_name: @account.slug_path)
    assert_redirected_to new_session_url(script_name: nil)
    assert Account::Invitation.exists?(@invitation.id)
  end

  test "accepting joins account and lands on that account" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    put account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_includes identity.reload.accounts, @account
    assert_redirected_to root_url(script_name: @account.slug_path)
    assert_equal @account.slug, cookies[:last_account_slug]
    assert_nil Account::Invitation.find_by(id: @invitation.id)
  end

  test "declining removes invitation without joining" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    delete account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_not_includes identity.reload.accounts, @account
    assert_nil Account::Invitation.find_by(id: @invitation.id)
    assert_redirected_to my_accounts_url(script_name: nil)
  end

  test "declining with mismatched email keeps invitation" do
    identity = Identity.create!(email: "other@example.com")
    sign_in_as identity

    delete account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert Account::Invitation.exists?(@invitation.id)
    assert_redirected_to account_invitation_path(@invitation.token)
  end

  test "accepting with mismatched email stays on confirmation" do
    identity = Identity.create!(email: "other@example.com")
    sign_in_as identity

    put account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_not_includes identity.reload.accounts, @account
    assert Account::Invitation.exists?(@invitation.id)
    assert_redirected_to account_invitation_path(@invitation.token)
  end

  test "accepting creates personal account when missing" do
    identity = nil
    Identity.skip_callback(:create, :after, :ensure_personal_account)
    begin
      identity = Identity.create!(email: "newbie@example.com")
    ensure
      Identity.set_callback(:create, :after, :ensure_personal_account)
    end

    assert_empty identity.accounts.personal
    sign_in_as identity

    put account_invitation_path(@invitation.token, script_name: @account.slug_path)

    assert_includes identity.reload.accounts, @account
    assert identity.accounts.personal.exists?
    assert_redirected_to root_url(script_name: @account.slug_path)
  end

  test "invitation for another account slug returns 404" do
    sign_in_as identities(:yuler)

    get account_invitation_path(@invitation.token, script_name: accounts(:yuler_account).slug_path)

    assert_response :not_found
  end
end
