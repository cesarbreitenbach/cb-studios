# CB Studios — Production Deploy Runbook

This is the operator checklist for shipping **cb-studios** onto the **same server** that already
runs **Probody** and **Luckyblock** behind a **shared Caddy** reverse proxy.

cb-studios runs as three containers defined in `docker-compose.prod.yml` at the repo root:

| Service | Role | Host port | How it's reached |
| ------- | ---- | --------- | ---------------- |
| `cb-db` | Postgres 16 | none (internal) | only by `cb-api` over `cb-internal` |
| `cb-api` | Express + Drizzle (tsx) | none (`expose 3001`) | only by `cb-web` over `cb-internal` |
| `cb-web` | Vite/React SSR (tsx) | none (`expose 3000`) | by the shared Caddy over the external `caddy` network |

No host ports are published. The **only** public entrypoint is the existing Probody Caddy, which
reverse-proxies `*.agendou.vip` and `agendou.vip` to `cb-web:3000`.

Tenant routing in production is by **subdomain**: `<slug>.agendou.vip` → studio `slug`
(e.g. `bruna.agendou.vip`). The apex + `/s/:slug` path form is kept only for dev.

> Replace `SERVER_IP` below with the public IP of the shared server.

---

## 1. DNS (Cloudflare)

In the Cloudflare dashboard for the **agendou.vip** zone, create two A records:

| Type | Name             | Content     | Notes |
| ---- | ---------------- | ----------- | ----- |
| A    | `*` (`*.agendou.vip`) | `SERVER_IP` | wildcard — covers every studio subdomain |
| A    | `@` (`agendou.vip`)   | `SERVER_IP` | apex |

Proxy status (orange cloud "Proxied" vs grey "DNS only") does **not** matter for issuing the
certificate: Caddy uses a **DNS-01** ACME challenge (it edits a TXT record via the Cloudflare API),
not an HTTP challenge, so either setting works. Proxied is fine.

---

## 2. Cloudflare API token (for Caddy DNS-01)

Caddy needs a Cloudflare API token to solve the DNS-01 wildcard challenge.

1. **Revoke the old leaked token first** (see Security section) — the previously-leaked token must
   no longer be valid.
2. Cloudflare dashboard → **My Profile → API Tokens → Create Token**.
3. Use a template/custom token scoped to **Zone → DNS → Edit**, restricted to the
   **agendou.vip** zone only (Zone Resources: Include → Specific zone → agendou.vip).
4. Create the token and copy the value **once**.
5. Provide it to Caddy on the server as the environment variable **`CLOUDFLARE_API_TOKEN`**
   (e.g. in Caddy's compose `environment:` / its own `.env`, or the systemd unit running Caddy).
   **Do not commit this value anywhere.** The Caddyfile references it only as
   `{env.CLOUDFLARE_API_TOKEN}`.

---

## 3. Caddy (the shared Probody Caddy)

The existing Caddy must (a) include the Cloudflare DNS module and (b) be on a docker network that
`cb-web` also joins.

1. **Cloudflare DNS module.** The DNS-01 challenge requires the `caddy-dns/cloudflare` plugin.
   Standard Caddy does **not** ship it. Either:
   - rebuild Caddy with it: `xcaddy build --with github.com/caddy-dns/cloudflare`, or
   - use a Caddy image that already bundles the Cloudflare DNS plugin.
   Restart Caddy with the new binary/image.

2. **Token env.** Ensure `CLOUDFLARE_API_TOKEN` (from step 2) is present in Caddy's environment.

3. **Add the snippet.** Append the block from [`deploy/Caddyfile.snippet`](deploy/Caddyfile.snippet)
   to Probody's existing Caddyfile:

   ```caddy
   *.agendou.vip, agendou.vip {
       tls {
           dns cloudflare {env.CLOUDFLARE_API_TOKEN}
       }
       reverse_proxy cb-web:3000
   }
   ```

4. **Shared network.** `cb-web` reaches Caddy by container name, so they must share a docker
   network. In `docker-compose.prod.yml`, `cb-web` joins the external network **`caddy`**
   (declared `external: true`), which is the network the Probody Caddy container is already on.
   Confirm that network exists before bringing cb-studios up:

   ```bash
   docker network ls | grep caddy
   # if it does not exist (it should, from Probody):  docker network create caddy
   ```

5. **Reload Caddy** to pick up the new snippet:

   ```bash
   docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
   # or restart the Caddy container, depending on how Probody runs it
   ```

   Caddy will request the `*.agendou.vip` + `agendou.vip` certificate via DNS-01 on first request.

---

## 4. Server bootstrap (first deploy)

On the shared server:

1. **Clone the repo** (wherever your other stacks live):

   ```bash
   git clone <REPO_URL> cb-studios
   cd cb-studios
   ```

2. **Create the gitignored `.env`** next to `docker-compose.prod.yml` with strong values.
   `.env` is already in `.gitignore` — never commit it.

   ```bash
   cat > .env <<'EOF'
   POSTGRES_PASSWORD=<strong-random-password>
   JWT_SECRET=<strong-random-secret>
   EOF
   chmod 600 .env
   ```

   Generate strong values, e.g.:

   ```bash
   openssl rand -base64 32   # run twice, one for each
   ```

   These feed the compose interpolation:
   - `cb-db`: `POSTGRES_PASSWORD=${POSTGRES_PASSWORD}` (`POSTGRES_USER=cb`, `POSTGRES_DB=cbstudios`)
   - `cb-api`: `DATABASE_URL=postgres://cb:${POSTGRES_PASSWORD}@cb-db:5432/cbstudios` and `JWT_SECRET=${JWT_SECRET}`

   (`CLOUDFLARE_API_TOKEN` belongs to **Caddy**, not to this `.env`.)

3. **Build and start** the stack. Builds use the **repo root** as context (so `packages/shared`
   is included); the Dockerfiles live at `apps/api/Dockerfile` and `apps/web/Dockerfile`.

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

   On boot, **`cb-api` runs migrations automatically** (`db:migrate` then `start`), so the schema
   is created on first run. Migrations live in `apps/api/drizzle/`. The app runs TypeScript
   directly via `tsx` — there is no JS transpile step.

4. **Seed Bruna once** (the first studio + its admin):

   ```bash
   docker compose -f docker-compose.prod.yml exec -T cb-api npm -w apps/api run db:seed
   ```

   Run this only on the first deploy. Then **change Bruna's seed password** (see Security).

---

## 5. GitHub repo + Actions secrets

CI deploys on push to `main`: SSH to the server, pull latest, rebuild, and run migrations.

In the GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
| ------ | ----- |
| `DEPLOY_HOST` | the server's host/IP (`SERVER_IP`) |
| `DEPLOY_USER` | the SSH user used for deploys |
| `DEPLOY_SSH_KEY` | private SSH key authorized for `DEPLOY_USER` on the server |

> These must match how **Luckyblock** already deploys to this server (same host/user/key
> convention) — reuse the existing deploy identity rather than inventing a new one.

The workflow runs, on the server:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T cb-api npm -w apps/api run db:migrate
```

`POSTGRES_PASSWORD` and `JWT_SECRET` are **not** GitHub secrets — they live only in the server-side
`.env` created in step 4 (or the compose environment).

---

## 6. Verify

After the stack is up and Caddy has issued the wildcard cert:

- Public site loads: <https://bruna.agendou.vip>
- Admin loads: <https://bruna.agendou.vip/admin>

If TLS fails, check Caddy's logs for the DNS-01 challenge (token scope/zone, Cloudflare module
present). If you get a 502, confirm `cb-web` is on the `caddy` network and healthy
(`docker compose -f docker-compose.prod.yml ps`).

---

## 7. Adding a new studio later

No new infrastructure is needed — the wildcard cert and `reverse_proxy cb-web:3000` already cover
every subdomain. To onboard a studio:

1. Insert a `studios` row whose **`slug`** is the desired subdomain label
   (e.g. `slug = 'studiox'` → `studiox.agendou.vip`). There is no separate
   `subdomain` column — the slug *is* the subdomain label.
2. Create that studio's admin user (a `admins` row with a bcrypt `password_hash`).

`<slug>.agendou.vip` resolves via the `*.agendou.vip` DNS record + wildcard TLS automatically.
No DNS change, no Caddy change, no redeploy.

---

## Security

- **Rotate the leaked token.** A Cloudflare API token leaked earlier and is being rotated.
  **Revoke it in Cloudflare** and replace it with the new Zone:DNS:Edit token from step 2.
  The leaked value must never be written into any file or commit — reference it only as
  `CLOUDFLARE_API_TOKEN`.
- **Never commit `.env`.** `POSTGRES_PASSWORD`, `JWT_SECRET`, and the Cloudflare token live only
  on the server / in GitHub secrets. `.env` is gitignored — keep it that way. No real secret value
  belongs in any committed file; use `${VAR}` / GitHub secrets / the gitignored `.env`.
- **Change Bruna's seed password.** The `db:seed` step creates Bruna's admin with a default
  password. Change it immediately after the first deploy.
