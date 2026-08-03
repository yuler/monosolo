class Account::JoinCodesController < ApplicationController
  allow_unauthenticated_access only: :show
  allow_unauthorized_access only: :create
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { head :too_many_requests }

  before_action :set_join_code
  before_action :ensure_join_code_is_valid, only: %i[ show create ]
  before_action :ensure_admin, only: %i[ edit update destroy ]

  def show
    if Current.identity.blank?
      session[:return_to_after_authenticating] = account_join_codes_url(
        @join_code.code,
        script_name: @join_code.account.slug_path
      )
    end
  end

  def create
    @join_code.redeem_if { |account| Current.identity.join(account) }
    user = User.active.find_by!(account: @join_code.account, identity: Current.identity)
    user.verify

    redirect_to landing_url(script_name: @join_code.account.slug_path)
  end

  def edit
  end

  def update
    if @join_code.update(join_code_params)
      redirect_back fallback_location: edit_account_join_code_path, notice: "Join code has been updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @join_code.reset
    redirect_back fallback_location: edit_account_join_code_path, notice: "Join code has been reset."
  end

  private
    def set_join_code
      @join_code = if action_name.in?(%w[ show create ])
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

    def join_code_params
      params.expect account_join_code: [ :usage_limit ]
    end
end
