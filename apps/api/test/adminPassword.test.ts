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
  await db.insert(admins).values({
    studioId: s.id, email: 'b@x.com', passwordHash: await hashPassword('oldpassword'),
  });
  const cookie = (await request(app).post('/api/auth/login')
    .send({ email: 'b@x.com', password: 'oldpassword' })).headers['set-cookie'];
  return { s, cookie };
}

describe('admin change-password', () => {
  it('401 without auth cookie', async () => {
    const res = await request(app).post('/api/admin/password')
      .send({ currentPassword: 'oldpassword', newPassword: 'newpassword' });
    expect(res.status).toBe(401);
  });

  it('400 invalid_current_password when current password is wrong', async () => {
    const { cookie } = await setup();
    const res = await request(app).post('/api/admin/password').set('Cookie', cookie)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_current_password');
  });

  it('400 weak_password when current is correct but newPassword < 8 chars', async () => {
    const { cookie } = await setup();
    const res = await request(app).post('/api/admin/password').set('Cookie', cookie)
      .send({ currentPassword: 'oldpassword', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('weak_password');
  });

  it('verifies current password BEFORE the length check', async () => {
    const { cookie } = await setup();
    const res = await request(app).post('/api/admin/password').set('Cookie', cookie)
      .send({ currentPassword: 'wrongpassword', newPassword: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_current_password');
  });

  it('200 ok and the change is real (new password logs in, old does not)', async () => {
    const { cookie } = await setup();
    const res = await request(app).post('/api/admin/password').set('Cookie', cookie)
      .send({ currentPassword: 'oldpassword', newPassword: 'brandnewpassword' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const newLogin = await request(app).post('/api/auth/login')
      .send({ email: 'b@x.com', password: 'brandnewpassword' });
    expect(newLogin.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login')
      .send({ email: 'b@x.com', password: 'oldpassword' });
    expect(oldLogin.status).toBe(401);
  });
});
