import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { admins } from '../db/schema.js';
import { verifyPassword } from '../auth/password.js';
import { signToken } from '../auth/jwt.js';
import { requireAuth } from '../auth/middleware.js';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export function authRouter(db: any) {
  const r = Router();

  r.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
    if (!admin || !(await verifyPassword(password ?? '', admin.passwordHash))) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    const token = signToken({ adminId: admin.id, studioId: admin.studioId });
    res.cookie('token', token, cookieOpts);
    res.json({ studioId: admin.studioId, email: admin.email });
  });

  r.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('token', cookieOpts);
    res.json({ ok: true });
  });

  r.get('/api/auth/me', requireAuth, async (req, res) => {
    const [admin] = await db.select().from(admins).where(eq(admins.id, req.adminId!)).limit(1);
    if (!admin) return res.status(401).json({ error: 'unauthorized' });
    res.json({ studioId: admin.studioId, email: admin.email });
  });

  return r;
}
