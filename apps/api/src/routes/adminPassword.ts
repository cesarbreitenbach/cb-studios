import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { admins } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { requireAuth } from '../auth/middleware.js';

export function adminPasswordRouter(db: any) {
  const r = Router();
  r.use('/api/admin/password', requireAuth);

  r.post('/api/admin/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    const [admin] = await db.select().from(admins)
      .where(eq(admins.id, req.adminId!)).limit(1);
    if (!admin || !(await verifyPassword(currentPassword ?? '', admin.passwordHash))) {
      return res.status(400).json({ error: 'invalid_current_password' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'weak_password' });
    }
    const passwordHash = await hashPassword(newPassword);
    await db.update(admins).set({ passwordHash }).where(eq(admins.id, req.adminId!));
    res.json({ ok: true });
  });

  return r;
}
