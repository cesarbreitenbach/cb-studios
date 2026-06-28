import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { promos } from '../db/schema.js';
import { requireAuth } from '../auth/middleware.js';

export function adminPromoRouter(db: any) {
  const r = Router();
  r.use('/api/admin/promo', requireAuth);

  r.get('/api/admin/promo', async (req, res) => {
    const [row] = await db.select().from(promos)
      .where(eq(promos.studioId, req.studioId!)).limit(1);
    res.json(row ?? null);
  });

  r.put('/api/admin/promo', async (req, res) => {
    const { title, description, priceCents, oldPriceCents, active } = req.body ?? {};
    const values = { title, description: description ?? '', priceCents,
      oldPriceCents: oldPriceCents ?? null, active: active ?? true };
    const [existing] = await db.select().from(promos)
      .where(eq(promos.studioId, req.studioId!)).limit(1);
    let row;
    if (existing) {
      [row] = await db.update(promos).set(values).where(eq(promos.id, existing.id)).returning();
    } else {
      [row] = await db.insert(promos).values({ studioId: req.studioId!, ...values }).returning();
    }
    res.json(row);
  });

  return r;
}
