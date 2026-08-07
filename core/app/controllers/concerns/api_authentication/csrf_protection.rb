module ApiAuthentication::CsrfProtection
  extend ActiveSupport::Concern

  included do
    include ActionController::RequestForgeryProtection

    if Rails.application.config.action_controller.allow_forgery_protection
      protect_from_forgery with: :exception, unless: :csrf_exempt?
    end
  end

  private
    def csrf_exempt?
      bearer_authenticated? || request.get? || request.head? || request.options?
    end

    def bearer_authenticated?
      request.authorization.to_s.include?("Bearer")
    end
end
