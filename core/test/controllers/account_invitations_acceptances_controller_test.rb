require "test_helper"

class AccountInvitationsAcceptancesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @account = accounts(:john_account)
    @invitation = Account::Invitation.create!(
      account: @account,
      email: "newbie@example.com",
      invited_by: users(:john)
    )
  end

  test "show requires authentication" do
    get account_invitation_accept_path(@invitation.token)

    assert_redirected_to new_session_url(script_name: nil)
  end

  test "show renders confirmation without joining" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    get account_invitation_accept_path(@invitation.token)

    assert_response :success
    assert_select "h2", text: "Join #{@account.name}"
    assert_select "button", text: "Accept invitation"
    assert_select "button", text: "Decline"
    assert_not_includes identity.reload.accounts, @account
    assert Account::Invitation.exists?(@invitation.id)
  end

  test "accepting joins account and lands on that account" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    put account_invitation_accept_path(@invitation.token)

    assert_includes identity.reload.accounts, @account
    assert_redirected_to root_url(script_name: @account.slug_path)
    assert_equal @account.slug, cookies[:last_account_slug]
    assert_nil Account::Invitation.find_by(id: @invitation.id)
  end

  test "declining removes invitation without joining" do
    identity = Identity.create!(email: "newbie@example.com")
    sign_in_as identity

    delete account_invitation_accept_path(@invitation.token)

    assert_not_includes identity.reload.accounts, @account
    assert_nil Account::Invitation.find_by(id: @invitation.id)
    assert_redirected_to my_accounts_url(script_name: nil)
  end

  test "declining with mismatched email keeps invitation" do
    identity = Identity.create!(email: "other@example.com")
    sign_in_as identity

    delete account_invitation_accept_path(@invitation.token)

    assert Account::Invitation.exists?(@invitation.id)
    assert_redirected_to account_invitation_accept_path(@invitation.token)
  end

  test "accepting with mismatched email stays on confirmation" do
    identity = Identity.create!(email: "other@example.com")
    sign_in_as identity

    put account_invitation_accept_path(@invitation.token)

    assert_not_includes identity.reload.accounts, @account
    assert Account::Invitation.exists?(@invitation.id)
    assert_redirected_to account_invitation_accept_path(@invitation.token)
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

    put account_invitation_accept_path(@invitation.token)

    assert_includes identity.reload.accounts, @account
    assert identity.accounts.personal.exists?
    assert_redirected_to root_url(script_name: @account.slug_path)
  end
end
