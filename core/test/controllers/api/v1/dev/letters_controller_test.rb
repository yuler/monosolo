require "test_helper"

class Api::V1::Dev::LettersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @identity = identities(:john)
    @session = @identity.sessions.create!
    @token = @session.signed_id
  end

  test "index returns recent letters when local" do
    skip "letter_opener_web not loaded" unless defined?(LetterOpenerWeb::Letter)

    get api_v1_dev_letters_url, headers: { "Authorization" => "Bearer #{@token}" }, as: :json

    assert_response :success
    body = response.parsed_body
    assert body["letters"].is_a?(Array)
    if body["letters"].any?
      letter = body["letters"].first
      assert letter["id"].present?
      assert letter.key?("subject")
      assert letter.key?("to")
      assert letter.key?("from")
      assert letter.key?("sent_at")
    end
  end

  test "index requires authentication" do
    get api_v1_dev_letters_url, as: :json

    assert_response :unauthorized
  end
end
