class SessionsController < ApplicationController
  disallow_account_scope
  require_unauthenticated_access except: :destroy
  rate_limit to: 10, within: 3.minutes, only: :create, with: -> { redirect_to new_session_path, alert: "Try again later." }

  def new
  end

  def create
    if identity = Identity.find_by(email: email)
      sign_in identity
    else
      sign_up
    end
  end

  def destroy
    terminate_session
    redirect_to root_path, status: :see_other
  end

  private
    def email
      params.expect(:email)
    end

    def sign_in(identity)
      redirect_to_session_magic_link identity.send_magic_link(for: :sign_in)
    end

    def sign_up
      signup = Signup.new(email: email)

      if signup.valid?(:identity_creation)
        magic_link = signup.create_identity
        redirect_to_session_magic_link magic_link
      else
        redirect_to new_session_path, alert: signup.errors.full_messages.to_sentence
      end
    end
end
