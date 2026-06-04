module AccountSlug
  PATTERN = /([a-zA-Z0-9_-]{4,16})/
  FORMAT = /\A[a-z0-9\-_]+\z/i
  LENGTH = 4..16
  PATH_INFO_MATCH = /\A(\/#{AccountSlug::PATTERN})/

  # Top-level route prefixes that must never be confused with an account slug.
  # Keep this in sync with config/routes.rb.
  RESERVED_SLUGS = %w[
    account_invitations
    admin
    api
    assets
    billing
    cable
    dev
    device
    help
    home
    join
    jobs
    landing
    landings
    letter_opener
    login
    logout
    magic_link
    my
    rails
    session
    settings
    setup
    static
    support
    up
    webhooks
  ].freeze

  class Extractor
    def initialize(app)
      @app = app
    end

    # We're using account slug prefixes in the URL path. Rather than namespace
    # all our routes, we "mount" the Rails app at that prefix for web requests.
    # For JSON API requests we keep the path intact and only stash the slug.
    def call(env)
      request = ActionDispatch::Request.new(env)

      # API: /api/v\d+/accounts/:account_slug/... → strip "/accounts/:slug",
      # so a single route at /api/v\d+/... serves both slug-scoped and unscoped calls.
      # $1 = "/api/v1", $2 = :account_slug, $' = remaining path (e.g. "/test/private")
      if request.path_info =~ %r{\A(/api/v\d+)/accounts/(#{AccountSlug::PATTERN})} && !$2.in?(RESERVED_SLUGS)
        env["account_slug"] = AccountSlug.decode($2)
        request.path_info = $'.empty? ? $1 : "#{$1}#{$'}"
      # Other API paths never carry an account slug
      elsif request.path_info.start_with?("/api")
        env["account_slug"] = nil
      # Action Cable reconnect: SCRIPT_NAME already carries the slug
      elsif request.script_name && request.script_name =~ PATH_INFO_MATCH && !$2.in?(RESERVED_SLUGS)
        env["account_slug"] = AccountSlug.decode($2)
      # Web: /<slug>/... → move the slug to SCRIPT_NAME so all routes mount under it
      elsif request.path_info =~ PATH_INFO_MATCH && !$2.in?(RESERVED_SLUGS)
        request.engine_script_name = request.script_name = $1
        request.path_info = $'.empty? ? "/" : $'
        env["account_slug"] = AccountSlug.decode($2)
      end

      if env["account_slug"]
        account = Account.find_by(slug: env["account_slug"])
        Current.with_account(account) do
          @app.call env
        end
      else
        Current.without_account do
          @app.call env
        end
      end
    end
  end

  # Decode slug from URL form to the lookup key.
  def self.decode(slug) slug.to_s end
  # Encode an Account#slug into the SCRIPT_NAME prefix used by view helpers.
  # Example: `root_path(script_name: account.slug_path)` → "/<slug>"
  def self.encode(slug) "/#{slug}" end
end

Rails.application.config.middleware.insert_after Rack::TempfileReaper, AccountSlug::Extractor