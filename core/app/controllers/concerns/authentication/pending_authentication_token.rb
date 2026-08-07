module Authentication::PendingAuthenticationToken
  extend ActiveSupport::Concern

  private
    def generate_pending_authentication_token(magic_link)
      pending_authentication_token_verifier.generate(
        magic_link.identity.email,
        expires_at: magic_link.expires_at
      )
    end

    def verify_pending_authentication_token(token)
      pending_authentication_token_verifier.verified(token)
    end

    def pending_authentication_token_verifier
      Rails.application.message_verifier(:pending_authentication)
    end
end
