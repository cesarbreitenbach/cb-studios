import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { db as defaultDb } from './db/client.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminServicesRouter } from './routes/adminServices.js';
import { adminStudioRouter } from './routes/adminStudio.js';
import { adminPromoRouter } from './routes/adminPromo.js';
import { adminPasswordRouter } from './routes/adminPassword.js';

export function createApp(db: any = defaultDb) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(publicRouter(db));
  app.use(authRouter(db));
  app.use(adminServicesRouter(db));
  app.use(adminStudioRouter(db));
  app.use(adminPromoRouter(db));
  app.use(adminPasswordRouter(db));
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  });
  return app;
}
