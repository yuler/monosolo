class Account < ApplicationRecord
  include Account::Payable

  has_many :users, dependent: :destroy
  has_many :invitations, dependent: :destroy
  has_one :join_code, dependent: :destroy
  has_one_attached :logo

  before_validation :generate_slug, on: :create
  after_create :create_join_code
  before_destroy :ensure_destroyable

  validates :name, presence: true
  validates :slug, presence: true,
                   uniqueness: true,
                   format: { with: AccountSlug::FORMAT },
                   exclusion: { in: AccountSlug::RESERVED_SLUGS, message: "is reserved" },
                   length: { in: AccountSlug::LENGTH }

  scope :personal, -> { where(personal: true) }
  scope :team, -> { where(personal: false) }

  class << self
    def create_with_owner(account:, owner:)
      transaction do
        identity = owner[:identity] || owner["identity"]
        wants_personal = ActiveModel::Type::Boolean.new.cast(account[:personal] || account["personal"])

        if wants_personal && identity&.accounts&.personal&.exists?
          return new(**account).tap do |record|
            record.errors.add(:base, "Identity already has a personal account")
          end
        end

        new_account = create(**account)
        unless new_account.persisted?
          return new_account
        end

        new_account.tap do |created|
          created.users.create!(role: :system, name: "System")
          created.users.create!(**owner.with_defaults(role: :owner, verified_at: Time.current))
        end
      end
    end

    def unique_slug_for(base)
      unique_slug(normalize_slug_base(base))
    end

    def normalize_slug_base(base)
      candidate = base.to_s.parameterize(separator: "_")
      candidate = candidate[0, AccountSlug::LENGTH.max].to_s
      candidate = "user" if candidate.length < AccountSlug::LENGTH.min
      candidate
    end

    def unique_slug(base)
      return base unless slug_taken?(base)

      loop do
        suffix = SecureRandom.random_number(10_000).to_s
        max_base = AccountSlug::LENGTH.max - suffix.length
        candidate = "#{base[0, max_base]}#{suffix}"
        break candidate unless slug_taken?(candidate)
      end
    end

    def slug_taken?(value)
      value.in?(AccountSlug::RESERVED_SLUGS) || exists?(slug: value)
    end
  end

  def team?
    !personal?
  end

  def slug_path
    AccountSlug.encode(slug)
  end

  def system_user
    users.find_by!(role: :system)
  end

  private
    def generate_slug
      return if slug.present?

      self.slug = self.class.unique_slug(self.class.normalize_slug_base(name))
    end

    def ensure_destroyable
      return unless personal?

      errors.add(:base, "Personal accounts cannot be deleted")
      throw :abort
    end
end
