class Account < ApplicationRecord
  include Account::Payable

  DEFAULT_SLUG_LENGTH = 8

  has_many :users, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_one :join_code, dependent: :destroy
  has_one_attached :logo

  before_create :generate_slug
  after_create :create_join_code

  validates :name, presence: true

  scope :personal, -> { where(personal: true) }
  scope :team, -> { where(personal: false) }

  class << self
    def create_with_owner(account:, owner:)
      transaction do
        new_account = create(**account)
        unless new_account.persisted?
          return new_account
        end

        new_account.tap do |account|
          account.users.create!(role: :system, name: "System")
          account.users.create!(**owner.with_defaults(role: :owner, verified_at: Time.current))
        end
      end
    end
  end

  def team?
    !personal?
  end

  def slug_path
    team? ? AccountSlug.encode(slug) : nil
  end

  def system_user
    users.find_by!(role: :system)
  end

  private
    def generate_slug
      loop do
        self.slug = Base32.generate(DEFAULT_SLUG_LENGTH)
        break slug unless self.class.exists?(slug: slug)
      end
    end
end
