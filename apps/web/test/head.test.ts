import { describe, it, expect } from 'vitest';
import type { StudioView } from '@cb/shared';
import { buildHead } from '../src/ssr/head.js';

const view: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: null,
};

describe('buildHead', () => {
  it('includes title, description, OG and LocalBusiness JSON-LD', () => {
    const head = buildHead(view, { url: 'https://cbstudios.com.br/s/bruna' });
    expect(head).toContain('<title>Bruna Lausmann · Depilação em Cascavel-PR</title>');
    expect(head).toMatch(/<meta name="description"/);
    expect(head).toMatch(/property="og:title"/);
    expect(head).toContain('"@type":"LocalBusiness"');
    expect(head).toContain('"telephone":"+5545998443696"');
    expect(head).toContain('Buço');
  });
});
