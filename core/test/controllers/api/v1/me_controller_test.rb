require "test_helper"

class Api::V1::MeControllerTest < ActionDispatch::IntegrationTest
  setup do
    @identity = identities(:john)
    @session = @identity.sessions.create!
    @token = @session.signed_id
  end

  test "show returns identity and accounts" do
    get api_v1_me_url, headers: { "Authorization" => "Bearer #{@token}" }, as: :json

    assert_response :success
    body = response.parsed_body
    assert_equal @identity.id, body["identity"]["id"]
    assert_equal @identity.email, body["identity"]["email"]
    assert_equal @identity.full_name, body["identity"]["name"]
    assert_equal @identity.staff?, body["identity"]["staff"]
    assert body["accounts"].any? { |account| account["slug"] == accounts(:john_account).slug }
  end

  test "show requires authentication" do
    get api_v1_me_url, as: :json

    assert_response :unauthorized
  end
end
