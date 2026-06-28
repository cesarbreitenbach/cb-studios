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

  it('rejects PATCH with no allowed fields (empty body)', async () => {
    const s = await studioWithAdmin('empty', 'empty@x.com');
    const cookie = await login('empty@x.com');
    const [svc] = await db.insert(services)
      .values({ studioId: s.id, name: 'Haircut', priceCents: 1000, sortOrder: 0 }).returning();
    const res = await request(app).patch(`/api/admin/services/${svc.id}`)
      .set('Cookie', cookie).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'no_fields' });
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
