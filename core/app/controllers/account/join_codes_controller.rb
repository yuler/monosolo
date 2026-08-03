class Account::JoinCodesController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { head :too_many_requests }

  before_action :set_join_code
  before_action :ensure_join_code_is_valid, only: %i[ new create ]
  before_action :ensure_admin, only: %i[ edit update destroy ]
  before_action :set_identity, only: :create

  def new
  end

  def create
    @join_code.redeem_if { |account| @identity.join(account) }
    user = User.active.find_by!(account: @join_code.account, identity: @identity)
    user.verify

    return_to_landing_url = landing_url(script_name: @join_code.account.slug_path)

    if @identity == Current.identity
      redirect_to return_to_landing_url
    else
      terminate_session if Current.identity

      redirect_to_session_magic_link \
        @identity.send_magic_link,
        return_to: return_to_landing_url
    end
  end

  def edit
  end

  def update
    if @join_code.update(join_code_params)
      redirect_back fallback_location: account_join_code_path, notice: "Join code has been updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @join_code.reset
    redirect_back fallback_location: account_join_code_path, notice: "Join code has been reset."
  end

  private
    def set_join_code
      @join_code = if action_name.in?(%w[ new create ])
        Account::JoinCode.find_by(code: params.expect(:code), account: Current.account)
      else
        Current.account.join_code
      end
    end

    def ensure_join_code_is_valid
      if @join_code.nil?
        head :not_found
      elsif !@join_code.active?
        render :inactive, status: :gone
      end
    end

    def set_identity
      @identity = Identity.find_or_initialize_by(email: params.expect(:email))

      if @identity.new_record?
        if @identity.invalid?
          head :unprocessable_entity
        else
          @identity.save!
        end
      end
    end

    def join_code_params
      params.expect account_join_code: [ :usage_limit ]
    end
end
