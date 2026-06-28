import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { StudioView } from '@cb/shared';
import SitePage from '../src/site/SitePage.js';

const view: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'A',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb', heroSubtitle: 'sub', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: null,
};

beforeEach(() => localStorage.clear());

describe('SitePage', () => {
  it('renders default theme then switches via picker', () => {
    render(<SitePage view={view} />);
    expect(screen.getByText('Buço')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Trocar visual'));
    fireEvent.click(screen.getByRole('button', { name: /Boudoir/i }));
    expect(localStorage.getItem('bl_theme')).toBe('B');
  });
});
