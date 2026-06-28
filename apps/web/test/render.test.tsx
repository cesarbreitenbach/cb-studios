import { describe, it, expect } from 'vitest';
import type { StudioView } from '@cb/shared';
import { render } from '../src/entry-server.js';
import { renderDocument } from '../src/ssr/document.js';

const view: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: null,
};

describe('SSR render', () => {
  it('appHtml contains studio content', () => {
    const html = render(view);
    expect(html).toContain('Bruna');
    expect(html).toContain('Buço');
    expect(html).toContain('R$');
  });

  it('document embeds head and hydration data', () => {
    const doc = renderDocument({
      appHtml: '<div>x</div>',
      head: '<title>T</title>',
      dataJson: JSON.stringify(view),
      clientSrc: '/src/entry-client.tsx',
    });
    expect(doc).toContain('<title>T</title>');
    expect(doc).toContain('window.__STUDIO__');
    expect(doc).toContain('<div>x</div>');
  });
});
