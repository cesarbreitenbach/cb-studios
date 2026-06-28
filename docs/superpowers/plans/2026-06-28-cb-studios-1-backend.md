# CB Studios — Plan 1: Backend, DB & API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the multi-tenant Express + Postgres API: schema, seed, public studio endpoint, JWT auth, and studio-scoped admin CRUD — fully tested.

**Architecture:** npm-workspaces monorepo. `apps/api` is an Express + TypeScript app over Postgres via Drizzle ORM. All admin routes are scoped to the `studio_id` carried in the JWT, never trusted from the request. Tests run against a real Postgres test database with tables truncated between tests.

**Tech Stack:** Node 20+ (ESM), Express 4, TypeScript, Drizzle ORM + drizzle-kit, node-postgres (`pg`), bcryptjs, jsonwebtoken, cookie-parser, Vitest, supertest, tsx.

## Global Constraints

- ESM everywhere (`"type": "module"` in every package.json).
- Node version floor: 20.
- Money stored as integer **cents** (`price_cents`), never floats.
- `studio_id` for any admin operation comes **only** from the verified JWT (`req.studioId`), never from request body or params.
- Theme values are exactly `'A' | 'B' | 'C'`.
- WhatsApp stored as digits only (e.g. `5545998443696`).
- Conventional Commits for every commit message.

---

### Task 1: Monorepo scaffold + API health endpoint

**Files:**
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Test: `apps/api/test/health.test.ts`

**Interfaces:**
- Produces: `createApp(): express.Express` from `apps/api/src/app.ts` — the app factory every test and the server import.

- [ ] **Step 1: Root workspace files**

`package.json` (root):
```json
{
  "name": "cb-studios",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "npm -w apps/api run dev",
    "test": "npm -w apps/api run test"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  }
}
```

`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: cb
      POSTGRES_PASSWORD: cb
      POSTGRES_DB: cbstudios
    ports:
      - "5432:5432"
    volumes:
      - cbdata:/var/lib/postgresql/data
volumes:
  cbdata:
```

`.env.example`:
```
DATABASE_URL=postgres://cb:cb@localhost:5432/cbstudios
TEST_DATABASE_URL=postgres://cb:cb@localhost:5432/cbstudios_test
JWT_SECRET=dev-secret-change-me
PORT=3001
```

- [ ] **Step 2: API package files**

`apps/api/package.json`:
```json
{
  "name": "@cb/api",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx seed.ts"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cookie-parser": "^1.4.6",
    "drizzle-orm": "^0.36.0",
    "pg": "^8.13.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cookie-parser": "^1.4.7",
    "@types/pg": "^8.11.10",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "drizzle-kit": "^0.28.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`apps/api/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src", "test", "seed.ts", "drizzle.config.ts"]
}
```

- [ ] **Step 3: Write the failing test**

`apps/api/test/health.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('health', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 4: Install deps and run test to verify it fails**

Run: `npm install && npm -w apps/api run test`
Expected: FAIL — cannot resolve `../src/app.js`.

- [ ] **Step 5: Implement app + server**

`apps/api/src/app.ts`:
```ts
import express from 'express';
import cookieParser from 'cookie-parser';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}
```

`apps/api/src/server.ts`:
```ts
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);
createApp().listen(port, () => console.log(`api on :${port}`));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm -w apps/api run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): scaffold monorepo and health endpoint"
```

---

### Task 2: Drizzle schema, migrations & test harness

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/src/db/migrate.ts`
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/test/helpers.ts`
- Test: `apps/api/test/schema.test.ts`

**Interfaces:**
- Produces: tables `studios, admins, services, promos` from `schema.ts`.
- Produces: `db` (Drizzle instance) and `pool` from `client.ts`.
- Produces: `resetDb(): Promise<void>` and `closeDb(): Promise<void>` from `test/helpers.ts`.

- [ ] **Step 1: Write the schema**

`apps/api/src/db/schema.ts`:
```ts
import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const studios = pgTable('studios', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  defaultTheme: text('default_theme').notNull().default('B'),
  whatsapp: text('whatsapp').notNull().default(''),
  city: text('city').notNull().default(''),
  state: text('state').notNull().default(''),
  hours: text('hours').notNull().default(''),
  heroSubtitle: text('hero_subtitle').notNull().default(''),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byStudio: index('services_studio_idx').on(t.studioId) }));

export const promos = pgTable('promos', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull(),
  oldPriceCents: integer('old_price_cents'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byStudio: index('promos_studio_idx').on(t.studioId) }));
```

- [ ] **Step 2: DB client + migrate runner + drizzle config**

`apps/api/src/db/client.ts`:
```ts
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export function makeDb(url = process.env.DATABASE_URL!) {
  const pool = new pg.Pool({ connectionString: url });
  return { pool, db: drizzle(pool, { schema }) };
}

export const { pool, db } = makeDb(process.env.DATABASE_URL!);
```

`apps/api/src/db/migrate.ts`:
```ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { makeDb } from './client.js';

const url = process.env.DATABASE_URL!;
const { pool, db } = makeDb(url);
await migrate(db, { migrationsFolder: 'drizzle' });
await pool.end();
console.log('migrations applied');
```

`apps/api/drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://cb:cb@localhost:5432/cbstudios' },
});
```

- [ ] **Step 3: Generate migration and create the test DB**

Run:
```bash
docker compose up -d
createdb -h localhost -U cb cbstudios_test || true
npm -w apps/api run db:generate
DATABASE_URL=postgres://cb:cb@localhost:5432/cbstudios_test npm -w apps/api run db:migrate
DATABASE_URL=postgres://cb:cb@localhost:5432/cbstudios npm -w apps/api run db:migrate
```
Expected: a `drizzle/0000_*.sql` file generated; "migrations applied" twice.

- [ ] **Step 4: Test harness**

`apps/api/test/helpers.ts`:
```ts
import { makeDb } from '../src/db/client.js';

const url = process.env.TEST_DATABASE_URL
  ?? 'postgres://cb:cb@localhost:5432/cbstudios_test';
export const { pool, db } = makeDb(url);

export async function resetDb() {
  await pool.query('TRUNCATE studios, admins, services, promos RESTART IDENTITY CASCADE');
}
export async function closeDb() {
  await pool.end();
}
```

- [ ] **Step 5: Write the failing test**

`apps/api/test/schema.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db, resetDb, closeDb } from './helpers.js';
import { studios } from '../src/db/schema.js';

beforeEach(resetDb);
afterAll(closeDb);

describe('schema', () => {
  it('inserts and reads a studio', async () => {
    const [row] = await db.insert(studios)
      .values({ slug: 'demo', name: 'Demo' }).returning();
    expect(row.slug).toBe('demo');
    expect(row.defaultTheme).toBe('B');
    expect(row.published).toBe(true);
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm -w apps/api run test schema`
Expected: PASS (schema + migrations + harness all wired).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): drizzle schema, migrations and test harness"
```

---

### Task 3: Studio repository + seed script

**Files:**
- Create: `apps/api/src/repos/studioRepo.ts`
- Create: `apps/api/seed.ts`
- Test: `apps/api/test/studioRepo.test.ts`

**Interfaces:**
- Consumes: `db`, `schema` tables.
- Produces: `getStudioBySlug(db, slug): Promise<StudioView | null>` where
  `StudioView = { studio, services, promo }` — `studio` is the row,
  `services` ordered by `sortOrder` asc, `promo` is the active promo or `null`.

- [ ] **Step 1: Write the failing test**

`apps/api/test/studioRepo.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db, resetDb, closeDb } from './helpers.js';
import { studios, services, promos } from '../src/db/schema.js';
import { getStudioBySlug } from '../src/repos/studioRepo.js';

beforeEach(resetDb);
afterAll(closeDb);

describe('getStudioBySlug', () => {
  it('returns null when missing', async () => {
    expect(await getStudioBySlug(db, 'nope')).toBeNull();
  });

  it('returns studio with ordered services and active promo', async () => {
    const [s] = await db.insert(studios).values({ slug: 'bruna', name: 'Bruna' }).returning();
    await db.insert(services).values([
      { studioId: s.id, name: 'Axila', priceCents: 3000, sortOrder: 1 },
      { studioId: s.id, name: 'Buço', priceCents: 2500, sortOrder: 0 },
    ]);
    await db.insert(promos).values({ studioId: s.id, title: 'Combo', priceCents: 13000, oldPriceCents: 16500, active: true });
    await db.insert(promos).values({ studioId: s.id, title: 'Old', priceCents: 1, active: false });

    const view = await getStudioBySlug(db, 'bruna');
    expect(view!.services.map(x => x.name)).toEqual(['Buço', 'Axila']);
    expect(view!.promo!.title).toBe('Combo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test studioRepo`
Expected: FAIL — cannot resolve `studioRepo.js`.

- [ ] **Step 3: Implement the repo**

`apps/api/src/repos/studioRepo.ts`:
```ts
import { eq, and, asc } from 'drizzle-orm';
import { studios, services, promos } from '../db/schema.js';

export async function getStudioBySlug(db: any, slug: string) {
  const [studio] = await db.select().from(studios).where(eq(studios.slug, slug)).limit(1);
  if (!studio) return null;
  const svc = await db.select().from(services)
    .where(eq(services.studioId, studio.id)).orderBy(asc(services.sortOrder));
  const [promo] = await db.select().from(promos)
    .where(and(eq(promos.studioId, studio.id), eq(promos.active, true))).limit(1);
  return { studio, services: svc, promo: promo ?? null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/api run test studioRepo`
Expected: PASS.

- [ ] **Step 5: Write the seed script**

`apps/api/seed.ts`:
```ts
import bcrypt from 'bcryptjs';
import { makeDb } from './src/db/client.js';
import { studios, admins, services, promos } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const { pool, db } = makeDb(process.env.DATABASE_URL!);

const existing = await db.select().from(studios).where(eq(studios.slug, 'bruna-lausmann'));
if (existing.length === 0) {
  const [s] = await db.insert(studios).values({
    slug: 'bruna-lausmann',
    name: 'Bruna Lausmann',
    defaultTheme: 'B',
    whatsapp: '5545998443696',
    city: 'Cascavel',
    state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h',
    heroSubtitle: 'Um ritual de cuidado pensado para realçar a beleza natural da sua pele.',
  }).returning();

  await db.insert(admins).values({
    studioId: s.id,
    email: 'bruna@cbstudios.com.br',
    passwordHash: await bcrypt.hash('bruna123', 10),
  });

  await db.insert(services).values([
    { studioId: s.id, name: 'Buço', priceCents: 2500, sortOrder: 0 },
    { studioId: s.id, name: 'Axila', priceCents: 3000, sortOrder: 1 },
    { studioId: s.id, name: 'Meia perna', priceCents: 4500, sortOrder: 2 },
    { studioId: s.id, name: 'Perna completa', priceCents: 7000, sortOrder: 3 },
    { studioId: s.id, name: 'Virilha simples', priceCents: 4000, sortOrder: 4 },
    { studioId: s.id, name: 'Virilha completa', priceCents: 6500, sortOrder: 5 },
  ]);

  await db.insert(promos).values({
    studioId: s.id,
    title: 'Combo Completo',
    description: 'Perna completa + virilha completa + axila',
    priceCents: 13000,
    oldPriceCents: 16500,
    active: true,
  });
  console.log('seeded bruna-lausmann (login bruna@cbstudios.com.br / bruna123)');
} else {
  console.log('bruna-lausmann already seeded');
}
await pool.end();
```

- [ ] **Step 6: Run the seed against dev DB**

Run: `npm -w apps/api run db:seed`
Expected: "seeded bruna-lausmann ...".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): studio repository and Bruna seed"
```

---

### Task 4: Public studio endpoint

**Files:**
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/src/routes/public.ts`
- Test: `apps/api/test/public.test.ts`

**Interfaces:**
- Consumes: `getStudioBySlug`.
- Produces: `GET /api/studios/:slug` → 200 `{ studio, services, promo }` (prices as `price_cents`) or 404 `{ error: 'not_found' }`.
- Produces: `publicRouter(db)` from `routes/public.ts`.

- [ ] **Step 1: Write the failing test**

`apps/api/test/public.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { db, resetDb, closeDb } from './helpers.js';
import { createApp } from '../src/app.js';
import { studios, services } from '../src/db/schema.js';

const app = createApp(db);
beforeEach(resetDb);
afterAll(closeDb);

describe('GET /api/studios/:slug', () => {
  it('404 when missing', async () => {
    const res = await request(app).get('/api/studios/nope');
    expect(res.status).toBe(404);
  });

  it('returns studio + services', async () => {
    const [s] = await db.insert(studios).values({ slug: 'bruna', name: 'Bruna' }).returning();
    await db.insert(services).values({ studioId: s.id, name: 'Buço', priceCents: 2500, sortOrder: 0 });
    const res = await request(app).get('/api/studios/bruna');
    expect(res.status).toBe(200);
    expect(res.body.studio.slug).toBe('bruna');
    expect(res.body.services[0].priceCents).toBe(2500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test public`
Expected: FAIL — `createApp` takes no db / route missing.

- [ ] **Step 3: Implement route and wire db into app**

`apps/api/src/routes/public.ts`:
```ts
import { Router } from 'express';
import { getStudioBySlug } from '../repos/studioRepo.js';

export function publicRouter(db: any) {
  const r = Router();
  r.get('/api/studios/:slug', async (req, res) => {
    const view = await getStudioBySlug(db, req.params.slug);
    if (!view) return res.status(404).json({ error: 'not_found' });
    res.json(view);
  });
  return r;
}
```

Modify `apps/api/src/app.ts` to accept an optional db and mount the router:
```ts
import express from 'express';
import cookieParser from 'cookie-parser';
import { db as defaultDb } from './db/client.js';
import { publicRouter } from './routes/public.js';

export function createApp(db: any = defaultDb) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(publicRouter(db));
  return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/api run test public`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(api): public studio endpoint"
```

---

### Task 5: Auth utilities (password + JWT)

**Files:**
- Create: `apps/api/src/auth/password.ts`
- Create: `apps/api/src/auth/jwt.ts`
- Test: `apps/api/test/auth-utils.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain): Promise<string>`, `verifyPassword(plain, hash): Promise<boolean>`.
- Produces: `signToken(payload: {adminId, studioId}): string`, `verifyToken(token): {adminId, studioId} | null`.

- [ ] **Step 1: Write the failing test**

`apps/api/test/auth-utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
import { signToken, verifyToken } from '../src/auth/jwt.js';

describe('auth utils', () => {
  it('hashes and verifies password', async () => {
    const h = await hashPassword('secret');
    expect(await verifyPassword('secret', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });

  it('signs and verifies a token', () => {
    const t = signToken({ adminId: 'a1', studioId: 's1' });
    expect(verifyToken(t)).toMatchObject({ adminId: 'a1', studioId: 's1' });
    expect(verifyToken('garbage')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test auth-utils`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement utils**

`apps/api/src/auth/password.ts`:
```ts
import bcrypt from 'bcryptjs';
export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
```

`apps/api/src/auth/jwt.ts`:
```ts
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
export type TokenPayload = { adminId: string; studioId: string };

export function signToken(p: TokenPayload): string {
  return jwt.sign(p, secret, { expiresIn: '7d' });
}
export function verifyToken(token: string): TokenPayload | null {
  try {
    const d = jwt.verify(token, secret) as any;
    return { adminId: d.adminId, studioId: d.studioId };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/api run test auth-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(api): password hashing and JWT utilities"
```

---

### Task 6: Auth routes + requireAuth middleware

**Files:**
- Create: `apps/api/src/auth/middleware.ts`
- Create: `apps/api/src/routes/auth.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/auth.test.ts`

**Interfaces:**
- Consumes: `verifyPassword`, `signToken`, `verifyToken`, `admins` table.
- Produces: `requireAuth(req,res,next)` — reads cookie `token`, sets `req.studioId` & `req.adminId`, else 401.
- Produces: `authRouter(db)` with:
  - `POST /api/auth/login` `{email,password}` → 200 set httpOnly cookie `token`, body `{studioId,email}`; 401 on bad creds.
  - `POST /api/auth/logout` → 200 clears cookie.
  - `GET /api/auth/me` → 200 `{studioId,email}` when authed, else 401.

- [ ] **Step 1: Write the failing test**

`apps/api/test/auth.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { db, resetDb, closeDb } from './helpers.js';
import { createApp } from '../src/app.js';
import { studios, admins } from '../src/db/schema.js';
import { hashPassword } from '../src/auth/password.js';

const app = createApp(db);
beforeEach(resetDb);
afterAll(closeDb);

async function seedAdmin() {
  const [s] = await db.insert(studios).values({ slug: 'bruna', name: 'Bruna' }).returning();
  await db.insert(admins).values({
    studioId: s.id, email: 'bruna@x.com', passwordHash: await hashPassword('pw'),
  });
  return s;
}

describe('auth', () => {
  it('rejects bad credentials', async () => {
    await seedAdmin();
    const res = await request(app).post('/api/auth/login').send({ email: 'bruna@x.com', password: 'nope' });
    expect(res.status).toBe(401);
  });

  it('logs in, sets cookie, and /me works', async () => {
    const s = await seedAdmin();
    const login = await request(app).post('/api/auth/login').send({ email: 'bruna@x.com', password: 'pw' });
    expect(login.status).toBe(200);
    expect(login.body.studioId).toBe(s.id);
    const cookie = login.headers['set-cookie'];
    expect(cookie[0]).toMatch(/HttpOnly/i);

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('bruna@x.com');
  });

  it('/me is 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test auth.test`
Expected: FAIL — routes missing.

- [ ] **Step 3: Implement middleware**

`apps/api/src/auth/middleware.ts`:
```ts
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.js';

declare global {
  // eslint-disable-next-line no-var
  namespace Express { interface Request { studioId?: string; adminId?: string } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  req.studioId = payload.studioId;
  req.adminId = payload.adminId;
  next();
}
```

- [ ] **Step 4: Implement auth routes**

`apps/api/src/routes/auth.ts`:
```ts
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { admins } from '../db/schema.js';
import { verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { requireAuth } from '../auth/middleware.js';

const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/' };

export function authRouter(db: any) {
  const r = Router();

  r.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin || !(await verifyPassword(password ?? '', admin.passwordHash))) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    const token = signToken({ adminId: admin.id, studioId: admin.studioId });
    res.cookie('token', token, cookieOpts);
    res.json({ studioId: admin.studioId, email: admin.email });
  });

  r.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('token', cookieOpts);
    res.json({ ok: true });
  });

  r.get('/api/auth/me', requireAuth, async (req, res) => {
    const [admin] = await db.select().from(admins).where(eq(admins.id, req.adminId!)).limit(1);
    if (!admin) return res.status(401).json({ error: 'unauthorized' });
    res.json({ studioId: admin.studioId, email: admin.email });
  });

  return r;
}
```

- [ ] **Step 5: Mount router in app**

Modify `apps/api/src/app.ts` — add import and mount before `return app`:
```ts
import { authRouter } from './routes/auth.js';
// ...inside createApp, after publicRouter:
  app.use(authRouter(db));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm -w apps/api run test auth.test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api): JWT auth routes and requireAuth middleware"
```

---

### Task 7: Admin services CRUD + reorder (with cross-tenant isolation test)

**Files:**
- Create: `apps/api/src/routes/adminServices.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/adminServices.test.ts`

**Interfaces:**
- Consumes: `requireAuth` (sets `req.studioId`), `services` table.
- Produces: `adminServicesRouter(db)`:
  - `GET /api/admin/services` → services for `req.studioId`, ordered.
  - `POST /api/admin/services` `{name,priceCents,sortOrder?}` → 201 created row.
  - `PATCH /api/admin/services/:id` `{name?,priceCents?,sortOrder?}` → 200 updated; 404 if row not in studio.
  - `DELETE /api/admin/services/:id` → 204; 404 if not in studio.
  - `PATCH /api/admin/services/reorder` `{ids: string[]}` → 200, sets sortOrder by index.
- All queries filter `and(eq(services.id, id), eq(services.studioId, req.studioId))`.

- [ ] **Step 1: Write the failing test (includes cross-tenant isolation)**

`apps/api/test/adminServices.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { db, resetDb, closeDb } from './helpers.js';
import { createApp } from '../src/app.js';
import { studios, admins, services } from '../src/db/schema.js';
import { hashPassword } from '../src/auth/password.js';

const app = createApp(db);
beforeEach(resetDb);
afterAll(closeDb);

async function studioWithAdmin(slug: string, email: string) {
  const [s] = await db.insert(studios).values({ slug, name: slug }).returning();
  await db.insert(admins).values({ studioId: s.id, email, passwordHash: await hashPassword('pw') });
  return s;
}
async function login(email: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'pw' });
  return res.headers['set-cookie'];
}

describe('admin services', () => {
  it('requires auth', async () => {
    expect((await request(app).get('/api/admin/services')).status).toBe(401);
  });

  it('creates, lists, updates, deletes scoped to studio', async () => {
    await studioWithAdmin('bruna', 'b@x.com');
    const cookie = await login('b@x.com');
    const created = await request(app).post('/api/admin/services')
      .set('Cookie', cookie).send({ name: 'Buço', priceCents: 2500 });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const list = await request(app).get('/api/admin/services').set('Cookie', cookie);
    expect(list.body).toHaveLength(1);

    const upd = await request(app).patch(`/api/admin/services/${id}`)
      .set('Cookie', cookie).send({ priceCents: 2800 });
    expect(upd.body.priceCents).toBe(2800);

    const del = await request(app).delete(`/api/admin/services/${id}`).set('Cookie', cookie);
    expect(del.status).toBe(204);
  });

  it('cannot touch another studio\'s service', async () => {
    const a = await studioWithAdmin('a', 'a@x.com');
    await studioWithAdmin('b', 'b@x.com');
    const [svc] = await db.insert(services)
      .values({ studioId: a.id, name: 'Secret', priceCents: 100, sortOrder: 0 }).returning();

    const cookieB = await login('b@x.com');
    expect((await request(app).patch(`/api/admin/services/${svc.id}`)
      .set('Cookie', cookieB).send({ priceCents: 1 })).status).toBe(404);
    expect((await request(app).delete(`/api/admin/services/${svc.id}`)
      .set('Cookie', cookieB)).status).toBe(404);
    const stillThere = await db.select().from(services);
    expect(stillThere[0].priceCents).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test adminServices`
Expected: FAIL — router missing.

- [ ] **Step 3: Implement router**

`apps/api/src/routes/adminServices.ts`:
```ts
import { Router } from 'express';
import { and, eq, asc } from 'drizzle-orm';
import { services } from '../db/schema.js';
import { requireAuth } from '../auth/middleware.js';

export function adminServicesRouter(db: any) {
  const r = Router();
  r.use('/api/admin/services', requireAuth);

  r.get('/api/admin/services', async (req, res) => {
    const rows = await db.select().from(services)
      .where(eq(services.studioId, req.studioId!)).orderBy(asc(services.sortOrder));
    res.json(rows);
  });

  r.post('/api/admin/services', async (req, res) => {
    const { name, priceCents, sortOrder } = req.body ?? {};
    const [row] = await db.insert(services).values({
      studioId: req.studioId!, name, priceCents, sortOrder: sortOrder ?? 0,
    }).returning();
    res.status(201).json(row);
  });

  r.patch('/api/admin/services/reorder', async (req, res) => {
    const ids: string[] = req.body?.ids ?? [];
    for (let i = 0; i < ids.length; i++) {
      await db.update(services).set({ sortOrder: i })
        .where(and(eq(services.id, ids[i]), eq(services.studioId, req.studioId!)));
    }
    res.json({ ok: true });
  });

  r.patch('/api/admin/services/:id', async (req, res) => {
    const fields: any = {};
    for (const k of ['name', 'priceCents', 'sortOrder'] as const)
      if (req.body?.[k] !== undefined) fields[k] = req.body[k];
    const [row] = await db.update(services).set(fields)
      .where(and(eq(services.id, req.params.id), eq(services.studioId, req.studioId!)))
      .returning();
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  });

  r.delete('/api/admin/services/:id', async (req, res) => {
    const [row] = await db.delete(services)
      .where(and(eq(services.id, req.params.id), eq(services.studioId, req.studioId!)))
      .returning();
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.status(204).end();
  });

  return r;
}
```

> Note: the `/reorder` route is declared **before** `/:id` so Express does not
> match "reorder" as an id.

- [ ] **Step 4: Mount router**

Modify `apps/api/src/app.ts` — add import and `app.use(adminServicesRouter(db));`:
```ts
import { adminServicesRouter } from './routes/adminServices.js';
// ...after authRouter:
  app.use(adminServicesRouter(db));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm -w apps/api run test adminServices`
Expected: PASS (including cross-tenant isolation).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(api): studio-scoped services CRUD with tenant isolation"
```

---

### Task 8: Admin studio PATCH + promo upsert

**Files:**
- Create: `apps/api/src/routes/adminStudio.ts`
- Create: `apps/api/src/routes/adminPromo.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/adminStudioPromo.test.ts`

**Interfaces:**
- Produces: `adminStudioRouter(db)`:
  - `GET /api/admin/studio` → studio row for `req.studioId`.
  - `PATCH /api/admin/studio` `{defaultTheme?,whatsapp?,city?,state?,hours?,heroSubtitle?,name?,published?}` → 200 updated row (only whitelisted fields).
- Produces: `adminPromoRouter(db)`:
  - `GET /api/admin/promo` → active promo for studio or `null`.
  - `PUT /api/admin/promo` `{title,description,priceCents,oldPriceCents,active}` → upsert: update the studio's existing promo row if present else insert; returns the row.

- [ ] **Step 1: Write the failing test**

`apps/api/test/adminStudioPromo.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { db, resetDb, closeDb } from './helpers.js';
import { createApp } from '../src/app.js';
import { studios, admins } from '../src/db/schema.js';
import { hashPassword } from '../src/auth/password.js';

const app = createApp(db);
beforeEach(resetDb);
afterAll(closeDb);

async function setup() {
  const [s] = await db.insert(studios).values({ slug: 'bruna', name: 'Bruna' }).returning();
  await db.insert(admins).values({ studioId: s.id, email: 'b@x.com', passwordHash: await hashPassword('pw') });
  const cookie = (await request(app).post('/api/auth/login').send({ email: 'b@x.com', password: 'pw' })).headers['set-cookie'];
  return { s, cookie };
}

describe('admin studio + promo', () => {
  it('patches studio fields', async () => {
    const { cookie } = await setup();
    const res = await request(app).patch('/api/admin/studio')
      .set('Cookie', cookie).send({ defaultTheme: 'A', whatsapp: '5545999990000' });
    expect(res.status).toBe(200);
    expect(res.body.defaultTheme).toBe('A');
    expect(res.body.whatsapp).toBe('5545999990000');
  });

  it('upserts the promo (insert then update same row)', async () => {
    const { cookie } = await setup();
    const first = await request(app).put('/api/admin/promo').set('Cookie', cookie)
      .send({ title: 'Combo', description: 'x', priceCents: 13000, oldPriceCents: 16500, active: true });
    expect(first.status).toBe(200);
    const second = await request(app).put('/api/admin/promo').set('Cookie', cookie)
      .send({ title: 'Combo 2', description: 'y', priceCents: 12000, oldPriceCents: 16500, active: true });
    expect(second.body.id).toBe(first.body.id);
    expect(second.body.title).toBe('Combo 2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/api run test adminStudioPromo`
Expected: FAIL — routers missing.

- [ ] **Step 3: Implement adminStudio router**

`apps/api/src/routes/adminStudio.ts`:
```ts
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { studios } from '../db/schema.js';
import { requireAuth } from '../auth/middleware.js';

const ALLOWED = ['name','defaultTheme','whatsapp','city','state','hours','heroSubtitle','published'] as const;

export function adminStudioRouter(db: any) {
  const r = Router();
  r.use('/api/admin/studio', requireAuth);

  r.get('/api/admin/studio', async (req, res) => {
    const [row] = await db.select().from(studios).where(eq(studios.id, req.studioId!)).limit(1);
    res.json(row ?? null);
  });

  r.patch('/api/admin/studio', async (req, res) => {
    const fields: any = {};
    for (const k of ALLOWED) if (req.body?.[k] !== undefined) fields[k] = req.body[k];
    const [row] = await db.update(studios).set(fields)
      .where(eq(studios.id, req.studioId!)).returning();
    res.json(row);
  });

  return r;
}
```

- [ ] **Step 4: Implement adminPromo router**

`apps/api/src/routes/adminPromo.ts`:
```ts
import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { promos } from '../db/schema.js';
import { requireAuth } from '../auth/middleware.js';

export function adminPromoRouter(db: any) {
  const r = Router();
  r.use('/api/admin/promo', requireAuth);

  r.get('/api/admin/promo', async (req, res) => {
    const [row] = await db.select().from(promos)
      .where(and(eq(promos.studioId, req.studioId!), eq(promos.active, true))).limit(1);
    res.json(row ?? null);
  });

  r.put('/api/admin/promo', async (req, res) => {
    const { title, description, priceCents, oldPriceCents, active } = req.body ?? {};
    const values = { title, description: description ?? '', priceCents,
      oldPriceCents: oldPriceCents ?? null, active: active ?? true };
    const [existing] = await db.select().from(promos)
      .where(eq(promos.studioId, req.studioId!)).limit(1);
    let row;
    if (existing) {
      [row] = await db.update(promos).set(values).where(eq(promos.id, existing.id)).returning();
    } else {
      [row] = await db.insert(promos).values({ studioId: req.studioId!, ...values }).returning();
    }
    res.json(row);
  });

  return r;
}
```

- [ ] **Step 5: Mount both routers**

Modify `apps/api/src/app.ts`:
```ts
import { adminStudioRouter } from './routes/adminStudio.js';
import { adminPromoRouter } from './routes/adminPromo.js';
// ...after adminServicesRouter:
  app.use(adminStudioRouter(db));
  app.use(adminPromoRouter(db));
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm -w apps/api run test adminStudioPromo`
Expected: PASS.

- [ ] **Step 7: Run the full suite + commit**

Run: `npm -w apps/api run test`
Expected: all suites PASS.

```bash
git add -A
git commit -m "feat(api): admin studio patch and promo upsert"
```

---

### Task 9: Shared types package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Modify: `apps/api/src/repos/studioRepo.ts` (type its return)
- Test: `packages/shared/test/types.test.ts`

**Interfaces:**
- Produces (`@cb/shared`): `Theme = 'A'|'B'|'C'`; interfaces `Studio`, `Service`, `Promo`, `StudioView = { studio: Studio; services: Service[]; promo: Promo | null }`.

- [ ] **Step 1: Package files**

`packages/shared/package.json`:
```json
{
  "name": "@cb/shared",
  "type": "module",
  "main": "src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run" },
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^2.1.0" }
}
```

`packages/shared/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src", "test"] }
```

- [ ] **Step 2: Write the failing test**

`packages/shared/test/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { THEMES, isTheme } from '../src/index.js';

describe('shared', () => {
  it('exposes themes and a guard', () => {
    expect(THEMES).toEqual(['A', 'B', 'C']);
    expect(isTheme('A')).toBe(true);
    expect(isTheme('Z')).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm -w packages/shared run test`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement types**

`packages/shared/src/index.ts`:
```ts
export const THEMES = ['A', 'B', 'C'] as const;
export type Theme = typeof THEMES[number];
export const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

export interface Studio {
  id: string; slug: string; name: string; defaultTheme: Theme;
  whatsapp: string; city: string; state: string; hours: string;
  heroSubtitle: string; published: boolean;
}
export interface Service { id: string; name: string; priceCents: number; sortOrder: number; }
export interface Promo {
  id: string; title: string; description: string;
  priceCents: number; oldPriceCents: number | null; active: boolean;
}
export interface StudioView { studio: Studio; services: Service[]; promo: Promo | null; }
```

- [ ] **Step 5: Add @cb/shared as a dependency of the api**

Modify `apps/api/package.json` dependencies — add:
```json
    "@cb/shared": "*",
```
Then run `npm install`.

Modify `apps/api/src/repos/studioRepo.ts` — type the return value:
```ts
import type { StudioView } from '@cb/shared';
// change signature to:
export async function getStudioBySlug(db: any, slug: string): Promise<StudioView | null> {
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm -w packages/shared run test && npm -w apps/api run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(shared): cross-package domain types"
```

---

## Self-Review

- **Spec coverage:** schema (T2) ✓, seed (T3) ✓, public JSON endpoint (T4) ✓,
  auth login/logout/me + JWT cookie (T5,T6) ✓, requireAuth + `req.studioId`
  from token (T6) ✓, services CRUD + reorder (T7) ✓, cross-tenant isolation
  test (T7) ✓, studio PATCH + promo upsert (T8) ✓, shared types (T9) ✓,
  docker Postgres + env + scripts (T1,T2) ✓. SSR route `/s/:slug`,
  `/sitemap.xml`, `/robots.txt` are intentionally in **Plan 2** (web/SSR).
- **Placeholders:** none — every step has full code and exact commands.
- **Type consistency:** `getStudioBySlug(db, slug)`, `signToken({adminId,studioId})`,
  `verifyToken`, `requireAuth` → `req.studioId`/`req.adminId`, `price_cents`
  used consistently across tasks.

## Notes for Plan 2 / Plan 3

- Public SSR site (Plan 2) consumes `GET /api/studios/:slug` and lives in
  `apps/web` with its own Vite SSR server that proxies `/api/*` to this API.
- `/sitemap.xml` + `/robots.txt` are implemented in Plan 2 (they need the web
  server's public host) using `SELECT slug FROM studios WHERE published`.
- Admin SPA (Plan 3) consumes the auth + `/api/admin/*` routes built here.
