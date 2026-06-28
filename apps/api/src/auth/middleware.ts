import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.js';

declare global {
  // eslint-disable-next-line no-var
  namespace Express { interface Request { studioId?: string; adminId?: string } }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  req.studioId = payload.studioId;
  req.adminId = payload.adminId;
  next();
}
