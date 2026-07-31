class LandingsController < ApplicationController
  allow_unauthenticated_access
  before_action :require_account_context_when_authenticated

  def show
    render "home/index" unless authenticated?
  end

  private
    def require_account_context_when_authenticated
      return unless authenticated?
      return if Current.account.present?

      redirect_to my_accounts_url(script_name: nil)
    end
end
