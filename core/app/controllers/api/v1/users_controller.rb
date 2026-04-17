class Api::V1::UsersController < Api::V1::BaseController
  def index
    @identities = Identity.all
    render json: @identities
  end

  def show
    @identity = Identity.find(params[:id])
    render json: @identity
  end

  def create
    @identity = Identity.create(identity_params)
    render json: @identity
  end

  private
    def identity_params
      params.require(:identity).permit(:email, :password)
    end
end
