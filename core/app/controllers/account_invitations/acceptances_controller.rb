class AccountInvitations::AcceptancesController < ApplicationController
  skip_before_action :require_account
  before_action :set_invitation

  def show
  end

  def update
    @account_invitation.accept!

    cookies.permanent[:last_account_slug] = @account_invitation.account.slug
    redirect_to root_url(script_name: @account_invitation.account.slug_path),
      notice: "You've joined #{@account_invitation.account.name}."
  rescue RuntimeError => error
    redirect_to new_session_url(script_name: nil), alert: error.message
  end

  private
    def set_invitation
      @account_invitation = Account::Invitation.find_by!(token: params[:account_invitation_token])
    end
end
