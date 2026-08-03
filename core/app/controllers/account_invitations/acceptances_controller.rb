class AccountInvitations::AcceptancesController < ApplicationController
  disallow_account_scope
  before_action :set_invitation

  def show
  end

  def update
    @account_invitation.accept

    cookies.permanent[:last_account_slug] = @account_invitation.account.slug
    redirect_to root_url(script_name: @account_invitation.account.slug_path),
      notice: "You've joined #{@account_invitation.account.name}."
  rescue Account::Invitation::EmailMismatch => error
    redirect_to account_invitation_accept_path(@account_invitation.token), alert: error.message
  end

  def destroy
    account_name = @account_invitation.account.name
    @account_invitation.destroy!

    redirect_to my_accounts_url(script_name: nil),
      notice: "Declined invitation to #{account_name}."
  end

  private
    def set_invitation
      @account_invitation = Account::Invitation.find_by!(token: params[:account_invitation_token])
    end
end
