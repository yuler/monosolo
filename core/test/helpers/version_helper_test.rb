require "test_helper"

class VersionHelperTest < ActionView::TestCase
  test "app_version_badge renders current app version" do
    assert_includes app_version_badge, Rails.application.config.app_version
    assert_includes app_version_badge, "app-version-badge"
  end

  test "git_revision_badge renders current git revision slice" do
    assert_includes git_revision_badge, Rails.application.config.git_revision.slice(0, 7)
    assert_includes git_revision_badge, "git-revision-badge"
  end
end
