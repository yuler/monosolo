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
    # Atomically create an Account plus system + owner Users.
    # Used for eager personal signup and for team accounts from /my/accounts.
    # When the Identity already has a personal account, returns an unsaved Account with errors
    # so controllers can re-render the form.
    def create_with_owner(account:, owner:)
      transaction do
        if personal_account_taken?(account[:personal], owner[:identity])
          new(**account).tap do |record|
            record.errors.add(:base, "Identity already has a personal account")
          end
        else
          new_account = create(**account)
          if new_account.persisted?
            new_account.tap do |created|
              created.users.create!(role: :system, name: "System")
              created.users.create!(**owner.with_defaults(role: :owner, verified_at: Time.current))
            end
          else
            new_account
          end
        end
      end
    end

    # Normalize a name/email local-part into a free account slug (append digits on collision).
    def unique_slug_for(base)
      slug = base.to_s.parameterize(separator: "_")
      slug = slug[0, AccountSlug::LENGTH.max].to_s
      slug = "user" if slug.length < AccountSlug::LENGTH.min

      if slug_taken?(slug)
        loop do
          suffix = SecureRandom.random_number(10_000).to_s
          candidate = "#{slug[0, AccountSlug::LENGTH.max - suffix.length]}#{suffix}"
          break candidate unless slug_taken?(candidate)
        end
      else
        slug
      end
    end

    private
      def personal_account_taken?(personal, identity)
        ActiveModel::Type::Boolean.new.cast(personal) && identity&.accounts&.personal&.exists?
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

      self.slug = self.class.unique_slug_for(name)
    end

    def ensure_destroyable
      return unless personal?

      errors.add(:base, "Personal accounts cannot be deleted")
      throw :abort
    end
end
