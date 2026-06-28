# CB Studios — Plan 3: Admin Panel (SPA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the studio admin panel as a client-rendered SPA at `/s/:slug/admin`: email/password login, then tabs to manage Appearance (default theme), Services, Promo, and Studio info — all against the Plan-1 `/api/admin/*` routes. **Depends on Plan 1 (API) and Plan 2 (web server).**

**Architecture:** A separate React entry (`entry-admin.tsx`) mounted by the same `apps/web` server via a catch-all `/s/:slug/admin` shell route. The web server proxies `/api/*` to the API so the JWT cookie stays first-party. The admin checks `GET /api/auth/me`; unauthenticated → Login; authenticated → Dashboard. No SSR/SEO (admin must not be indexed; already disallowed in robots).

**Tech Stack:** React 18, TypeScript, Vitest + @testing-library/react + jsdom, native `fetch`.

## Global Constraints

- ESM everywhere.
- Admin calls use `fetch(..., { credentials: 'same-origin' })` — requests go through the web server's `/api` proxy so the httpOnly JWT cookie is first-party.
- Money shown/entered in reais; convert to/from integer **cents** at the API boundary (`reais * 100` on save, `cents / 100` on load).
- Theme values exactly `'A' | 'B' | 'C'`.
- The admin never sends `studio_id`; the server derives it from the cookie.
- Conventional Commits.

---

### Task 1: API proxy + admin shell + login

**Files:**
- Modify: `apps/web/server.ts` (add `/api` proxy + admin shell route)
- Modify: `apps/web/package.json` (build second entry)
- Create: `apps/web/src/admin/api.ts`
- Create: `apps/web/src/admin/AdminApp.tsx`
- Create: `apps/web/src/admin/Login.tsx`
- Create: `apps/web/src/admin/entry-admin.tsx`
- Test: `apps/web/test/admin-api.test.ts`
- Test: `apps/web/test/login.test.tsx`

**Interfaces:**
- Produces (`src/admin/api.ts`): `adminApi` with
  `me(): Promise<{studioId,email}|null>`,
  `login(email,password): Promise<{ok:boolean}>`,
  `logout(): Promise<void>`,
  `getStudio()`, `patchStudio(fields)`,
  `listServices()`, `createService(b)`, `updateService(id,b)`, `deleteService(id)`, `reorderServices(ids)`,
  `getPromo()`, `putPromo(b)`.
- Produces: `AdminApp({ slug })` — auth gate component.

- [ ] **Step 1: Write the failing tests**

`apps/web/test/admin-api.test.ts`:
```ts
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
```

`apps/web/test/login.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../src/admin/Login.js';

beforeEach(() => { (globalThis as any).fetch = vi.fn(); });

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm -w apps/web run test admin-api login`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement the API client**

`apps/web/src/admin/api.ts`:
```ts
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
};
```

- [ ] **Step 4: Implement Login**

`apps/web/src/admin/Login.tsx`:
```tsx
import { useState } from 'react';
import { adminApi } from './api.js';

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const r = await adminApi.login(email, password);
    if (r.ok) onAuthed();
    else setError('Email ou senha inválidos.');
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: '360px', margin: '80px auto', fontFamily: "'Jost',sans-serif", display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }}>Painel</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0' }} />
      <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0' }} />
      {error && <div style={{ color: '#b14a63', fontSize: '13px' }}>{error}</div>}
      <button type="submit" style={{ padding: '14px', borderRadius: '100px', border: 'none', background: '#2c2630', color: '#fff', cursor: 'pointer' }}>Entrar</button>
    </form>
  );
}
```

- [ ] **Step 5: Implement AdminApp gate + entry**

`apps/web/src/admin/AdminApp.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { Login } from './Login.js';
import { Dashboard } from './Dashboard.js';

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { adminApi.me().then((m) => setAuthed(!!m)); }, []);
  if (authed === null) return <div style={{ padding: 40 }}>Carregando…</div>;
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
```

`apps/web/src/admin/entry-admin.tsx`:
```tsx
import { createRoot } from 'react-dom/client';
import { AdminApp } from './AdminApp.js';
createRoot(document.getElementById('root')!).render(<AdminApp />);
```

> `Dashboard` is implemented in Task 2. To keep Task 1 compiling and testable in
> isolation, create a temporary stub `apps/web/src/admin/Dashboard.tsx`:
> ```tsx
> export function Dashboard({ onLogout }: { onLogout: () => void }) {
>   return <button onClick={onLogout}>sair</button>;
> }
> ```
> Task 2 replaces it.

- [ ] **Step 6: Add proxy + admin shell route to the web server**

Modify `apps/web/server.ts` — add these routes **before** `return app;` in `createServer`:
```ts
  // Proxy /api/* to the API, preserving cookies both ways
  app.use('/api', async (req, res) => {
    const target = `${opts.apiBase}${req.originalUrl}`;
    const r = await fetch(target, {
      method: req.method,
      headers: {
        'content-type': req.headers['content-type'] ?? 'application/json',
        cookie: req.headers.cookie ?? '',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body ?? {}),
    });
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) res.setHeader('set-cookie', setCookie);
    res.status(r.status).type(r.headers.get('content-type') ?? 'application/json');
    res.send(await r.text());
  });

  // Admin SPA shell (no SSR)
  app.get(/^\/s\/[^/]+\/admin/, (_req, res) => {
    const adminSrc = opts.prod ? '/assets/entry-admin.js' : '/src/admin/entry-admin.tsx';
    res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Painel · CB Studios</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Jost:wght@400;500&display=swap" rel="stylesheet">
</head><body><div id="root"></div>
<script type="module" src="${adminSrc}"></script></body></html>`);
  });
```
Also add `app.use(express.json());` near the top of `createServer` (before the routes) so the proxy can re-serialize bodies:
```ts
  app.use(express.json());
```

> Route order matters: keep the `/s/:slug/admin` regex route **before** the
> existing `/s/:slug` SSR route so admin URLs are not handled by the SSR
> renderer.

- [ ] **Step 7: Build script — emit the second client entry**

Modify `apps/web/package.json` `build` script:
```json
    "build": "vite build --outDir dist/client && vite build --ssr src/entry-server.tsx --outDir dist/server",
```
Add an `vite.config.ts` `build.rollupOptions.input` map so both client entries
emit. Replace `vite.config.ts` with:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        'entry-client': resolve(__dirname, 'src/entry-client.tsx'),
        'entry-admin': resolve(__dirname, 'src/admin/entry-admin.tsx'),
      },
    },
  },
  test: { environment: 'jsdom' },
});
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm -w apps/web run test admin-api login`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(web): admin api proxy, shell route and login"
```

---

### Task 2: Dashboard shell with tabs + Appearance tab

**Files:**
- Create: `apps/web/src/admin/Dashboard.tsx` (replaces Task-1 stub)
- Create: `apps/web/src/admin/tabs/Appearance.tsx`
- Test: `apps/web/test/appearance.test.tsx`

**Interfaces:**
- `Dashboard({ onLogout })` renders a tab bar (`Aparência | Serviços | Promo | Studio`) and the active tab; default tab `Aparência`. Includes a "Sair" button calling `adminApi.logout()` then `onLogout()`.
- `Appearance()` loads the studio, shows the 3 theme cards, marks the current `defaultTheme` as "Principal", and a "Definir" button on the others calling `adminApi.patchStudio({ defaultTheme })`.

- [ ] **Step 1: Write the failing test**

`apps/web/test/appearance.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test appearance`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement Appearance**

`apps/web/src/admin/tabs/Appearance.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Theme } from '@cb/shared';
import { adminApi } from '../api.js';

const CARDS: { id: Theme; title: string; sub: string }[] = [
  { id: 'A', title: 'Editorial Luxe', sub: 'Cream, serifada, refinado' },
  { id: 'B', title: 'Dark Boudoir', sub: 'Escuro, rosé & dourado' },
  { id: 'C', title: 'Soft Modern', sub: 'Rosa suave, cards & pills' },
];

export function Appearance() {
  const [current, setCurrent] = useState<Theme | null>(null);
  useEffect(() => { adminApi.getStudio().then((s: any) => setCurrent(s?.defaultTheme ?? null)); }, []);

  async function setMain(t: Theme) {
    const updated = await adminApi.patchStudio({ defaultTheme: t });
    setCurrent((updated as any)?.defaultTheme ?? t);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ fontSize: '14px', color: '#7a6a72' }}>Escolha o tema principal — é o que aparece para a cliente ao abrir o site.</p>
      {CARDS.map((c) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', border: `1.5px solid ${current === c.id ? '#9c5a6b' : '#eee3dd'}`, borderRadius: '20px', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '21px', color: '#2c2630' }}>{c.title}</div>
            <div style={{ fontSize: '12.5px', color: '#a98f98' }}>{c.sub}</div>
          </div>
          {current === c.id
            ? <span style={{ background: '#2c2630', color: '#fff', fontSize: '11px', textTransform: 'uppercase', padding: '8px 14px', borderRadius: '100px' }}>Principal</span>
            : <button onClick={() => setMain(c.id)} style={{ border: '1px solid #d9c8c0', background: '#fff', color: '#7a6a72', cursor: 'pointer', fontSize: '12.5px', padding: '9px 14px', borderRadius: '100px' }}>Definir</button>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement Dashboard**

`apps/web/src/admin/Dashboard.tsx`:
```tsx
import { useState } from 'react';
import { adminApi } from './api.js';
import { Appearance } from './tabs/Appearance.js';
import { Services } from './tabs/Services.js';
import { PromoTab } from './tabs/PromoTab.js';
import { StudioTab } from './tabs/StudioTab.js';

const TABS = [
  { id: 'aparencia', label: 'Aparência', el: <Appearance /> },
  { id: 'servicos', label: 'Serviços', el: <Services /> },
  { id: 'promo', label: 'Promo', el: <PromoTab /> },
  { id: 'studio', label: 'Studio', el: <StudioTab /> },
];

export function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState('aparencia');
  const active = TABS.find((t) => t.id === tab)!;
  async function logout() { await adminApi.logout(); onLogout(); }

  return (
    <div style={{ maxWidth: '480px', margin: '32px auto', fontFamily: "'Jost',sans-serif", padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, margin: 0 }}>Painel</h1>
        <button onClick={logout} style={{ border: 'none', background: 'transparent', color: '#a98f98', cursor: 'pointer' }}>Sair</button>
      </div>
      <div style={{ display: 'flex', gap: '4px', background: '#f3eeeb', borderRadius: '100px', padding: '4px', marginBottom: '24px' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, border: 'none', cursor: 'pointer', padding: '9px', borderRadius: '100px', fontSize: '13px', background: tab === t.id ? '#2c2630' : 'transparent', color: tab === t.id ? '#fff' : '#7a6a72' }}>{t.label}</button>
        ))}
      </div>
      {active.el}
    </div>
  );
}
```

> `Services`, `PromoTab`, `StudioTab` are built in Tasks 3-5. To keep this task
> compiling, create one-line stubs now and replace them in their tasks:
> ```tsx
> // tabs/Services.tsx
> export function Services() { return <div>Serviços</div>; }
> // tabs/PromoTab.tsx
> export function PromoTab() { return <div>Promo</div>; }
> // tabs/StudioTab.tsx
> export function StudioTab() { return <div>Studio</div>; }
> ```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm -w apps/web run test appearance`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): admin dashboard tabs and appearance editor"
```

---

### Task 3: Services tab (CRUD + reorder)

**Files:**
- Create: `apps/web/src/admin/tabs/Services.tsx` (replaces stub)
- Test: `apps/web/test/services-tab.test.tsx`

**Interfaces:**
- `Services()` loads `adminApi.listServices()`, lists each with editable name + price (reais), a remove button, an "Adicionar serviço" button (creates then refreshes), and up/down controls that call `adminApi.reorderServices(ids)` with the new order. Prices display/edit in reais; convert with `*100`/`/100` at the API boundary.

- [ ] **Step 1: Write the failing test**

`apps/web/test/services-tab.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Services } from '../src/admin/tabs/Services.js';
import { adminApi } from '../src/admin/api.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test services-tab`
Expected: FAIL — real component missing (stub renders text).

- [ ] **Step 3: Implement Services tab**

`apps/web/src/admin/tabs/Services.tsx`:
```tsx
import { useEffect, useState } from 'react';
import type { Service } from '@cb/shared';
import { adminApi } from '../api.js';
import { formatBRL } from '../../money.js';

export function Services() {
  const [rows, setRows] = useState<Service[]>([]);
  async function load() { setRows((await adminApi.listServices()) ?? []); }
  useEffect(() => { load(); }, []);

  async function saveName(s: Service, name: string) {
    if (name !== s.name) await adminApi.updateService(s.id, { name });
  }
  async function savePrice(s: Service, reais: string) {
    const cents = Math.round(parseFloat(reais.replace(',', '.')) * 100);
    if (!Number.isNaN(cents) && cents !== s.priceCents) await adminApi.updateService(s.id, { priceCents: cents });
  }
  async function remove(s: Service) { await adminApi.deleteService(s.id); await load(); }
  async function add() {
    await adminApi.createService({ name: 'Novo serviço', priceCents: 0, sortOrder: rows.length });
    await load();
  }
  async function move(i: number, dir: -1 | 1) {
    const next = [...rows];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    await adminApi.reorderServices(next.map((r) => r.id));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {rows.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #eee3dd', borderRadius: '14px', padding: '10px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => move(i, -1)} style={arrow}>▲</button>
            <button onClick={() => move(i, 1)} style={arrow}>▼</button>
          </div>
          <input defaultValue={s.name} onBlur={(e) => saveName(s, e.target.value)}
            style={{ flex: 1, border: 'none', fontSize: '15px' }} />
          <span style={{ color: '#a98f98' }}>R$</span>
          <input defaultValue={formatBRL(s.priceCents)} onBlur={(e) => savePrice(s, e.target.value)}
            style={{ width: '64px', border: '1px solid #eee3dd', borderRadius: '8px', padding: '6px', textAlign: 'right' }} />
          <button onClick={() => remove(s)} style={{ border: 'none', background: 'transparent', color: '#b14a63', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <button onClick={add} style={{ border: '1px dashed #d9c8c0', background: '#fff', color: '#7a6a72', cursor: 'pointer', padding: '12px', borderRadius: '14px' }}>+ Adicionar serviço</button>
    </div>
  );
}

const arrow = { border: 'none', background: 'transparent', cursor: 'pointer', color: '#a98f98', fontSize: '10px', lineHeight: 1 } as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test services-tab`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): admin services editor with reorder"
```

---

### Task 4: Promo tab

**Files:**
- Create: `apps/web/src/admin/tabs/PromoTab.tsx` (replaces stub)
- Test: `apps/web/test/promo-tab.test.tsx`

**Interfaces:**
- `PromoTab()` loads `adminApi.getPromo()`, shows a form (title, description, price reais, old price reais, active checkbox), and a "Salvar" button calling `adminApi.putPromo({...})` with prices in cents.

- [ ] **Step 1: Write the failing test**

`apps/web/test/promo-tab.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromoTab } from '../src/admin/tabs/PromoTab.js';
import { adminApi } from '../src/admin/api.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test promo-tab`
Expected: FAIL — stub renders text.

- [ ] **Step 3: Implement PromoTab**

`apps/web/src/admin/tabs/PromoTab.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';
import { formatBRL } from '../../money.js';

const toCents = (reais: string) => Math.round(parseFloat(reais.replace(',', '.')) * 100) || 0;

export function PromoTab() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [active, setActive] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getPromo().then((p: any) => {
      if (!p) return;
      setTitle(p.title); setDescription(p.description ?? '');
      setPrice(formatBRL(p.priceCents));
      setOldPrice(p.oldPriceCents != null ? formatBRL(p.oldPriceCents) : '');
      setActive(p.active);
    });
  }, []);

  async function save() {
    await adminApi.putPromo({
      title, description,
      priceCents: toCents(price),
      oldPriceCents: oldPrice ? toCents(oldPrice) : null,
      active,
    });
    setSaved(true);
  }

  const field = { padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} style={field} />
      <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} style={field} />
      <div style={{ display: 'flex', gap: '12px' }}>
        <label style={{ flex: 1 }}>Preço (R$)<input value={price} onChange={(e) => setPrice(e.target.value)} style={{ ...field, width: '100%' }} /></label>
        <label style={{ flex: 1 }}>De (R$)<input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} style={{ ...field, width: '100%' }} /></label>
      </div>
      <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Promoção ativa
      </label>
      <button onClick={save} style={{ padding: '14px', borderRadius: '100px', border: 'none', background: '#2c2630', color: '#fff', cursor: 'pointer' }}>Salvar</button>
      {saved && <div style={{ color: '#3a8a5c', fontSize: '13px' }}>Salvo ✓</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test promo-tab`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): admin promo editor"
```

---

### Task 5: Studio tab + final wiring

**Files:**
- Create: `apps/web/src/admin/tabs/StudioTab.tsx` (replaces stub)
- Test: `apps/web/test/studio-tab.test.tsx`

**Interfaces:**
- `StudioTab()` loads `adminApi.getStudio()`, edits `name`, `whatsapp`, `city`, `state`, `hours`, `heroSubtitle`, and a "Salvar" button calling `adminApi.patchStudio({...})`.

- [ ] **Step 1: Write the failing test**

`apps/web/test/studio-tab.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudioTab } from '../src/admin/tabs/StudioTab.js';
import { adminApi } from '../src/admin/api.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test studio-tab`
Expected: FAIL — stub renders text.

- [ ] **Step 3: Implement StudioTab**

`apps/web/src/admin/tabs/StudioTab.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { adminApi } from '../api.js';

type Form = { name: string; whatsapp: string; city: string; state: string; hours: string; heroSubtitle: string };
const EMPTY: Form = { name: '', whatsapp: '', city: '', state: '', hours: '', heroSubtitle: '' };
const LABELS: [keyof Form, string][] = [
  ['name', 'Nome do studio'], ['whatsapp', 'WhatsApp (só números)'],
  ['city', 'Cidade'], ['state', 'Estado (UF)'], ['hours', 'Horário'], ['heroSubtitle', 'Frase de destaque'],
];

export function StudioTab() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getStudio().then((s: any) => {
      if (s) setForm({ name: s.name ?? '', whatsapp: s.whatsapp ?? '', city: s.city ?? '', state: s.state ?? '', hours: s.hours ?? '', heroSubtitle: s.heroSubtitle ?? '' });
    });
  }, []);

  function set(k: keyof Form, v: string) { setForm((f) => ({ ...f, [k]: v })); setSaved(false); }
  async function save() { await adminApi.patchStudio({ ...form }); setSaved(true); }

  const field = { padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0', width: '100%' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {LABELS.map(([k, label]) => (
        <label key={k} style={{ fontSize: '13px', color: '#7a6a72' }}>{label}
          <input value={form[k]} onChange={(e) => set(k, e.target.value)} style={field} />
        </label>
      ))}
      <button onClick={save} style={{ padding: '14px', borderRadius: '100px', border: 'none', background: '#2c2630', color: '#fff', cursor: 'pointer' }}>Salvar</button>
      {saved && <div style={{ color: '#3a8a5c', fontSize: '13px' }}>Salvo ✓</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test studio-tab`
Expected: PASS.

- [ ] **Step 5: Full suite + manual end-to-end**

Run: `npm -w apps/web run test && npm -w apps/api run test`
Expected: all PASS.

Manual: with API + web running (and DB seeded), open
`http://localhost:3000/s/bruna-lausmann/admin`, log in with
`bruna@cbstudios.com.br` / `bruna123`, change the main theme + a price, then
reload `http://localhost:3000/s/bruna-lausmann` and confirm the public site
reflects the change.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): admin studio editor and final wiring"
```

---

## Self-Review

- **Spec coverage:** email/password login (T1) ✓, JWT cookie via first-party
  proxy (T1) ✓, auth gate me→Login/Dashboard (T1) ✓, Appearance theme set
  (T2) ✓, Services CRUD + reorder (T3) ✓, Promo upsert form (T4) ✓, Studio info
  edit (T5) ✓, admin not indexed (`noindex` + robots from Plan 2) ✓.
- **Placeholders:** the Task-1/Task-2 stubs for `Dashboard`/`Services`/
  `PromoTab`/`StudioTab` are explicitly created and explicitly replaced in
  later tasks — not lingering TODOs.
- **Type consistency:** `adminApi` method names match across all tabs;
  `Theme`, `Service`, `Studio` come from `@cb/shared`; cents↔reais conversion
  via `formatBRL` (load) and `*100` (save) used consistently.

## Done = MVP

After Plan 1 + 2 + 3: multi-tenant API, SEO-first public SSR site with three
themes, and a working studio admin — seeded and runnable for Bruna Lausmann.
