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
