require "test_helper"

class Api::V1::CsrfControllerTest < ActionDispatch::IntegrationTest
  test "show returns csrf token" do
    get api_v1_csrf_url, as: :json

    assert_response :success
    assert response.parsed_body["csrf_token"].present?
  end
end
