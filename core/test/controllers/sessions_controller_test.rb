require "test_helper"

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup { @identity = Identity.take }
end
