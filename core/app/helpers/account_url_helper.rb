module AccountUrlHelper
  def sign_in_path
    main_app.new_session_path(script_name: nil)
  end

  def sign_out_path
    main_app.session_path(script_name: nil)
  end

  def my_accounts_path
    main_app.my_accounts_path(script_name: nil)
  end

  def my_accounts_url
    main_app.my_accounts_url(script_name: nil)
  end
end
