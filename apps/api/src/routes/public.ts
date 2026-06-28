import { Router } from 'express';
import { getStudioBySlug } from '../repos/studioRepo.js';

export function publicRouter(db: any) {
  const r = Router();
  r.get('/api/studios/:slug', async (req, res) => {
    const view = await getStudioBySlug(db, req.params.slug);
    if (!view) return res.status(404).json({ error: 'not_found' });
    res.json(view);
  });
  return r;
}
