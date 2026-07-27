require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  test "new renders the responsive auth screen" do
    get new_session_path

    assert_response :success
    assert_select "section.auth-stage[aria-labelledby=auth-title]"
    assert_select "h1#auth-title", text: "Sign in to your workspace."
    assert_select ".auth-brand__mark svg[viewBox='-22 -22 144 136.834']"
    assert_select ".field__control .field__icon svg[stroke='currentColor']"
    assert_select "input[type=email][name=email][autocomplete=username]"
    assert_select "footer", count: 0
  end
end
