# Deploy to Dokploy

Production runs on Dokploy as Docker Compose in **Mode B**: one public hostname, host-only session cookies, and Nitro (TanStack Start) reverse-proxying `/api` to Rails. Always deploy as a Dokploy **Compose** service rather than an individual Application.

```text
Browser  →  Traefik (Dokploy)  →  web:3000
                                      └── /api  →  http://core:80
Solid Queue  →  worker (`bin/jobs`) on the same SQLite volume as core
```

| Piece    | Image                        | Public? | Role                               |
| :------- | :--------------------------- | :------ | :--------------------------------- |
| `web`    | `ghcr.io/yuler/monosolo-web` | Yes     | TanStack Start SSR; Traefik target |
| `core`   | `ghcr.io/yuler/monosolo`     | No      | Rails API (Thruster on port 80)    |
| `worker` | `ghcr.io/yuler/monosolo`     | No      | `bin/jobs` (Solid Queue)           |

## Files

| File                                      | Purpose                                        |
| :---------------------------------------- | :--------------------------------------------- |
| `compose.dokploy.yml`                     | Compose stack Dokploy executes                 |
| `.env.dokploy.example`                    | Template for Dokploy Environment tab           |
| `.github/workflows/core-push-image.yml`   | Build and publish `ghcr.io/yuler/monosolo`     |
| `.github/workflows/web-push-image.yml`    | Build and publish `ghcr.io/yuler/monosolo-web` |
| `.github/workflows/deploy-to-dokploy.yml` | Redeploy Compose service after push            |
| `scripts/rails-console-production.sh`     | Open Rails console in production container     |
| `scripts/db-pull-production.sh`           | Safely pull production SQLite for triage       |

Dokploy writes the Environment tab to a `.env` file next to the compose file on the server. `compose.dokploy.yml` loads it into `core` and `worker` and enforces Mode B (`SESSION_COOKIE_DOMAIN` empty, `SOLID_QUEUE_IN_PUMA=false`, `CORE_INTERNAL_URL=http://core:80`).

---

## 1. Container Images & Registry

On push to `main` (and `v*` tags), GitHub Actions publish multi-arch images tagged `main`, `sha-<short>`, and git release tags.
- `core` rebuilds when `core/**` or dependency files change.
- `web` rebuilds when `apps/web/**` or workspace files change.

> [!TIP]
> Because container builds are path-filtered, a per-commit `sha-<short>` tag only exists for services modified by that commit. For continuous deployment, use `IMAGE_TAG=main` or synchronized git release tags (`v*`).

If your GitHub repository is private, the container images on GHCR are also private. Dokploy must be granted access via **Server / Project Settings → Registry**:

- **Registry Provider:** `ghcr.io`
- **Username:** GitHub username
- **Password / Token:** GitHub Personal Access Token (PAT) with `read:packages` scope

---

## 2. Compose Service Setup in Dokploy

In the Dokploy dashboard:

1. **Create Service → Compose** (Docker Compose).
2. **General / Source:**
   - **Provider:** GitHub
   - **Repository:** `yuler/monosolo`
   - **Branch:** `main`
   - **Compose Path:** `compose.dokploy.yml`
3. **Environment:** Copy the contents of `.env.dokploy.example` and fill in required secrets.
4. **Domains:**
   - Select service: **`web`**
   - Container port: **`3000`**
   - Certificate: **HTTPS / Let's Encrypt** (or Cloudflare Origin CA)
   - Host: `monosolo.example.com` (your production domain)
5. **Deploy**: Trigger the initial deployment.

> [!IMPORTANT]
> `SITE_DOMAIN` in the Environment tab must exactly match the public domain (without `https://` scheme or port). Attach the domain only to `web` (port `3000`). `core` and `worker` stay on the internal bridge network and are never exposed directly to the public internet.

---

## 3. Environment Variables & Mode B Rules

Minimum required variables in Dokploy:

```bash
SITE_DOMAIN=monosolo.example.com
SITE_NAME=MonoSolo
IMAGE_TAG=main            # main for CD, or a synchronized release tag (e.g. v0.1.0)
SECRET_KEY_BASE=          # Generate with: cd core && bin/rails secret
```

### Forbidden Variables (Do NOT Set in Dokploy)

| Variable                 | Reason                                                                        |
| :----------------------- | :---------------------------------------------------------------------------- |
| `SESSION_COOKIE_DOMAIN`  | Parent-domain cookies are for Mode A only; Mode B requires Host-only cookies. |
| `SOLID_QUEUE_IN_PUMA`    | Dedicated `worker` container runs `bin/jobs`; Puma must not run queues.       |
| `VITE_CORE_URL`          | Must remain empty in image build so requests default to same-origin `/api`.   |
| `CORE_PORT` / `WEB_PORT` | Local Mode A development ports only; ignored in production compose.           |

---

## 4. Domain, Cloudflare CDN & TLS Configuration

For domestic access speed (China) and worldwide low latency, place Cloudflare in front of Dokploy:

1. **DNS Record:** Point your subdomain (e.g. `monosolo.example.com`) to the Dokploy server IP and turn **Proxy status ON** (Orange Cloud).
2. **SSL/TLS Mode:** Set encryption mode to **Full (strict)**.
3. **Speed & Optimization:** Under **Speed → Optimization**, enable **Brotli** and **Early Hints**.
4. **Edge Caching Rules (Caching → Cache Rules):**
   - Static hashed bundles under `/assets/*` are immutable and automatically cached at the edge.
   - **Anonymous Landing Page `GET /` Caching**: Accelerate public landing page load while keeping signed-in dashboard dynamic:
     - **Match incoming requests (Filter Expression):**
       ```text
       (http.host eq "monosolo.example.com" and http.request.uri.path eq "/" and not http.cookie contains "session_id" and not http.cookie contains "pending_authentication_token")
       ```
     - **Cache Eligibility:** **Eligible for cache**
     - **Edge TTL:** Choose **Use cache-control header if present, bypass cache if not** with **Status code TTL** of `200` → `5 minutes`, or use **Ignore cache-control header and use this TTL** set to `5 minutes` (with non-200 status codes set to **No-store**).
     - **Browser TTL:** **Respect origin** (origin sends no `Cache-Control` on `/`, so browsers do not cache the HTML document locally and instantly reflect login state).
     - **Cache Key:** Default query string handling is sufficient (or configure **Ignore query string**).

### Cache Considerations
- When Edge TTL override is active, Cloudflare strips `Set-Cookie` headers from cached responses. Anonymous `GET /` does not set cookies (authentication cookies are issued by `/api/*`).
- Upon new version deployments, `.github/workflows/deploy-to-dokploy.yml` automatically purges the landing page URL when `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_PURGE_TOKEN` are configured.

---

## 5. Persistence, SQLite & Volume Backups

`core` and `worker` share a named Docker volume:
- `core-storage:/rails/storage`
- Stores SQLite production databases (`production.sqlite3`, `production_queue.sqlite3`, `production_cache.sqlite3`, `production_cable.sqlite3`) and Active Storage blobs.

Configure Dokploy **Volume Backups** on `core-storage` for automated offsite backups.
Do not scale `worker` replicas horizontally while using SQLite on a local Docker volume.

On container boot, `core/bin/docker-entrypoint` automatically runs `bin/rails db:prepare`.

---

## 6. GitHub Actions Continuous Deployment

When changes land on `main`, `.github/workflows/deploy-to-dokploy.yml` triggers Dokploy to pull updated images and restart containers, followed by Cloudflare edge cache purging.

Required GitHub Secrets / Variables:

| Secret / Variable                | Type   | Description                                                                 |
| :------------------------------- | :----- | :-------------------------------------------------------------------------- |
| `DOKPLOY_URL`                    | Secret | Full Dokploy server URL (e.g. `https://dokploy.example.com`)                |
| `DOKPLOY_API_KEY`                | Secret | Dokploy API Token generated in Dokploy settings                             |
| `DOKPLOY_COMPOSE_APPLICATION_ID` | Secret | Compose service ID extracted from Dokploy dashboard URL                     |
| `CLOUDFLARE_ZONE_ID`             | Secret | *(Optional)* Cloudflare Zone ID for automatic cache purge                   |
| `CLOUDFLARE_PURGE_TOKEN`         | Secret | *(Optional)* Cloudflare API Token with `Zone.Cache Purge` permission        |
| `SITE_DOMAIN`                    | Var    | *(Optional)* Domain name (e.g. `monosolo.example.com`) for purging `/` URL  |

---

## 7. Remote Operations & Console

Use the production maintenance scripts to inspect the live environment:

```bash
# 1. Open interactive Rails console inside the live Dokploy core container
mise run core:console:production
# or: bash scripts/rails-console-production.sh

# 2. Safely pull a production SQLite snapshot to local development for debugging
mise run core:db:pull:production
# or: bash scripts/db-pull-production.sh
```

Ensure `PRODUCTION_HOST` is configured in your `.env.local` or environment before running.
