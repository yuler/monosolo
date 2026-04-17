module Authorization
  extend ActiveSupport::Concern

  included do
    before_action :ensure_can_access_account, if: -> { Current.account.present? && authenticated? }
  end

  class_methods do
    def allow_unauthorized_access(**options)
      skip_before_action :ensure_can_access_account, **options
    end

    def require_access_without_a_user(**options)
      skip_before_action :ensure_can_access_account, **options
      before_action :redirect_existing_user, **options
    end
  end

  private
    def ensure_staff
      head :forbidden unless Current.identity.staff?
    end

    def ensure_admin
      head :forbidden unless Current.user.admin?
    end

    def ensure_can_access_account
      if Current.user.blank? || !Current.user.active?
        head :forbidden
      end
    end

    def redirect_existing_user
      if Current.user
        redirect_to root_path, alert: "You are already signed in."
      end
    end
end
