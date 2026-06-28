import express from 'express';
import cookieParser from 'cookie-parser';
import { db as defaultDb } from './db/client.js';
import { publicRouter } from './routes/public.js';

export function createApp(db: any = defaultDb) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(publicRouter(db));
  return app;
}
