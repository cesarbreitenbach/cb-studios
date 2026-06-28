import express from 'express';
import { fileURLToPath } from 'node:url';
import { render } from './src/entry-server.js';
import { buildHead } from './src/ssr/head.js';
import { renderDocument } from './src/ssr/document.js';
import { sitemapXml, robotsTxt } from './src/ssr/sitemap.js';

export async function createServer(opts: { apiBase: string; origin: string; prod?: boolean }) {
  const app = express();
  const clientSrc = opts.prod ? '/assets/entry-client.js' : '/src/entry-client.tsx';

  app.use(express.json());

  // Proxy /api/* to the API, preserving cookies both ways
  app.use('/api', async (req, res) => {
    const target = `${opts.apiBase}${req.originalUrl}`;
    const r = await fetch(target, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] ?? 'application/json',
        cookie: req.headers.cookie ?? '',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
    });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) res.setHeader('set-cookie', setCookie);
    res.status(r.status).type(r.headers.get('content-type') ?? 'application/json');
    res.send(await r.text());
  });

  // Admin SPA shell (no SSR) — must be registered BEFORE /s/:slug SSR route
  app.get(/^\/s\/[^/]+\/admin/, (_req, res) => {
    const adminSrc = opts.prod ? '/assets/entry-admin.js' : '/src/admin/entry-admin.tsx';
    res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Painel · CB Studios</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
</head><body><div id="root"></div>
<script type="module" src="${adminSrc}"></script></body></html>`);
  });

  app.get('/robots.txt', (_req, res) =>
    res.type('text/plain').send(robotsTxt(opts.origin)));

  app.get('/sitemap.xml', async (_req, res) => {
    const r = await fetch(`${opts.apiBase}/api/sitemap-slugs`).catch(() => null);
    let slugs: string[] = [];
    if (r && r.ok) {
      try { slugs = await r.json(); } catch { slugs = []; }
    }
    res.type('application/xml').send(sitemapXml(slugs, opts.origin));
  });

  app.get('/s/:slug', async (req, res) => {
    const r = await fetch(`${opts.apiBase}/api/studios/${req.params.slug}`).catch(() => null);
    if (!r || !r.ok) return res.status(404).type('html').send('<h1>Studio não encontrado</h1>');
    let view: unknown;
    try { view = await r.json(); } catch { return res.status(404).type('html').send('<h1>Studio não encontrado</h1>'); }
    const appHtml = render(view);
    const head = buildHead(view, { url: `${opts.origin}/s/${req.params.slug}` });
    res.status(200).type('html').send(renderDocument({
      appHtml, head, dataJson: JSON.stringify(view), clientSrc,
    }));
  });

  return app;
}

// Boot when run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const app = await createServer({
    apiBase: process.env.API_BASE ?? 'http://localhost:3001',
    origin: process.env.ORIGIN ?? 'http://localhost:3000',
    prod: process.env.NODE_ENV === 'production',
  });
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`web on :${port}`));
}
