import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Appearance } from '../src/admin/tabs/Appearance.js';
import { adminApi } from '../src/admin/api.js';

beforeEach(() => {
  vi.spyOn(adminApi, 'getStudio').mockResolvedValue({ defaultTheme: 'B' } as any);
  vi.spyOn(adminApi, 'patchStudio').mockResolvedValue({ defaultTheme: 'A' } as any);
});

describe('Appearance', () => {
  it('marks current theme principal and sets another', async () => {
    render(<Appearance />);
    await waitFor(() => expect(screen.getByText('Dark Boudoir')).toBeTruthy());
    // B is principal -> shows the badge; A has a "Definir" button
    const setButtons = screen.getAllByRole('button', { name: /definir/i });
    fireEvent.click(setButtons[0]);
    await waitFor(() => expect(adminApi.patchStudio).toHaveBeenCalledWith({ defaultTheme: 'A' }));
  });
});
