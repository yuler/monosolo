# `rails generate controller api/v1/users --parent=Api::V1::BaseController`

class Api::V1::BaseController < ActionController::API
  include ApiAuthentication
  include Authorization
  include CurrentRequest
  include Api::V1::Responses

  rescue_from ActiveRecord::RecordNotFound do |exception|
    render json: { error: exception.message }, status: :not_found
  end
end
