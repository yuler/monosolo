class AccountMailer < ApplicationMailer
  def invite(invitation)
    @invitation = invitation
    @account = invitation.account
    @invited_by = invitation.invited_by

    mail subject: "You've been invited to join #{@account.name} on #{ENV['SITE_NAME']}", to: invitation.email
  end
end
