import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Login } from '../src/admin/Login.js';

beforeEach(() => { (globalThis as any).fetch = vi.fn(); });
afterEach(() => { cleanup(); });

describe('Login', () => {
  it('submits and calls onAuthed on success', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({ studioId: 's1', email: 'b@x.com' }) });
    const onAuthed = vi.fn();
    render(<Login onAuthed={onAuthed} />);
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'b@x.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(onAuthed).toHaveBeenCalled());
  });

  it('shows error on bad credentials', async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 401 });
    render(<Login onAuthed={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => expect(screen.getByText(/inválid/i)).toBeTruthy());
  });
});
