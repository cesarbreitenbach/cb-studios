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
