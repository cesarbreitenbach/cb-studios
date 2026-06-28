import { describe, it, expect } from 'vitest';
import { sitemapXml, robotsTxt } from '../src/ssr/sitemap.js';

describe('sitemap + robots', () => {
  it('lists studio urls', () => {
    const xml = sitemapXml(['bruna', 'outro'], 'https://cbstudios.com.br');
    expect(xml).toContain('<loc>https://cbstudios.com.br/s/bruna</loc>');
    expect(xml).toContain('<loc>https://cbstudios.com.br/s/outro</loc>');
  });
  it('robots disallows admin and links sitemap', () => {
    const txt = robotsTxt('https://cbstudios.com.br');
    expect(txt).toContain('Disallow: /s/*/admin');
    expect(txt).toContain('Sitemap: https://cbstudios.com.br/sitemap.xml');
  });
});
