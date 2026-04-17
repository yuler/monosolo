class Account::JoinCodesController < ApplicationController
  before_action :set_join_code
  before_action :ensure_admin, only: %i[ edit update destroy ]

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
      @join_code = Current.account.join_code
    end

    def join_code_params
      params.expect account_join_code: [ :usage_limit ]
    end
end
