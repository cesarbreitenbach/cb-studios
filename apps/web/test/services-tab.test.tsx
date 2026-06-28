import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Services } from '../src/admin/tabs/Services.js';
import { adminApi } from '../src/admin/api.js';

afterEach(() => { cleanup(); });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(adminApi, 'listServices').mockResolvedValue([
    { id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 },
  ] as any);
  vi.spyOn(adminApi, 'createService').mockResolvedValue({ id: 's2', name: '', priceCents: 0, sortOrder: 1 } as any);
  vi.spyOn(adminApi, 'updateService').mockResolvedValue({} as any);
  vi.spyOn(adminApi, 'deleteService').mockResolvedValue(undefined as any);
});

describe('Services tab', () => {
  it('lists services with price in reais', async () => {
    render(<Services />);
    await waitFor(() => expect(screen.getByDisplayValue('Buço')).toBeTruthy());
    expect(screen.getByDisplayValue('25')).toBeTruthy();
  });

  it('saves price as cents on blur', async () => {
    render(<Services />);
    await waitFor(() => screen.getByDisplayValue('25'));
    const price = screen.getByDisplayValue('25');
    fireEvent.change(price, { target: { value: '30' } });
    fireEvent.blur(price);
    await waitFor(() => expect(adminApi.updateService).toHaveBeenCalledWith('s1', { priceCents: 3000 }));
  });

  it('adds a service', async () => {
    render(<Services />);
    await waitFor(() => screen.getByDisplayValue('Buço'));
    fireEvent.click(screen.getByRole('button', { name: /adicionar/i }));
    await waitFor(() => expect(adminApi.createService).toHaveBeenCalled());
  });
});
