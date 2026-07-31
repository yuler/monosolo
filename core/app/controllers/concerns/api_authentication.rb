module ApiAuthentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    before_action :require_account
    helper_method :authenticated?

    etag { Current.identity.id if authenticated? }

    include ActionController::HttpAuthentication::Token::ControllerMethods
  end

  class_methods do
    def skip_account_scope(**options)
      skip_before_action :require_account, **options
    end

    def require_unauthenticated_access(**options)
      allow_unauthenticated_access(**options)
      before_action :redirect_authenticated_user, **options
    end

    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
      allow_unauthorized_access(**options)
    end
  end

  private
    def authenticated?
      Current.identity.present?
    end

    def require_authentication
      authenticate_by_bearer_token || authenticate_by_query_token || json_request_unauthorized
    end

    def authenticate_by_bearer_token
      if request.authorization.to_s.include?("Bearer")
        if bearer_token_authenticatable_request?
          authenticate_or_request_with_http_token do |token|
            if session = Session.find_signed(token)
              Current.session = session
            elsif identity = Identity.find_by_permissable_access_token(token, method: request.method)
              Current.identity = identity
            end
          end
        else
          request_http_token_authentication
        end
      end
    end

    def bearer_token_authenticatable_request?
      request.format.json?
    end

    # NOTE: Query parameter tokens are convenient for testing but can be leaked via
    # server logs and browser history. Consider disabling this in production.
    def authenticate_by_query_token
      if token = params[:token]
        if session = Session.find_signed(token)
          Current.session = session
        elsif identity = Identity.find_by_permissable_access_token(token, method: request.method)
          Current.identity = identity
        end
      end
    end

    def json_request_unauthorized
      render json: { error: "Unauthorized" }, status: :unauthorized
    end

    def require_account
      url_slug = request.env["account_slug"]

      if url_slug.present?
        url_account = Current.account&.slug == url_slug ? Current.account : Account.find_by(slug: url_slug)
        if url_account.nil?
          json_request_account_not_found
        elsif (user = Current.identity.users.find_by(account: url_account))
          Current.account = url_account
          Current.user = user
        else
          json_request_account_not_found
        end
      elsif Current.account && (user = Current.identity.users.find_by(account: Current.account))
        Current.user = user
      elsif (personal_account = Current.identity&.personal_account)
        Current.account = personal_account
        Current.user = Current.identity.users.find_by(account: personal_account)
      else
        json_request_account_not_found
      end
    end

    def json_request_account_not_found
      render json: { error: "Account not found" }, status: :not_found
    end
end
