import express from 'express';
import { render } from './src/entry-server.js';
import { buildHead } from './src/ssr/head.js';
import { renderDocument } from './src/ssr/document.js';
import { sitemapXml, robotsTxt } from './src/ssr/sitemap.js';

export async function createServer(opts: { apiBase: string; origin: string; prod?: boolean }) {
  const app = express();
  const clientSrc = opts.prod ? '/assets/entry-client.js' : '/src/entry-client.tsx';

  app.get('/robots.txt', (_req, res) =>
    res.type('text/plain').send(robotsTxt(opts.origin)));

  app.get('/sitemap.xml', async (_req, res) => {
    const r = await fetch(`${opts.apiBase}/api/sitemap-slugs`).catch(() => null);
    const slugs: string[] = r && r.ok ? await r.json() : [];
    res.type('application/xml').send(sitemapXml(slugs, opts.origin));
  });

  app.get('/s/:slug', async (req, res) => {
    const r = await fetch(`${opts.apiBase}/api/studios/${req.params.slug}`).catch(() => null);
    if (!r || !r.ok) return res.status(404).type('html').send('<h1>Studio não encontrado</h1>');
    const view = await r.json();
    const appHtml = render(view);
    const head = buildHead(view, { url: `${opts.origin}/s/${req.params.slug}` });
    res.status(200).type('html').send(renderDocument({
      appHtml, head, dataJson: JSON.stringify(view), clientSrc,
    }));
  });

  return app;
}

// Boot when run directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  const app = await createServer({
    apiBase: process.env.API_BASE ?? 'http://localhost:3001',
    origin: process.env.ORIGIN ?? 'http://localhost:3000',
    prod: process.env.NODE_ENV === 'production',
  });
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`web on :${port}`));
}
