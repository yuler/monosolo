module Authentication::SessionCookies
  extend ActiveSupport::Concern

  private
    def find_session_by_cookie
      Session.find_signed(cookies.signed[:session_id])
    end

    def set_current_session(session)
      Current.session = session
      cookies.signed.permanent[:session_id] = session_cookie_options.merge(value: session.signed_id)
    end

    def terminate_session
      Current.session&.destroy
      cookies.delete(:session_id, **delete_session_cookie_options)
    end

    def start_new_session_for(identity)
      identity.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
        set_current_session session
      end
    end

    def session_token
      Current.session.signed_id
    end

    def session_id
      cookies[:session_id]
    end

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
