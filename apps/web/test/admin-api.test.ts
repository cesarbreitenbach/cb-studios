import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from '../src/admin/api.js';

beforeEach(() => { (globalThis as any).fetch = vi.fn(); });

describe('adminApi', () => {
  it('me returns null on 401', async () => {
    (fetch as any).mockResolvedValue({ ok: false, status: 401 });
    expect(await adminApi.me()).toBeNull();
  });
  it('me returns json on 200', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({ studioId: 's1', email: 'b@x.com' }) });
    expect(await adminApi.me()).toEqual({ studioId: 's1', email: 'b@x.com' });
  });
  it('login posts credentials', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    const r = await adminApi.login('b@x.com', 'pw');
    expect(r.ok).toBe(true);
    expect((fetch as any).mock.calls[0][0]).toBe('/api/auth/login');
    expect((fetch as any).mock.calls[0][1].credentials).toBe('same-origin');
  });
});
