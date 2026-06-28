// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import request from 'supertest';
import { createServer } from '../server.js';

// Stub API returning one studio
let stub: http.Server;
let apiBase: string;

beforeAll(async () => {
  stub = http.createServer((req, res) => {
    if (req.url === '/api/studios/bruna') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
          whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
          hours: 'Seg–Sáb', heroSubtitle: 'sub', published: true },
        services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
        promo: null,
      }));
    } else if (req.url === '/api/sitemap-slugs') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(['bruna', 'outro']));
    } else { res.statusCode = 404; res.end('{"error":"not_found"}'); }
  });
  await new Promise<void>((r) => stub.listen(0, r));
  apiBase = `http://localhost:${(stub.address() as any).port}`;
});
afterAll(() => stub.close());

describe('SSR server', () => {
  it('renders studio HTML with SEO + data', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    const res = await request(app).get('/s/bruna');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bruna Lausmann');
    expect(res.text).toContain('Buço');
    expect(res.text).toContain('"@type":"LocalBusiness"');
    expect(res.text).toContain('window.__STUDIO__');
  });

  it('404 for unknown studio', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    expect((await request(app).get('/s/nope')).status).toBe(404);
  });

  it('serves robots.txt', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    const res = await request(app).get('/robots.txt');
    expect(res.text).toContain('Sitemap: https://x.test/sitemap.xml');
  });

  it('GET /sitemap.xml contains loc entries for all slugs', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>https://x.test/s/bruna</loc>');
    expect(res.text).toContain('<loc>https://x.test/s/outro</loc>');
  });

  it('subdomain mode: GET / on a studio host renders that studio with its own canonical', async () => {
    const app = await createServer({ apiBase, origin: 'https://agendou.vip', prod: true, baseDomain: 'agendou.vip' });
    const res = await request(app).get('/').set('Host', 'bruna.agendou.vip');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bruna Lausmann');
    expect(res.text).toContain('Buço');
    expect(res.text).toContain('https://bruna.agendou.vip');
  });

  it('subdomain mode: GET /admin on a studio host serves the noindex admin shell', async () => {
    const app = await createServer({ apiBase, origin: 'https://agendou.vip', prod: true, baseDomain: 'agendou.vip' });
    const res = await request(app).get('/admin').set('Host', 'bruna.agendou.vip');
    expect(res.status).toBe(200);
    expect(res.text).toContain('name="robots" content="noindex"');
    expect(res.text).toContain('id="root"');
  });

  it('apex host has no studio at / (falls through to 404)', async () => {
    const app = await createServer({ apiBase, origin: 'https://agendou.vip', prod: true, baseDomain: 'agendou.vip' });
    const res = await request(app).get('/').set('Host', 'agendou.vip');
    expect(res.status).toBe(404);
  });
});
