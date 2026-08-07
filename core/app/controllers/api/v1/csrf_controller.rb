class Api::V1::CsrfController < Api::V1::BaseController
  allow_unauthenticated_access
  disallow_account_scope

  def show
    render_json json: { csrf_token: form_authenticity_token }
  end
end
