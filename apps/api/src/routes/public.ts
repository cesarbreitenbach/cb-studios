import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { getStudioBySlug } from '../repos/studioRepo.js';
import { studios } from '../db/schema.js';

export function publicRouter(db: any) {
  const r = Router();
  r.get('/api/studios/:slug', async (req, res) => {
    const view = await getStudioBySlug(db, req.params.slug);
    if (!view) return res.status(404).json({ error: 'not_found' });
    res.json(view);
  });
  r.get('/api/sitemap-slugs', async (_req, res) => {
    const rows = await db.select({ slug: studios.slug }).from(studios)
      .where(eq(studios.published, true));
    res.json(rows.map((x: any) => x.slug));
  });
  return r;
}
