class AccountInvitations::AcceptancesController < ApplicationController
  disallow_account_scope
  allow_unauthenticated_access only: :show
  before_action :set_invitation

  def show
    if Current.identity.blank?
      session[:return_to_after_authenticating] = account_invitation_accept_url(
        @account_invitation.token,
        script_name: nil
      )
    end
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
    ensure_invitation_email_matches!

    account_name = @account_invitation.account.name
    @account_invitation.destroy!

    redirect_to my_accounts_url(script_name: nil),
      notice: "Declined invitation to #{account_name}."
  rescue Account::Invitation::EmailMismatch => error
    redirect_to account_invitation_accept_path(@account_invitation.token), alert: error.message
  end

  private
    def set_invitation
      @account_invitation = Account::Invitation.find_by!(token: params[:account_invitation_token])
    end

    def ensure_invitation_email_matches!
      if @account_invitation.email != Current.identity.email
        raise Account::Invitation::EmailMismatch, <<~message.strip
          Your email does not match the email of the invitation.
          Current logged in user email: #{Current.identity.email},
          Invitation email: #{@account_invitation.email}
          Please sign in or sign up with the correct email.
        message
      end
    end
end
