import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { PasswordTab } from '../src/admin/tabs/PasswordTab.js';
import { adminApi } from '../src/admin/api.js';

afterEach(() => { cleanup(); });

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('PasswordTab', () => {
  it('renders three fields and a save button', () => {
    render(<PasswordTab />);
    expect(screen.getByLabelText(/senha atual/i)).toBeTruthy();
    expect(screen.getByLabelText(/nova senha/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirmar/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeTruthy();
  });

  it('shows error and does not call api when nova !== confirmar', () => {
    const spy = vi.spyOn(adminApi, 'changePassword').mockResolvedValue({ ok: true, error: null });
    render(<PasswordTab />);
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'oldpass1' } });
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: 'different123' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(screen.getByText(/não conferem|não coincidem|diferentes/i)).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows error and does not call api when nova < 8 chars', () => {
    const spy = vi.spyOn(adminApi, 'changePassword').mockResolvedValue({ ok: true, error: null });
    render(<PasswordTab />);
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'oldpass1' } });
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(screen.getByText(/8 caracteres|muito curta/i)).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('happy path: calls changePassword and shows success', async () => {
    const spy = vi.spyOn(adminApi, 'changePassword').mockResolvedValue({ ok: true, error: null });
    render(<PasswordTab />);
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'oldpass1' } });
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('oldpass1', 'newpass123'));
    await waitFor(() => expect(screen.getByText(/senha alterada/i)).toBeTruthy());
  });

  it('server error: invalid_current_password shows "Senha atual incorreta"', async () => {
    vi.spyOn(adminApi, 'changePassword').mockResolvedValue({ ok: false, error: 'invalid_current_password' });
    render(<PasswordTab />);
    fireEvent.change(screen.getByLabelText(/senha atual/i), { target: { value: 'wrongpass1' } });
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirmar/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(screen.getByText(/senha atual incorreta/i)).toBeTruthy());
  });
});
