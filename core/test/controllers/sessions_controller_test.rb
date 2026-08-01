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

  test "sign in with one account lands on that account" do
    identity = identities(:john)
    assert_equal 1, identity.accounts.count

    post session_url(script_name: nil), params: { email: identity.email }
    magic_link = identity.magic_links.order(:created_at).last

    post session_magic_link_url(script_name: nil), params: { code: magic_link.code }

    assert_redirected_to root_url(script_name: accounts(:john_account).slug_path)
  end

  test "sign in with multiple accounts lands on account picker" do
    identity = identities(:john)
    Account.create_with_owner(
      account: { name: "John Team", personal: false, slug: "john_team" },
      owner: { name: "John", identity: identity }
    )

    post session_url(script_name: nil), params: { email: identity.email }
    magic_link = identity.magic_links.order(:created_at).last

    post session_magic_link_url(script_name: nil), params: { code: magic_link.code }

    assert_redirected_to my_accounts_url(script_name: nil)
  end
end
