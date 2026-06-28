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
