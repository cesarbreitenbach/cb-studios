import type { StudioView } from '@cb/shared';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(view: StudioView, opts: { url: string }): string {
  const { studio, services } = view;
  const title = `${studio.name} · Depilação em ${studio.city}-${studio.state}`;
  const desc = studio.heroSubtitle ||
    `Estúdio de depilação em ${studio.city}. ${services.map(s => s.name).join(', ')}.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: studio.name,
    description: desc,
    telephone: `+${studio.whatsapp}`,
    address: { '@type': 'PostalAddress', addressLocality: studio.city, addressRegion: studio.state, addressCountry: 'BR' },
    openingHours: studio.hours,
    makesOffer: services.map(s => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name },
      price: (s.priceCents / 100).toFixed(2),
      priceCurrency: 'BRL',
    })),
  };

  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(opts.url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(opts.url)}">`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">',
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
}
