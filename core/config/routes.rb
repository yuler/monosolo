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
    resource :join_code
    resources :invitations
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

  get "join/:code", to: "join_codes#new", as: :join
  post "join/:code", to: "join_codes#create"

  resources :account_invitations, param: :token, only: [ :show ] do
    scope module: :account_invitations do
      # resource :accept, only: [ :show, :update ], controller: :acceptances
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  namespace :api do
    namespace :v1, defaults: { format: :json } do
      resources :users, only: [ :index, :show, :create ]
      resources :tokens, only: [ :create ]
    end
  end

  # Dashboard Engines
  namespace :admin do
    mount MissionControl::Jobs::Engine, at: "/jobs"
    resource :stats
  end
  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?
end
