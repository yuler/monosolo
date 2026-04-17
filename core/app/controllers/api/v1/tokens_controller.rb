class Api::V1::TokensController < Api::V1::BaseController
  # allow_api_unauthenticated_access only: :create
  skip_api_authentication only: :create

  def create
    @identity = Identity.authenticate_by(identity_params)

    if @identity
      render_json_created(json: { token: generate_identity_jwt_token(@identity) })
    else
      render_json_unauthorized
    end
  end

  private
    def identity_params
      params.permit(:email, :password)
    end
end
