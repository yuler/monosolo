# rails-starter

An opinionated template for rapidly starting new Rails project

## ✨ Features

- Includes authentication system via `rails generate authentication`
- Uses `jsbundling-rails`, `cssbundling-rails`, and Bun for frontend asset bundling
- Defaults to using `sqlite` as the database system, but you can easily switch to `postgres` by following the [Postgres setup guide](./docs/postgres.md).
- Includes api controllers with JWT authentication
- Built-in [Accounts & Teams](./docs/accounts.md) system
- Includes [Faraday](https://github.com/lostisland/faraday) for making third-party service requests; see an example in [github_client.rb](./lib/github_client.rb)
- Includes [letter_opener](https://github.com/ryanb/letter_opener) for email preview in development
- Includes [mission_control-jobs](https://github.com/rails/mission_control-jobs) for background jobs dashboard
- Add [script/icon_download](./script/icon_download.rb) quick download from [lucide](https://lucide.dev)

## 🛠️ Getting Started

```bash
gh repo create <your_project_name> --template yuler/rails-starter --private --clone
# or
git clone https://github.com/yuler/rails-starter.git --depth=1 <your_project_name>
cd <your_project_name>
cp .env.example .env # change the configuration
bin/setup
bin/rails runner rename <your_app_name>
bin/dev
```

## 🚀 Deployment Guide

### Use docker compose

```bash
# whatever directory you want
cd ~/docker-apps/rails-starter
# Download docker compose.yml exmaple file
curl -o compose.yml https://raw.githubusercontent.com/yuler/rails-starter/main/compose.example.yml
# Download .env example file
curl -o .env https://raw.githubusercontent.com/yuler/rails-starter/main/.env.example
# Start
docker compose pull
docker compose build
docker compose up -d
# Update
docker compose pull
docker compose build
docker compose up --no-deps -d web worker
```

## 🚂 Other rails templates

- https://github.com/yshmarov/moneygun
- https://github.com/bullet-train-co/bullet_train
- https://github.com/ryanckulp/speedrail
- https://github.com/rootstrap/rails_api_base
- https://jumpstartrails.com/

## 💎 Other rails open source

- https://github.com/campsite/campsite
- https://github.com/maybe-finance/maybe
- https://github.com/basecamp/fizzy