require "test_helper"

class RequestForgeryProtectionTest < ActionDispatch::IntegrationTest
  setup do
    @previous = Rails.application.config.action_controller.allow_forgery_protection
    Rails.application.config.action_controller.allow_forgery_protection = true
  end

  teardown do
    Rails.application.config.action_controller.allow_forgery_protection = @previous
  end

  test "rejects cross-site JSON POST without Sec-Fetch-Site allowance" do
    post api_v1_session_url,
      params: { email: identities(:john).email },
      as: :json,
      headers: { "Sec-Fetch-Site" => "cross-site", "Origin" => "https://evil.example.com" }

    assert_response :unprocessable_entity
    assert_equal "INVALID_CROSS_ORIGIN", response.parsed_body["code"]
  end

  test "allows JSON POST without Sec-Fetch-Site for non-browser API clients" do
    post api_v1_session_url,
      params: { email: identities(:john).email },
      as: :json

    assert_response :success
  end

  test "rejects same-origin browser POST that omits Sec-Fetch-Site but includes Sec-Fetch-Mode" do
    post api_v1_session_url,
      params: { email: identities(:john).email },
      as: :json,
      headers: { "Sec-Fetch-Mode" => "cors" }

    assert_response :unprocessable_entity
  end
end
