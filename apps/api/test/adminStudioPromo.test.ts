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
