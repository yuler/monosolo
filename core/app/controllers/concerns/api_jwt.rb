require "jwt"

module ApiJwt
  extend ActiveSupport::Concern

  SECRET_KEY = Rails.application.secret_key_base

  def generate_identity_jwt_token(identity)
    jwt_encode({ identity_id: identity.id })
  end

  def authenticate_identity_from_jwt_token(token)
    if token.blank?
      return nil
    end

    decoded_token = jwt_decode(token)
    if !decoded_token["identity_id"].present?
      return nil
    end

    Identity.find_by(id: decoded_token["identity_id"])
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  private
    def jwt_encode(payload, expires_in: 1.years.from_now)
      payload[:exp] = expires_in.to_i
      JWT.encode(payload, SECRET_KEY, "HS256")
    end

    def jwt_decode(token)
      JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })[0]
    end
end
