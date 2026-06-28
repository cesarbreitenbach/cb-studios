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
    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'no_fields' });
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
