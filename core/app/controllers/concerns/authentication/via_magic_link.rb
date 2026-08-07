module Authentication::ViaMagicLink
  extend ActiveSupport::Concern

  included do
    include Authentication::PendingAuthenticationToken
    include Authentication::PendingAuthenticationCookies

    after_action :ensure_development_magic_link_not_leaked
  end

  private
    def ensure_development_magic_link_not_leaked
      if !Rails.env.development? && flash[:magic_link_code].present?
        raise "Leaking magic link via flash in #{Rails.env}?"
      end
    end

    def redirect_to_session_magic_link(magic_link, return_to: nil)
      serve_development_magic_link magic_link
      set_pending_authentication_token magic_link
      session[:return_to_after_authenticating] = return_to if return_to

      redirect_to main_app.session_magic_link_url(script_name: nil)
    end

    def serve_development_magic_link(magic_link)
      if Rails.env.development? && magic_link.present?
        flash[:magic_link_code] = magic_link.code
        response.set_header("X-Magic-Link-Code", magic_link.code)
      end
    end

end
