class Account::Invitation < ApplicationRecord
  class EmailMismatch < StandardError; end

  belongs_to :account
  belongs_to :invited_by, class_name: "User"

  has_secure_token

  validates :email, presence: true
  validates :email, uniqueness: { scope: :account_id, message: "has already been invited" }

  after_create :send_invitation_email

  def accept_url
    Rails.application.routes.url_helpers.account_invitation_accept_url(
      token,
      Rails.application.config.action_mailer.default_url_options
    )
  end

  def accept
    if email != Current.identity.email
      raise EmailMismatch, <<~message.strip
        Your email does not match the email of the invitation.
        Current logged in user email: #{Current.identity.email},
        Invitation email: #{email}
        Please sign in or sign up with the correct email.
      message
    end

    Current.identity.ensure_personal_account
    Current.identity.join(account, role: :member, verified_at: Time.current)
    destroy!
  end

  def send_invitation_email
    AccountMailer.invite(self).deliver_later
  end
end
