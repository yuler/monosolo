module AccountSlug
  PATTERN = /([a-zA-Z0-9_-]+)/
  PATH_INFO_MATCH = /\A(\/teams\/#{PATTERN})/

  class Extractor
    def initialize(app)
      @app = app
    end

    # We're using account id prefixes in the URL path. Rather than namespace
    # all our routes, we're "mounting" the Rails app at this URL prefix.
    def call(env)
      request = ActionDispatch::Request.new(env)

      # $1, $2, $' == script_name, account_slug, path_info
      if request.script_name && request.script_name =~ PATH_INFO_MATCH
        # Likely due to restarting the action cable connection after upgrade
        env["account_slug"] = AccountSlug.decode($2)
      elsif request.path_info =~ PATH_INFO_MATCH
        # Yanks the prefix off PATH_INFO and move it to account_slug
        request.engine_script_name = request.script_name = $1
        request.path_info   = $'.empty? ? "/" : $'

        # Stash the account's Queenbee ID.
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

  def self.decode(slug) slug end
  def self.encode(slug) "/teams/#{slug}/" end
end

Rails.application.config.middleware.insert_after Rack::TempfileReaper, AccountSlug::Extractor
