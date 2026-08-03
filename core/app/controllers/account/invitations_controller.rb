class Account::InvitationsController < ApplicationController
  allow_unauthenticated_access only: :show
  allow_unauthorized_access only: %i[ update destroy ]

  before_action :ensure_admin, only: %i[ index new create ]
  before_action :set_invitation_by_token, only: %i[ show update destroy ]

  def index
    @account_invitation = Account::Invitation.new
    @invitations = Current.account.invitations
  end

  def new
    @invitation = Current.account.invitations.new
  end

  def create
    @account_invitation = Current.account.invitations.new(**account_invitation_params)

    if @account_invitation.save
      redirect_to account_invitations_path, notice: "Invitation sent."
    else
      @invitation = @account_invitation
      @invitations = Current.account.invitations
      render :new, status: :unprocessable_entity
    end
  end

  def show
    if Current.identity.blank?
      session[:return_to_after_authenticating] = account_invitation_url(
        @account_invitation.token,
        script_name: @account_invitation.account.slug_path
      )
    end
  end

  def update
    @account_invitation.accept

    cookies.permanent[:last_account_slug] = @account_invitation.account.slug
    redirect_to root_url(script_name: @account_invitation.account.slug_path),
      notice: "You've joined #{@account_invitation.account.name}."
  rescue Account::Invitation::EmailMismatch => error
    redirect_to account_invitation_path(@account_invitation.token), alert: error.message
  end

  def destroy
    ensure_invitation_email_matches!

    account_name = @account_invitation.account.name
    @account_invitation.destroy!

    redirect_to my_accounts_url(script_name: nil),
      notice: "Declined invitation to #{account_name}."
  rescue Account::Invitation::EmailMismatch => error
    redirect_to account_invitation_path(@account_invitation.token), alert: error.message
  end

  private
    def account_invitation_params
      params.require(:account_invitation).permit(:email).merge(invited_by: Current.user, account: Current.account)
    end

    def set_invitation_by_token
      @account_invitation = Current.account.invitations.find_by!(token: params.expect(:token))
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
