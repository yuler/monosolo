# Allow browser apps (apps/web) to call /api/v1 with Bearer tokens.
# Credentials cookies are not used — Authorization header only.
module MonoSolo
  class CorsMiddleware
    API_PREFIX = "/api/v1"

    def self.allowed_origins
      web_port = ENV.fetch("WEB_PORT", "3000")
      [
        ENV["WEB_URL"],
        "http://web.monosolo.localhost:#{web_port}",
        "http://localhost:#{web_port}",
        "http://127.0.0.1:#{web_port}"
      ].compact.uniq
    end

    def initialize(app)
      @app = app
    end

    def call(env)
      request = Rack::Request.new(env)

      if api_request?(request)
        origin = env["HTTP_ORIGIN"]

        if request.request_method == "OPTIONS"
          return preflight_response(origin)
        end

        status, headers, body = @app.call(env)
        return [ status, cors_headers(headers, origin), body ]
      end

      @app.call(env)
    end

    private
      def api_request?(request)
        request.path.start_with?(API_PREFIX)
      end

      def allowed_origin?(origin)
        origin.present? && self.class.allowed_origins.include?(origin)
      end

      def preflight_response(origin)
        [
          204,
          cors_headers({
            "Access-Control-Allow-Methods" => "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers" => "Authorization, Content-Type, X-Account-Slug",
            "Access-Control-Max-Age" => "86400"
          }, origin),
          []
        ]
      end

      def cors_headers(headers, origin)
        headers = headers.dup
        if allowed_origin?(origin)
          headers["Access-Control-Allow-Origin"] = origin
          headers["Vary"] = [ headers["Vary"], "Origin" ].compact.join(", ")
        end
        headers
      end
  end
end

Rails.application.config.middleware.insert_before 0, MonoSolo::CorsMiddleware
