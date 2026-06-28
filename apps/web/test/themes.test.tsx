import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { StudioView } from '@cb/shared';
import { THEME_COMPONENTS } from '../src/site/themes/index.js';

const base: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: { id: 'p1', title: 'Combo', description: 'desc', priceCents: 13000, oldPriceCents: 16500, active: true },
};

describe('themes', () => {
  for (const t of ['A', 'B', 'C'] as const) {
    it(`Theme ${t} renders name, service, promo, wa link`, () => {
      const C = THEME_COMPONENTS[t];
      const html = renderToString(<C view={base} />);
      expect(html).toContain('Bruna Lausmann');
      expect(html).toContain('Buço');
      expect(html).toContain('R$');
      expect(html).toContain('Combo');
      expect(html).toContain('wa.me/5545998443696');
    });
  }
});
