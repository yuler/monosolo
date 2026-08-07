module Authentication::PendingAuthenticationCookies
  extend ActiveSupport::Concern

  private
    def set_pending_authentication_token(magic_link)
      cookies[:pending_authentication_token] = auth_cookie_options(magic_link.expires_at).merge(
        value: generate_pending_authentication_token(magic_link)
      )
    end

    def pending_authentication_token
      params[:pending_authentication_token].presence || cookies[:pending_authentication_token]
    end

    def email_pending_authentication
      verify_pending_authentication_token(pending_authentication_token)
    end

    def clear_pending_authentication_token
      cookies.delete(:pending_authentication_token, **delete_auth_cookie_options)
    end

    def auth_cookie_options(expires = nil)
      {
        httponly: true,
        same_site: :lax,
        secure: !Rails.env.local?,
        domain: session_cookie_domain,
        expires: expires
      }.compact
    end

    def delete_auth_cookie_options
      { domain: session_cookie_domain }.compact
    end

    def session_cookie_domain
      ENV["SESSION_COOKIE_DOMAIN"].presence
    end
end
