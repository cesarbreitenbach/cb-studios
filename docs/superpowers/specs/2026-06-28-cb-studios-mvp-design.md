# CB Studios — MVP Design

**Date:** 2026-06-28
**Status:** Approved (brainstorming) — pending implementation plan

## Overview

Multi-tenant platform for service studios. Each studio gets a public,
SEO-optimized site (served via SSR) and an authenticated admin panel to
manage its content. First tenant: **Studio de Depilação Bruna Lausmann**
(Cascavel-PR).

The public site is derived from the approved Claude Design mockup
(`Bruna Lausmann.dc.html`): hero, services price table, monthly promo,
hours/location, WhatsApp CTA, and 3 selectable visual themes.

## Decisions (from brainstorming)

| Topic | Decision |
|-------|----------|
| Tenancy | **Multi-tenant from day one** (`studio_id` scoping everywhere) |
| Admin scope | **Full content editing** — theme, services, promo, studio info |
| Auth | **Email + password**, bcrypt hash, **JWT in httpOnly cookie** |
| Tenant routing | **Path-based** `/s/:slug` (migratable to subdomain/custom domain) |
| SEO | **Option 1: SSR + full SEO** (server-rendered HTML, meta, JSON-LD, sitemap) |
| Themes | 3 presets (A Editorial / B Boudoir / C Modern); default in DB, client preview via localStorage |

## Stack

- **Backend:** Node + Express + TypeScript
- **DB:** Postgres + Drizzle ORM (typed, SQL-first, migrations)
- **Frontend:** Vite + React + TypeScript, **SSR** for public routes
- **Auth:** bcrypt + JWT (httpOnly cookie)
- **Test:** Vitest + supertest; Postgres test DB (docker or `pg-mem`)

## Architecture

Monorepo:

```
cb-studios/
├─ apps/api          Express + TS, Drizzle, Postgres
├─ apps/web          Vite + React + TS (public SSR site + admin SPA)
└─ packages/shared   shared types (Studio, Service, Promo, Theme)
```

### Why these boundaries

- `apps/api` owns data + auth + SSR data fetching. No UI.
- `apps/web` owns rendering. Public pages render server-side (Express calls
  the web SSR entry); admin is a client-only SPA (no SEO need).
- `packages/shared` is the single source of truth for cross-boundary types,
  preventing API/web drift.

## Data Model (Postgres)

```
studios
  id            uuid pk
  slug          text unique         -- e.g. "bruna-lausmann"
  name          text
  default_theme text  ('A'|'B'|'C')
  whatsapp      text                -- digits, e.g. "5545998443696"
  city          text
  state         text
  hours         text                -- e.g. "Seg–Sáb · 9h às 19h"
  hero_subtitle text
  published     boolean default true
  created_at    timestamptz

admins
  id            uuid pk
  studio_id     uuid fk -> studios
  email         text unique
  password_hash text
  created_at    timestamptz

services
  id            uuid pk
  studio_id     uuid fk -> studios
  name          text
  price_cents   integer             -- store cents, render R$
  sort_order    integer
  created_at    timestamptz

promos
  id            uuid pk
  studio_id     uuid fk -> studios
  title         text
  description   text
  price_cents   integer
  old_price_cents integer
  active        boolean default true
  created_at    timestamptz
```

Indexes: `studios.slug`, `services.studio_id`, `admins.email`,
`promos.studio_id`.

## API

### Public (no auth)
```
GET  /api/studios/:slug   -> studio + services + active promo (JSON)
GET  /s/:slug             -> SSR HTML (public site)
GET  /sitemap.xml         -> published studios
GET  /robots.txt          -> allow /, disallow /s/*/admin
```

### Auth
```
POST /api/auth/login      -> {email,password} -> set httpOnly JWT cookie
POST /api/auth/logout     -> clear cookie
GET  /api/auth/me         -> current admin (from cookie)
```

### Admin (protected; studio_id ALWAYS from JWT, never from body/param)
```
GET    /api/admin/studio
PATCH  /api/admin/studio              -- default_theme, whatsapp, city, hours, hero_subtitle...

GET    /api/admin/services
POST   /api/admin/services
PATCH  /api/admin/services/:id
DELETE /api/admin/services/:id
PATCH  /api/admin/services/reorder    -- ordered id[]

GET    /api/admin/promo
PUT    /api/admin/promo               -- upsert monthly promo (active toggle)
```

### Security rule (critical)

`requireAuth` middleware verifies the JWT and injects `req.studioId`. Every
`/api/admin/*` handler scopes its query to `req.studioId`. The studio id is
**never** read from request body or params. A studio admin can never read or
mutate another studio's data. This is covered by an explicit cross-tenant
isolation test.

## SSR Flow (public site)

```
1. GET /s/:slug  (Express)
2. Query Postgres: studio + services + active promo (cacheable per slug,
   invalidated on admin edit)
3. renderToString(<SitePage studio services promo />)
4. Compose full HTML document:
   - <title> "{name} · Depilação em {city}-{state}"
   - <meta name="description">
   - Open Graph tags (og:title/description/image)
   - <script type="application/ld+json"> LocalBusiness:
       name, telephone, address, openingHours, geo, makesOffer:[services]
   - <div id="root"> with pre-rendered markup
   - <script src=client bundle> for hydration
5. Browser paints immediately (Google/WhatsApp read full content)
6. Client bundle hydrates -> interactive (theme picker, etc.)
```

Vite SSR: dev uses `ssrLoadModule`; prod builds client + server bundles.
`entry-server.tsx` (renderToString) and `entry-client.tsx` (hydrateRoot).

## Frontend Routes

```
/s/:slug          SitePage  (SSR)  -- renders studio.default_theme
/s/:slug/admin    AdminApp  (SPA)
   ├─ /login                        -- email/password form
   └─ dashboard tabs: Aparência | Serviços | Promo | Studio
```

### Themes

Three preset components, markup faithful to the mockup (inline styles kept
initially, extracted later if needed). Each receives `{studio, services,
promo}` props:

- `ThemeA` Editorial Luxe — cream, serif
- `ThemeB` Dark Boudoir — dark, rosé/gold
- `ThemeC` Soft Modern — pink, cards/pills

`default_theme` (DB) selects the SSR-rendered theme. A discreet picker lets
the visitor preview the other themes client-side only (localStorage
`bl_theme`), not persisted — same behavior as the mockup.

Shared sub-components (styled per theme via props, no duplicated logic):
`ServiceList`, `PromoCard`, `WhatsappCTA`, `Hours`.

Fonts: Cormorant Garamond + Jost (Google Fonts, preconnect in SSR head).

### Admin UI

- **Aparência:** theme cards with "Definir Principal" (from mockup).
- **Serviços:** editable list — add, edit price/name, remove, drag-reorder.
- **Promo:** upsert form (title, desc, price, old price, active toggle).
- **Studio:** whatsapp, hours, city, hero subtitle.

## Testing (TDD)

- **API:** auth (login, cookie, `me`), services CRUD scoped to studio,
  promo upsert, public studio JSON, SSR returns HTML containing data +
  JSON-LD, sitemap lists published studios.
- **Security:** cross-tenant test — studio X admin cannot read/edit studio Y.
- **Frontend:** theme components render provided data; picker switches theme
  without reload.
- **DB:** test Postgres (docker or `pg-mem`), Drizzle migrations applied,
  Bruna seed.

## Seed

Studio `bruna-lausmann` + her admin + 6 services + combo promo, from mockup:

- Services: Buço 25, Axila 30, Meia perna 45, Perna completa 70,
  Virilha simples 40, Virilha completa 65 (R$)
- Promo: "Combo Completo" — perna completa + virilha completa + axila —
  R$130 (de R$165)
- WhatsApp: 5545998443696 · Cascavel/PR · Seg–Sáb 9h–19h
- default_theme: B (Dark Boudoir) — mockup default

## Dev / Infra

- `docker-compose` for local Postgres
- `.env`: `DATABASE_URL`, `JWT_SECRET`
- Scripts: `db:migrate`, `db:seed`, `dev` (api+web), `test`

## Out of Scope (MVP)

- Online booking/scheduling (CTA is WhatsApp deep-link only)
- Payments
- Subdomain/custom domain routing (path-based now; architecture ready)
- Studio self-signup (admins seeded/created manually for MVP)
- Image uploads / galleries
- Multiple admins per studio UI (schema allows it; no management UI yet)

## Future (post-MVP)

- Subdomain / custom domain per studio
- Google Business Profile guidance (off-site, biggest local-SEO lever)
- Per-studio OG image generation
- HTML cache layer for SSR (per-slug, invalidated on edit)
- Booking + calendar
