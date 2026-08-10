class Api::V1::Dev::LettersController < Api::V1::BaseController
  disallow_account_scope
  before_action :ensure_local_letters!

  def index
    letters = LetterOpenerWeb::Letter.search.first(50).filter_map do |letter|
      next unless letter.valid?

      {
        id: letter.id,
        sent_at: letter.sent_at&.iso8601,
        subject: header_value(letter, "Subject"),
        to: header_value(letter, "To"),
        from: header_value(letter, "From")
      }
    end

    render_json json: { letters: letters }
  end

  private
    def ensure_local_letters!
      unless Rails.env.local? && defined?(LetterOpenerWeb::Letter)
        head :not_found
      end
    end

    def header_value(letter, name)
      html = letter.headers.to_s
      match = html.match(%r{<dt>\s*#{Regexp.escape(name)}:?\s*</dt>\s*<dd[^>]*>(.*?)</dd>}im)
      return nil unless match

      CGI.unescapeHTML(match[1].gsub(/<[^>]+>/, "")).strip.presence
    end
end
