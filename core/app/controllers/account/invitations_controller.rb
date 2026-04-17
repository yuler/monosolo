class Account::InvitationsController < ApplicationController
  before_action :ensure_admin, only: %i[ index create ]

  def index
    @account_invitation = Account::Invitation.new
    @invitations = Current.account.invitations
  end

  def create
    @account_invitation = Current.account.invitations.new(**account_invitation_params)

    if @account_invitation.save
      redirect_to account_invitations_path, notice: "Invitation sent."
    else
      render :index, status: :unprocessable_entity
    end
  end

  private
    def account_invitation_params
      params.require(:account_invitation).permit(:email).merge(invited_by: Current.user, account: Current.account)
    end
end
