Rails.application.routes.draw do
  root "landings#show"

  resource :landing
  resources :home

  resource :session do
    scope module: :sessions do
      # resources :transfers
      resource :magic_link
    end
  end

  namespace :my do
    resources :accounts
  end

  scope module: :account, as: :account do
    resources :users
    get  "join/:code", to: "join#show", as: :join
    post "join/:code", to: "join#create", as: nil
    resource :join_code, only: %i[ edit update destroy ]
    resources :invitations, only: %i[ index new create ]
    resources :invitations, param: :token, only: %i[ show update destroy ]
    resource :settings, only: %i[ show update ]
    resource :payment
    # TODO: implement subscription operations later
    resource :subscription do
      # scope module: :subscriptions do
      #   resource :upgrade, only: :create
      #   resource :downgrade, only: :create
      # end
    end
    # resources :charges # billings?
  end

  namespace :webhooks do
    resource :creem
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  namespace :api do
    namespace :v1, defaults: { format: :json } do
      namespace :test do
        get :public,  to: "public#show"
        get :private, to: "private#show"
      end
    end
  end

  # Dashboard Engines
  namespace :admin do
    mount MissionControl::Jobs::Engine, at: "/jobs"
    resource :stats
  end
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  # Hotwire Spark live-reloading (dev only)
  if defined?(Hotwire::Spark) && Rails.env.development?
    mount Hotwire::Spark.cable_server => Hotwire::Spark.cable_server_path, internal: true, anchor: true
  end
end
