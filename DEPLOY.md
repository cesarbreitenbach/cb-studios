# CB Studios — Production Deploy Runbook

Ships **cb-studios** onto the **same server** as **Probody**, **cb-faucet (Luckyblock)**
and **cb-fitness**, behind the shared **Probody Caddy** (`probody_proxy`, image `caddy:latest`).

It mirrors how cb-faucet is wired: cb-studios owns an **external docker network**
`cb-studios-net`; the Probody Caddy joins that network and reverse-proxies to
`cb_studios_web:3000` by container name — exactly like it reaches `cb_faucet_app:3000`.

Three containers (`docker-compose.prod.yml`):

| Container | Service | Role | Exposure |
| --------- | ------- | ---- | -------- |
| `cb_studios_db`  | cb-db  | Postgres 16 | internal only (`cb-internal`) |
| `cb_studios_api` | cb-api | Express + Drizzle (tsx), migrates on boot | `expose 3001`, internal only |
| `cb_studios_web` | cb-web | Vite/React SSR (tsx) | `expose 3000`, reached by Caddy over `cb-studios-net` |

No host ports are published. The only public entrypoint is the Probody Caddy.

Production tenant routing is by **subdomain**: `<slug>.agendou.vip` → studio `slug`
(e.g. `bruna.agendou.vip`). The apex + `/s/:slug` path form is kept only for dev.

> Replace `SERVER_IP` with the server's public IP throughout.

---

## 1. DNS (Cloudflare)

Per-studio A record (default TLS path below uses HTTP-01, so one record per studio):

| Type | Name    | Content     |
| ---- | ------- | ----------- |
| A    | `bruna` (`bruna.agendou.vip`) | `SERVER_IP` |

Add one A record per new studio. (If you later switch to the wildcard option in
§5, replace these with a single `*` → `SERVER_IP` record.)

---

## 2. GitHub Actions secrets (match cb-faucet)

Repo → **Settings → Secrets and variables → Actions**. Same names cb-faucet uses,
so you can reuse the existing deploy identity:

| Secret | Value |
| ------ | ----- |
| `SSH_PRIVATE_KEY` | private key authorized on the server (same one cb-faucet deploys with) |
| `SSH_KNOWN_HOSTS` | output of `ssh-keyscan SERVER_IP` |
| `SSH_USER` | the deploy SSH user |
| `SSH_HOST` | `SERVER_IP` (or hostname) |

Flow (identical to cb-faucet): merge to `main` → push → the **Deploy** workflow
runs the CI gate, then SSHes in and runs `cd ~/cb-studios && ./scripts/ci-deploy.sh <sha>`.

`POSTGRES_PASSWORD` / `JWT_SECRET` are **NOT** GitHub secrets — they live only in
the server-side `.env` (step 3).

---

## 3. Server bootstrap (first deploy, done once by hand)

On the server, next to your other stacks:

```bash
git clone https://github.com/cesarbreitenbach/cb-studios.git
cd cb-studios

# Secrets for compose interpolation — gitignored, never committed.
cat > .env <<'EOF'
POSTGRES_PASSWORD=__strong_random__
JWT_SECRET=__strong_random__
EOF
chmod 600 .env
# generate strong values:  openssl rand -base64 32   (run twice)

# External network the Caddy will also join.
docker network create cb-studios-net   # ignore error if it already exists

# Build + start (api migrates automatically on boot).
docker compose -f docker-compose.prod.yml up -d --build

# Seed the first studio (Bruna) + its admin — ONCE.
docker compose -f docker-compose.prod.yml exec -T cb-api npm -w apps/api run db:seed
```

After the first manual bootstrap, every later deploy is automatic via GitHub
Actions (`scripts/ci-deploy.sh`, which does fetch → reset → `up -d --build` → migrate).

---

## 4. Wire the shared Probody Caddy

Two edits in the **Probody** repo (`Probody/backend/`):

**(a) Join the network** — in `Probody/backend/docker-compose.yml`, add
`cb-studios-net` to the `caddy` service and declare it external:

```yaml
  caddy:
    # ...
    networks:
      - probody_network
      - cb-faucet-net
      - apice_network
      - cb-studios-net      # <-- add

networks:
  # ...
  cb-studios-net:           # <-- add
    external: true
    name: cb-studios-net
```

**(b) Add the site block** — append `deploy/Caddyfile.snippet` to
`Probody/backend/Caddyfile`:

```caddy
bruna.agendou.vip {
    reverse_proxy cb_studios_web:3000
}
```

Then recreate/reload Caddy from the Probody backend dir:

```bash
docker compose up -d caddy        # picks up the new network
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Caddy issues the cert automatically via HTTP-01 on first request (same as the
existing `luckyblock.win` blocks — no Cloudflare token, no Caddy rebuild).

---

## 5. Verify

- Public site: <https://bruna.agendou.vip>
- Admin: <https://bruna.agendou.vip/admin>

502 → check `cb_studios_web` is healthy and on `cb-studios-net`
(`docker compose -f docker-compose.prod.yml ps`; `docker network inspect cb-studios-net`).
TLS error → check the A record resolves to the server and Caddy's logs.

---

## 6. Adding a studio later

1. Insert a `studios` row whose **`slug`** is the subdomain label
   (`slug = 'studiox'` → `studiox.agendou.vip`). There is no `subdomain` column —
   the slug *is* the label. Add its `admins` row (bcrypt `password_hash`).
2. Add a DNS A record `studiox.agendou.vip → SERVER_IP`.
3. Add a Caddy block (copy Bruna's) and reload Caddy.

No redeploy of cb-studios is needed — the app already resolves any subdomain.

### Optional: wildcard (no per-studio Caddy/DNS edits)
A wildcard `*.agendou.vip` cert needs a **DNS-01** challenge → the **Cloudflare
DNS plugin**, which stock `caddy:latest` lacks. To adopt it: rebuild the shared
Caddy with `xcaddy build --with github.com/caddy-dns/cloudflare`, give Caddy a
Cloudflare token (Zone:DNS:Edit on agendou.vip) as `CLOUDFLARE_API_TOKEN`, add a
`*` A record, and use the wildcard block at the bottom of `deploy/Caddyfile.snippet`.
This touches the shared Caddy image (Probody/faucet/fitness run on it too), so do
it deliberately. Until then, the per-studio HTTP-01 blocks above are the safe path.

---

## Security

- **Rotate the leaked Cloudflare token.** A token leaked earlier — revoke it in
  Cloudflare. The per-studio TLS path does **not** use it; only the optional
  wildcard upgrade (§6) would, and only as Caddy's `CLOUDFLARE_API_TOKEN` env.
  Never put a token in any committed file.
- **Never commit `.env`.** `POSTGRES_PASSWORD` / `JWT_SECRET` live only in the
  server `.env` (gitignored). No real secret belongs in any committed file.
- **Change Bruna's seed password.** `db:seed` creates her admin with a default
  password — change it right after the first deploy.
