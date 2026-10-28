# Version strings must come from the VERSION file at repo root (APP_VERSION in Docker/CI overrides it).
Rails.application.config.app_version = ENV["APP_VERSION"].presence || begin
  version_file = Rails.root.join("../VERSION")
  version_file.file? ? version_file.read.strip : "-"
end

Rails.application.config.git_revision = ENV["GIT_REVISION"].presence || begin
  `git rev-parse HEAD 2>/dev/null`.strip.presence || "-"
end
