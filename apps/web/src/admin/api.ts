const opts = (method: string, body?: unknown): RequestInit => ({
  method,
  credentials: 'same-origin',
  headers: body ? { 'content-type': 'application/json' } : {},
  body: body ? JSON.stringify(body) : undefined,
});

async function json(r: Response) { return r.ok ? r.json() : null; }

export const adminApi = {
  async me() {
    const r = await fetch('/api/auth/me', opts('GET'));
    return r.ok ? r.json() : null;
  },
  async login(email: string, password: string) {
    const r = await fetch('/api/auth/login', opts('POST', { email, password }));
    return { ok: r.ok };
  },
  async logout() { await fetch('/api/auth/logout', opts('POST')); },

  async getStudio() { return json(await fetch('/api/admin/studio', opts('GET'))); },
  async patchStudio(fields: Record<string, unknown>) {
    return json(await fetch('/api/admin/studio', opts('PATCH', fields)));
  },

  async listServices() { return json(await fetch('/api/admin/services', opts('GET'))); },
  async createService(b: { name: string; priceCents: number; sortOrder?: number }) {
    return json(await fetch('/api/admin/services', opts('POST', b)));
  },
  async updateService(id: string, b: Record<string, unknown>) {
    return json(await fetch(`/api/admin/services/${id}`, opts('PATCH', b)));
  },
  async deleteService(id: string) { await fetch(`/api/admin/services/${id}`, opts('DELETE')); },
  async reorderServices(ids: string[]) {
    await fetch('/api/admin/services/reorder', opts('PATCH', { ids }));
  },

  async getPromo() { return json(await fetch('/api/admin/promo', opts('GET'))); },
  async putPromo(b: Record<string, unknown>) {
    return json(await fetch('/api/admin/promo', opts('PUT', b)));
  },

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const r = await fetch('/api/admin/password', opts('POST', { currentPassword, newPassword }));
      return { ok: r.ok, error: r.ok ? null : ((await r.json().catch(() => ({}))).error ?? 'error') };
    } catch {
      return { ok: false, error: 'network' };
    }
  },
};
