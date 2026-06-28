import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { PromoTab } from '../src/admin/tabs/PromoTab.js';
import { adminApi } from '../src/admin/api.js';

afterEach(() => { cleanup(); });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(adminApi, 'getPromo').mockResolvedValue({
    id: 'p1', title: 'Combo', description: 'd', priceCents: 13000, oldPriceCents: 16500, active: true,
  } as any);
  vi.spyOn(adminApi, 'putPromo').mockResolvedValue({} as any);
});

describe('PromoTab', () => {
  it('loads promo and saves prices as cents', async () => {
    render(<PromoTab />);
    await waitFor(() => expect(screen.getByDisplayValue('Combo')).toBeTruthy());
    expect(screen.getByDisplayValue('130')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(adminApi.putPromo).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Combo', priceCents: 13000, oldPriceCents: 16500, active: true })));
  });
});
