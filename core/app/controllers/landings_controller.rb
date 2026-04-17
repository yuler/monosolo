class LandingsController < ApplicationController
  allow_unauthenticated_access

  def show
    render "home/index" unless authenticated?
  end
end
