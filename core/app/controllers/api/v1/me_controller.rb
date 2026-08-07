class Api::V1::MeController < Api::V1::BaseController
  disallow_account_scope

  def show
    render_json json: {
      identity: {
        id: Current.identity.id,
        email: Current.identity.email,
        name: Current.identity.full_name,
        staff: Current.identity.staff?
      },
      accounts: Current.identity.accounts.order(:name).map { |account|
        {
          id: account.id,
          name: account.name,
          slug: account.slug,
          personal: account.personal?
        }
      }
    }
  end
end
