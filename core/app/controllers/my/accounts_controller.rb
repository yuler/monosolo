class My::AccountsController < ApplicationController
  def new
    @account = Current.identity.accounts.new
  end

  def create
    @account = Account.create_with_owner(
      account: account_params,
      owner: {
        name: Current.identity.full_name,
        identity: Current.identity
      }
    )

    if @account.persisted?
      redirect_to my_accounts_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  def index
    @accounts = Current.identity.accounts

    # TODO:
    # if @accounts.one?
    #   redirect_to root_url(script_name: @accounts.first.slug_path)
    # end
  end

  private
    def account_params
      params.expect(account: [ :name, :description ])
    end
end
