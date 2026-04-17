# `rails generate controller api/v1/users --parent=Api::V1::BaseController`

class Api::V1::BaseController < ApplicationController
  include ApiJwt

  # Setup rate limit, refs: https://api.rubyonrails.org/classes/ActionController/RateLimiting/ClassMethods.html
  rate_limit to: 10, within: 1.minute, with: -> { render_json_too_many_requests }

  # Skip regular session-based authentication for API
  skip_authentication

  # Skip CSRF protection for API endpoints
  skip_before_action :verify_authenticity_token

  # API authentication
  before_action :require_api_authentication

  class << self
    def allow_api_unauthenticated_access(**options)
      skip_before_action :require_api_authentication, **options
    end
    alias_method :skip_api_authentication, :allow_api_unauthenticated_access
  end

  # JSON responses
  def render_json_ok
    render json: { message: "OK" }, status: :ok
  end
  def render_json_created(json: {})
    render json: json, status: :created
  end
  def render_json_unauthorized
    render_json_error(status: :unauthorized, message: "Unauthorized", code: "UNAUTHORIZED")
  end
  def render_json_not_found
    render_json_error(status: :not_found, message: "Not Found", code: "NOT_FOUND")
  end
  def render_json_too_many_requests
    render_json_error(status: :too_many_requests, message: "Too Many Requests", code: "TOO_MANY_REQUESTS")
  end
  def render_json_error(status:, message:, code: nil)
    render json: { code:, message: }, status:
  end
  def render_json(json: {}, status: :ok)
    render json: json, status: status
  end

  private
    def require_api_authentication
      current_identity || render_json_unauthorized
    end

    def find_identity_by_jwt_token
      authenticate_identity_from_jwt_token(extract_jwt_token)
    end

    def extract_jwt_token
      # Bearer token
      authorization_header = request.headers["Authorization"]
      return authorization_header.split(" ").last if authorization_header&.start_with?("Bearer ")

      # Fallback to query parameter
      params[:token]
    end

    def current_identity
      @current_identity ||= find_identity_by_jwt_token
    end
end
