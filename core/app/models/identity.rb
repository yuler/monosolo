class Identity < ApplicationRecord
  include Identity::Joinable

  has_many :magic_links, dependent: :destroy
  has_many :sessions, dependent: :destroy
  has_many :users, dependent: :nullify
  has_many :accounts, through: :users

  # TODO:?
  has_one_attached :avatar

  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  normalizes :email, with: ->(value) { value.strip.downcase.presence }

  before_destroy :deactivate_users, prepend: true


  def full_name
    email.split("@").first.humanize
  end

  def personal_account
    @personal_account ||= accounts.personal.first || begin
      save! if changed?
      reload if persisted?
      with_lock do
        accounts.personal.first || create_personal_account
      end
    end
  end

  # TODO:
  def self.find_by_permissable_access_token(token, method:)
    # if (access_token = AccessToken.find_by(token: token)) && access_token.allows?(method)
    #   access_token.identity
    # end
  end

  def send_magic_link(**attributes)
    attributes[:purpose] = attributes.delete(:for) if attributes.key?(:for)

    magic_links.create!(attributes).tap do |magic_link|
      MagicLinkMailer.sign_in(magic_link).deliver_later
    end
  end

  private
    def create_personal_account
      Account.create_with_owner(
        account: {
          name: "#{full_name}'s Personal Account",
          personal: true
        },
        owner: {
          name: full_name,
          identity: self
        }
      )
    end

    def deactivate_users
      users.find_each(&:deactivate)
    end
end
