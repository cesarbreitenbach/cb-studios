import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { render } from './src/entry-server.js';
import { buildHead } from './src/ssr/head.js';
import { renderDocument } from './src/ssr/document.js';
import { sitemapXml, robotsTxt } from './src/ssr/sitemap.js';
import { slugFromHost, originForHost } from './src/ssr/host.js';

export async function createServer(opts: {
  apiBase: string;
  origin: string;
  prod?: boolean;
  baseDomain?: string;
}) {
  const app = express();
  const baseDomain = opts.baseDomain ?? 'agendou.vip';
  const clientSrc = opts.prod ? '/assets/entry-client.js' : '/src/entry-client.tsx';
  const adminSrc = opts.prod ? '/assets/entry-admin.js' : '/src/admin/entry-admin.tsx';

  app.use(express.json());

  // Serve built client/admin bundles in production (needed for hydration).
  if (opts.prod) {
    const here = dirname(fileURLToPath(import.meta.url));
    app.use(express.static(resolve(here, 'dist/client'), { index: false }));
  }

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

  const adminShell = (res: express.Response) =>
    res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Painel · CB Studios</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
</head><body><div id="root"></div>
<script type="module" src="${adminSrc}"></script></body></html>`);

  async function renderSite(slug: string, origin: string, res: express.Response) {
    const r = await fetch(`${opts.apiBase}/api/studios/${slug}`).catch(() => null);
    if (!r || !r.ok) return res.status(404).type('html').send('<h1>Studio não encontrado</h1>');
    let view: unknown;
    try { view = await r.json(); } catch { return res.status(404).type('html').send('<h1>Studio não encontrado</h1>'); }
    const appHtml = render(view);
    const head = buildHead(view, { url: origin });
    res.status(200).type('html').send(renderDocument({
      appHtml, head, dataJson: JSON.stringify(view), clientSrc,
    }));
  }

  app.get('/robots.txt', (req, res) =>
    res.type('text/plain').send(robotsTxt(originForHost(req.headers.host, opts.origin))));

  app.get('/sitemap.xml', async (req, res) => {
    const r = await fetch(`${opts.apiBase}/api/sitemap-slugs`).catch(() => null);
    let slugs: string[] = [];
    if (r && r.ok) {
      try { slugs = await r.json(); } catch { slugs = []; }
    }
    res.type('application/xml').send(sitemapXml(slugs, originForHost(req.headers.host, opts.origin)));
  });

  // --- Subdomain mode (production): bruna.agendou.vip -> slug "bruna" ---
  // Admin shell must be matched before the site root.
  app.get('/admin', (req, res, next) => {
    const slug = slugFromHost(req.headers.host, baseDomain);
    if (!slug) return next();
    return adminShell(res);
  });
  app.get('/', (req, res, next) => {
    const slug = slugFromHost(req.headers.host, baseDomain);
    if (!slug) return next();
    return renderSite(slug, originForHost(req.headers.host, opts.origin), res);
  });

  // --- Path mode (local dev / fallback): /s/:slug and /s/:slug/admin ---
  app.get(/^\/s\/[^/]+\/admin/, (_req, res) => adminShell(res));
  app.get('/s/:slug', (req, res) =>
    renderSite(req.params.slug, `${originForHost(req.headers.host, opts.origin)}/s/${req.params.slug}`, res));

  return app;
}

// Boot when run directly
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const app = await createServer({
    apiBase: process.env.API_BASE ?? 'http://localhost:3001',
    origin: process.env.ORIGIN ?? 'http://localhost:3000',
    baseDomain: process.env.BASE_DOMAIN ?? 'agendou.vip',
    prod: process.env.NODE_ENV === 'production',
  });
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`web on :${port}`));
}
