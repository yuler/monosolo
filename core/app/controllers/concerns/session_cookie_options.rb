module SessionCookieOptions
  private
    def session_cookie_options
      {
        httponly: true,
        same_site: :lax,
        secure: !Rails.env.local?,
        domain: session_cookie_domain
      }.compact
    end

    def delete_session_cookie_options
      { domain: session_cookie_domain }.compact
    end

    def session_cookie_domain
      ENV["SESSION_COOKIE_DOMAIN"].presence
    end
end
