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
