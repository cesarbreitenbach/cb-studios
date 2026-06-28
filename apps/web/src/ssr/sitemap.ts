export function sitemapXml(slugs: string[], origin: string): string {
  const urls = slugs.map(s =>
    `  <url><loc>${origin}/s/${s}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function robotsTxt(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /s/*/admin
Sitemap: ${origin}/sitemap.xml
`;
}
