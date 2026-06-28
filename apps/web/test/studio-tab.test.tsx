import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { StudioTab } from '../src/admin/tabs/StudioTab.js';
import { adminApi } from '../src/admin/api.js';

afterEach(() => { cleanup(); });

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(adminApi, 'getStudio').mockResolvedValue({
    name: 'Bruna Lausmann', whatsapp: '5545998443696', city: 'Cascavel',
    state: 'PR', hours: 'Seg–Sáb', heroSubtitle: 'sub',
  } as any);
  vi.spyOn(adminApi, 'patchStudio').mockResolvedValue({} as any);
});

describe('StudioTab', () => {
  it('edits and saves studio fields', async () => {
    render(<StudioTab />);
    await waitFor(() => expect(screen.getByDisplayValue('Cascavel')).toBeTruthy());
    fireEvent.change(screen.getByDisplayValue('Cascavel'), { target: { value: 'Toledo' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(adminApi.patchStudio).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Toledo', whatsapp: '5545998443696' })));
  });
});
