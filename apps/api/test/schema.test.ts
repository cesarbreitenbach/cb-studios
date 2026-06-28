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
