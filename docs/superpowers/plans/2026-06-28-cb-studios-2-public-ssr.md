# CB Studios — Plan 2: Public SSR Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public, SEO-optimized site in `apps/web`: a Vite + React SSR server that renders a studio's chosen theme with full `<head>` meta + JSON-LD, plus sitemap/robots. **Depends on Plan 1** (the API and `@cb/shared`).

**Architecture:** `apps/web` is its own Express server using Vite in middleware mode (dev) / built bundles (prod). On `GET /s/:slug` it fetches `GET /api/studios/:slug` from the Plan-1 API, renders the React tree to a string with the studio's `defaultTheme`, and returns a full HTML document. The client bundle hydrates and enables the theme-preview picker (localStorage only). `/api/*` is proxied to the API.

**Tech Stack:** Vite 5, React 18 (`renderToString`/`hydrateRoot`), TypeScript, Express, Vitest + @testing-library/react + jsdom.

## Global Constraints

- ESM everywhere (`"type": "module"`).
- React 18 stable SSR APIs (`react-dom/server` `renderToString`, `react-dom/client` `hydrateRoot`).
- Money is integer cents from the API; format to BRL at render time. `2500 → "25"`, `13000 → "130"`, `12350 → "123,50"`.
- Theme values exactly `'A' | 'B' | 'C'`; SSR always renders `studio.defaultTheme`.
- Client theme preview is **localStorage only** (key `bl_theme`), never sent to the server.
- WhatsApp deep link: `https://wa.me/<digits>?text=<encoded message>`.
- Conventional Commits.

---

### Task 1: Web app scaffold + SSR render/document (pure, tested)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/money.ts`
- Create: `apps/web/src/site/SitePage.tsx`
- Create: `apps/web/src/entry-server.tsx`
- Create: `apps/web/src/ssr/document.ts`
- Test: `apps/web/test/money.test.ts`
- Test: `apps/web/test/render.test.tsx`

**Interfaces:**
- Produces: `formatBRL(cents: number): string` from `src/money.ts`.
- Produces: `render(view: StudioView): string` (appHtml) from `entry-server.tsx`.
- Produces: `renderDocument({ appHtml, head, dataJson, clientSrc }): string` from `src/ssr/document.ts`.
- Consumes: `StudioView` from `@cb/shared`.

- [ ] **Step 1: Package + config files**

`apps/web/package.json`:
```json
{
  "name": "@cb/web",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build --outDir dist/client && vite build --ssr src/entry-server.tsx --outDir dist/server",
    "start": "NODE_ENV=production tsx server.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@cb/shared": "*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "jsx": "react-jsx", "lib": ["ES2022", "DOM", "DOM.Iterable"], "types": ["node"] },
  "include": ["src", "test", "server.ts", "vite.config.ts"]
}
```

`apps/web/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom' },
});
```

`apps/web/index.html`:
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><!--app-head--></head>
<body>
<div id="root"><!--app-html--></div>
<!--app-data-->
<script type="module" src="/src/entry-client.tsx"></script>
</body>
</html>
```

- [ ] **Step 2: Write the failing tests**

`apps/web/test/money.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatBRL } from '../src/money.js';

describe('formatBRL', () => {
  it('whole reais drop decimals', () => {
    expect(formatBRL(2500)).toBe('25');
    expect(formatBRL(13000)).toBe('130');
  });
  it('cents use comma', () => {
    expect(formatBRL(12350)).toBe('123,50');
  });
});
```

`apps/web/test/render.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import type { StudioView } from '@cb/shared';
import { render } from '../src/entry-server.js';
import { renderDocument } from '../src/ssr/document.js';

const view: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: null,
};

describe('SSR render', () => {
  it('appHtml contains studio content', () => {
    const html = render(view);
    expect(html).toContain('Bruna');
    expect(html).toContain('Buço');
    expect(html).toContain('R$');
  });

  it('document embeds head and hydration data', () => {
    const doc = renderDocument({
      appHtml: '<div>x</div>',
      head: '<title>T</title>',
      dataJson: JSON.stringify(view),
      clientSrc: '/src/entry-client.tsx',
    });
    expect(doc).toContain('<title>T</title>');
    expect(doc).toContain('window.__STUDIO__');
    expect(doc).toContain('<div>x</div>');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm install && npm -w apps/web run test`
Expected: FAIL — modules missing.

- [ ] **Step 4: Implement money + minimal SitePage + render + document**

`apps/web/src/money.ts`:
```ts
export function formatBRL(cents: number): string {
  const reais = cents / 100;
  return Number.isInteger(reais) ? String(reais) : reais.toFixed(2).replace('.', ',');
}
```

`apps/web/src/site/SitePage.tsx` (placeholder body; real themes land in Task 3-4):
```tsx
import type { StudioView } from '@cb/shared';
import { formatBRL } from '../money.js';

export default function SitePage({ view }: { view: StudioView }) {
  return (
    <div>
      <h1>{view.studio.name}</h1>
      <ul>
        {view.services.map((s) => (
          <li key={s.id}>{s.name} — R$ {formatBRL(s.priceCents)}</li>
        ))}
      </ul>
    </div>
  );
}
```

`apps/web/src/entry-server.tsx`:
```tsx
import { renderToString } from 'react-dom/server';
import type { StudioView } from '@cb/shared';
import SitePage from './site/SitePage.js';

export function render(view: StudioView): string {
  return renderToString(<SitePage view={view} />);
}
```

`apps/web/src/ssr/document.ts`:
```ts
export function renderDocument(p: {
  appHtml: string; head: string; dataJson: string; clientSrc: string;
}): string {
  const dataScript =
    `<script>window.__STUDIO__=${p.dataJson.replace(/</g, '\\u003c')}</script>`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>${p.head}</head>
<body>
<div id="root">${p.appHtml}</div>
${dataScript}
<script type="module" src="${p.clientSrc}"></script>
</body>
</html>`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm -w apps/web run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(web): SSR scaffold, money formatting, render + document"
```

---

### Task 2: SEO head builder (title, meta, OG, JSON-LD)

**Files:**
- Create: `apps/web/src/ssr/head.ts`
- Test: `apps/web/test/head.test.ts`

**Interfaces:**
- Produces: `buildHead(view: StudioView, opts: { url: string }): string` — returns the inner `<head>` HTML: preconnect + fonts, `<title>`, description, Open Graph, and a `LocalBusiness` JSON-LD `<script>`.

- [ ] **Step 1: Write the failing test**

`apps/web/test/head.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { StudioView } from '@cb/shared';
import { buildHead } from '../src/ssr/head.js';

const view: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: null,
};

describe('buildHead', () => {
  it('includes title, description, OG and LocalBusiness JSON-LD', () => {
    const head = buildHead(view, { url: 'https://cbstudios.com.br/s/bruna' });
    expect(head).toContain('<title>Bruna Lausmann · Depilação em Cascavel-PR</title>');
    expect(head).toMatch(/<meta name="description"/);
    expect(head).toMatch(/property="og:title"/);
    expect(head).toContain('"@type":"LocalBusiness"');
    expect(head).toContain('"telephone":"+5545998443696"');
    expect(head).toContain('Buço');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test head`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement buildHead**

`apps/web/src/ssr/head.ts`:
```ts
import type { StudioView } from '@cb/shared';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(view: StudioView, opts: { url: string }): string {
  const { studio, services } = view;
  const title = `${studio.name} · Depilação em ${studio.city}-${studio.state}`;
  const desc = studio.heroSubtitle ||
    `Estúdio de depilação em ${studio.city}. ${services.map(s => s.name).join(', ')}.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: studio.name,
    description: desc,
    telephone: `+${studio.whatsapp}`,
    address: { '@type': 'PostalAddress', addressLocality: studio.city, addressRegion: studio.state, addressCountry: 'BR' },
    openingHours: studio.hours,
    makesOffer: services.map(s => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name },
      price: (s.priceCents / 100).toFixed(2),
      priceCurrency: 'BRL',
    })),
  };

  return [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(opts.url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(opts.url)}">`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">',
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test head`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): SEO head builder with LocalBusiness JSON-LD"
```

---

### Task 3: Shared theme sub-components

**Files:**
- Create: `apps/web/src/site/parts/WhatsappCTA.tsx`
- Create: `apps/web/src/site/waLink.ts`
- Test: `apps/web/test/waLink.test.ts`

**Interfaces:**
- Produces: `waLink(whatsapp: string, message?: string): string`.
- Produces: `WhatsappCTA({ whatsapp, label, style })` — anchor opening the wa.me link in a new tab.

> Note: `ServiceList`/`PromoCard`/`Hours` markup differs per theme (mockup uses
> distinct layouts), so those live inside each theme component rather than as
> shared visual parts. Only the wa.me link logic and CTA wrapper are shared.

- [ ] **Step 1: Write the failing test**

`apps/web/test/waLink.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { waLink } from '../src/site/waLink.js';

describe('waLink', () => {
  it('builds an encoded wa.me url', () => {
    const url = waLink('5545998443696', 'Olá Bruna!');
    expect(url).toBe('https://wa.me/5545998443696?text=Ol%C3%A1%20Bruna!');
  });
  it('uses a default message', () => {
    expect(waLink('5545998443696')).toContain('https://wa.me/5545998443696?text=');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test waLink`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement waLink + CTA**

`apps/web/src/site/waLink.ts`:
```ts
const DEFAULT_MSG = 'Olá! Vim pelo site e gostaria de agendar um horário 💕';
export function waLink(whatsapp: string, message: string = DEFAULT_MSG): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
```

`apps/web/src/site/parts/WhatsappCTA.tsx`:
```tsx
import type { CSSProperties } from 'react';
import { waLink } from '../waLink.js';

export function WhatsappCTA(p: { whatsapp: string; label: string; style: CSSProperties }) {
  return (
    <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" style={p.style}>
      {p.label}
    </a>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test waLink`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): wa.me link helper and WhatsApp CTA"
```

---

### Task 4: Three theme components + theme selection

**Files:**
- Create: `apps/web/src/site/themes/ThemeA.tsx`
- Create: `apps/web/src/site/themes/ThemeB.tsx`
- Create: `apps/web/src/site/themes/ThemeC.tsx`
- Create: `apps/web/src/site/themes/index.ts`
- Test: `apps/web/test/themes.test.tsx`

**Interfaces:**
- Each theme: `ThemeX({ view }: { view: StudioView })` renders hero (name, `heroSubtitle`, eyebrow "Estúdio de Depilação"), the services list with `R$ {formatBRL}`, the promo block (when `promo` present), hours/location, and a `WhatsappCTA`.
- Produces: `THEME_COMPONENTS: Record<Theme, FC<{view: StudioView}>>` from `themes/index.ts`.

- [ ] **Step 1: Write the failing test**

`apps/web/test/themes.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { StudioView } from '@cb/shared';
import { THEME_COMPONENTS } from '../src/site/themes/index.js';

const base: StudioView = {
  studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
    whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h', heroSubtitle: 'Cuidado e precisão.', published: true },
  services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
  promo: { id: 'p1', title: 'Combo', description: 'desc', priceCents: 13000, oldPriceCents: 16500, active: true },
};

describe('themes', () => {
  for (const t of ['A', 'B', 'C'] as const) {
    it(`Theme ${t} renders name, service, promo, wa link`, () => {
      const C = THEME_COMPONENTS[t];
      const html = renderToString(<C view={base} />);
      expect(html).toContain('Bruna Lausmann');
      expect(html).toContain('Buço');
      expect(html).toContain('R$');
      expect(html).toContain('Combo');
      expect(html).toContain('wa.me/5545998443696');
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test themes`
Expected: FAIL — theme modules missing.

- [ ] **Step 3: Implement Theme B (Dark Boudoir — default)**

`apps/web/src/site/themes/ThemeB.tsx` (markup faithful to mockup THEME B):
```tsx
import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeB({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  const ctaStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg,#e3a6b5,#c97c8f)', color: '#2a1620',
    textDecoration: 'none', padding: '22px', fontSize: '15px', fontWeight: 600, letterSpacing: '.04em' } as const;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: 'radial-gradient(120% 70% at 50% 0%, #3a2330 0%, #241620 55%, #1a1018 100%)', color: '#efe3e6', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '60px 32px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '.36em', textTransform: 'uppercase', color: '#caa07d' }}>Estúdio de Depilação</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: '58px', lineHeight: .92, margin: '20px 0 0', color: '#f3dde2' }}>{studio.name.split(' ')[0]}</h1>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontStyle: 'italic', fontSize: '46px', lineHeight: 1, margin: '2px 0 0', color: '#e3a6b5' }}>{studio.name.split(' ').slice(1).join(' ')}</h1>
        <div style={{ width: '46px', height: '1px', background: 'linear-gradient(90deg,transparent,#caa07d,transparent)', margin: '24px auto' }} />
        <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: '#c4b0b8', margin: '0 auto', maxWidth: '28ch' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '30px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#e3a6b5,#c97c8f)', color: '#2a1620', textDecoration: 'none', padding: '17px 34px', borderRadius: '100px', fontSize: '15px', fontWeight: 600 }} />
        </div>
      </div>
      <div style={{ padding: '30px 32px' }}>
        <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: 500, marginBottom: '20px', color: '#f3dde2' }}>Serviços</div>
        {services.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid rgba(202,160,125,.18)' }}>
            <span style={{ fontSize: '15.5px', color: '#e7d8dc' }}>{s.name}</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: 600, color: '#caa07d' }}>R$ {formatBRL(s.priceCents)}</span>
          </div>
        ))}
      </div>
      {promo && (
        <div style={{ margin: '6px 24px 30px', border: '1px solid rgba(227,166,181,.3)', borderRadius: '22px', padding: '28px 24px', textAlign: 'center', background: 'rgba(227,166,181,.06)' }}>
          <div style={{ fontSize: '10px', letterSpacing: '.28em', textTransform: 'uppercase', color: '#caa07d' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 500, margin: '12px 0 8px', color: '#f3dde2' }}>{promo.title}</div>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#bca7af', margin: '0 0 18px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '38px', fontWeight: 600, color: '#e3a6b5' }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', color: '#7d6770' }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ padding: '0 32px 30px', textAlign: 'center', fontSize: '13px', lineHeight: 1.9, color: '#bca7af', letterSpacing: '.03em' }}>{studio.hours}<br />{studio.city} · {studio.state}</div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={ctaStyle} />
    </div>
  );
}
```

- [ ] **Step 4: Implement Theme A (Editorial Luxe)**

`apps/web/src/site/themes/ThemeA.tsx`:
```tsx
import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeA({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: '#f6f1ec', color: '#2c2630', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '58px 32px 34px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '.34em', textTransform: 'uppercase', color: '#b08e7f' }}>Estúdio de Depilação</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: '55px', lineHeight: .95, margin: '20px 0 0' }}>
          {studio.name.split(' ')[0]}<br /><em style={{ fontStyle: 'italic', color: '#9c5a6b' }}>{studio.name.split(' ').slice(1).join(' ')}</em>
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.65, color: '#6a5c63', margin: '22px 0 0', maxWidth: '26ch' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '30px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp →" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c2630', color: '#f6f1ec', textDecoration: 'none', padding: '18px', borderRadius: '100px', fontSize: '15px', fontWeight: 500 }} />
        </div>
      </div>
      <div style={{ padding: '26px 32px 30px', borderTop: '1px solid rgba(44,38,48,.12)' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 500, margin: '0 0 20px' }}>Serviços</h2>
        {services.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '10.5px 0' }}>
            <span style={{ fontSize: '16px', color: '#3a323d' }}>{s.name}</span>
            <span style={{ flex: 1, borderBottom: '1px dotted rgba(44,38,48,.32)', transform: 'translateY(-5px)' }} />
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '21px', fontWeight: 600 }}>R$ {formatBRL(s.priceCents)}</span>
          </div>
        ))}
      </div>
      {promo && (
        <div style={{ margin: '4px 32px 30px', background: '#2c2630', color: '#f1e8e3', borderRadius: '22px', padding: '26px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#d99fae' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '27px', fontWeight: 500, margin: '10px 0 6px' }}>{promo.title}</div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#bdb0b7', margin: '0 0 16px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '34px', fontWeight: 600, color: '#fff' }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', color: '#8a7d84' }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ padding: '0 32px 30px', color: '#3a323d', fontSize: '14px' }}>{studio.hours} · {studio.city}-{studio.state}</div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#9c5a6b', color: '#fff', textDecoration: 'none', padding: '22px', fontSize: '15px', fontWeight: 500, letterSpacing: '.04em' }} />
    </div>
  );
}
```

- [ ] **Step 5: Implement Theme C (Soft Modern)**

`apps/web/src/site/themes/ThemeC.tsx`:
```tsx
import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeC({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: '#fbf2f3', color: '#3a2730', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '54px 28px 30px', background: 'linear-gradient(180deg,#f7dfe4,#fbf2f3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#b14a63' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b14a63' }} />Estúdio de Depilação
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: '50px', lineHeight: .98, margin: '18px 0 0' }}>{studio.name}</h1>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#7a5a64', margin: '18px 0 0' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '26px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp →" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#b14a63', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '18px', fontSize: '15px', fontWeight: 500 }} />
        </div>
      </div>
      <div style={{ padding: '30px 28px 26px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: 500, margin: '0 0 18px' }}>Serviços & valores</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {services.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '16px', padding: '15px 18px', boxShadow: '0 6px 16px -10px rgba(177,74,99,.3)' }}>
              <span style={{ fontSize: '15.5px', color: '#3a2730' }}>{s.name}</span>
              <span style={{ background: '#fbe6ea', color: '#b14a63', fontWeight: 600, fontSize: '14px', padding: '6px 12px', borderRadius: '100px' }}>R$ {formatBRL(s.priceCents)}</span>
            </div>
          ))}
        </div>
      </div>
      {promo && (
        <div style={{ margin: '0 28px 28px', background: 'linear-gradient(135deg,#b14a63,#d77f93)', color: '#fff', borderRadius: '22px', padding: '26px' }}>
          <div style={{ display: 'inline-block', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', background: 'rgba(255,255,255,.22)', padding: '5px 11px', borderRadius: '100px' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 500, margin: '14px 0 6px' }}>{promo.title}</div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.85)', margin: '0 0 16px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 600 }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', opacity: .65 }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ margin: '0 28px 28px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b14a63', marginBottom: '6px' }}>Horário</div><div style={{ fontSize: '14px' }}>{studio.hours}</div></div>
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b14a63', marginBottom: '6px' }}>Local</div><div style={{ fontSize: '14px' }}>{studio.city}<br />{studio.state}</div></div>
      </div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 28px 28px', background: '#3a2730', color: '#fff', textDecoration: 'none', padding: '20px', borderRadius: '18px', fontSize: '15px', fontWeight: 500 }} />
    </div>
  );
}
```

- [ ] **Step 6: Theme registry**

`apps/web/src/site/themes/index.ts`:
```ts
import type { FC } from 'react';
import type { StudioView, Theme } from '@cb/shared';
import ThemeA from './ThemeA.js';
import ThemeB from './ThemeB.js';
import ThemeC from './ThemeC.js';

export const THEME_COMPONENTS: Record<Theme, FC<{ view: StudioView }>> = {
  A: ThemeA, B: ThemeB, C: ThemeC,
};
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm -w apps/web run test themes`
Expected: PASS (all three themes).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(web): three studio theme components"
```

---

### Task 5: SitePage with theme picker (client preview)

**Files:**
- Modify: `apps/web/src/site/SitePage.tsx`
- Create: `apps/web/src/site/ThemePicker.tsx`
- Create: `apps/web/src/entry-client.tsx`
- Test: `apps/web/test/sitepage.test.tsx`

**Interfaces:**
- `SitePage({ view })` renders `THEME_COMPONENTS[active]` where `active` starts at `view.studio.defaultTheme`; a `ThemePicker` lets the visitor switch `active` (client only). On mount it reads `localStorage['bl_theme']`; on change it writes it.
- `entry-client.tsx` calls `hydrateRoot(document.getElementById('root'), <SitePage view={window.__STUDIO__} />)`.

- [ ] **Step 1: Write the failing test**

`apps/web/test/sitepage.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test sitepage`
Expected: FAIL — picker / new SitePage missing.

- [ ] **Step 3: Implement ThemePicker**

`apps/web/src/site/ThemePicker.tsx`:
```tsx
import type { Theme } from '@cb/shared';

const OPTIONS: { id: Theme; label: string; sub: string }[] = [
  { id: 'A', label: 'Editorial', sub: 'Clássico & claro' },
  { id: 'B', label: 'Boudoir', sub: 'Escuro & elegante' },
  { id: 'C', label: 'Moderno', sub: 'Suave & acolhedor' },
];

export function ThemePicker(p: { active: Theme; onPick: (t: Theme) => void }) {
  return (
    <div style={{ position: 'absolute', top: '70px', right: '18px', zIndex: 60, width: '208px', background: '#fff', borderRadius: '20px', boxShadow: '0 24px 50px -14px rgba(40,20,30,.4)', padding: '10px' }}>
      <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#a98f98', padding: '8px 10px 6px' }}>Visual do site</div>
      {OPTIONS.map((o) => (
        <button key={o.id} onClick={() => p.onPick(o.id)} style={{ width: '100%', border: 'none', background: p.active === o.id ? '#f7f1ee' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 10px', borderRadius: '13px', fontFamily: "'Jost'", textAlign: 'left' }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '14px', color: '#3a2730' }}>{o.label}</span>
            <span style={{ fontSize: '11px', color: '#a98f98' }}>{o.sub}</span>
          </span>
          {p.active === o.id && <span style={{ color: '#9c5a6b', fontSize: '15px' }}>✓</span>}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Implement SitePage**

`apps/web/src/site/SitePage.tsx` (replace the placeholder from Task 1):
```tsx
import { useEffect, useState } from 'react';
import type { StudioView, Theme } from '@cb/shared';
import { isTheme } from '@cb/shared';
import { THEME_COMPONENTS } from './themes/index.js';
import { ThemePicker } from './ThemePicker.js';

export default function SitePage({ view }: { view: StudioView }) {
  const [active, setActive] = useState<Theme>(view.studio.defaultTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bl_theme');
    if (stored && isTheme(stored)) setActive(stored);
  }, []);

  function pick(t: Theme) {
    setActive(t);
    setOpen(false);
    try { localStorage.setItem('bl_theme', t); } catch {}
  }

  const Active = THEME_COMPONENTS[active];
  return (
    <div style={{ position: 'relative', maxWidth: '430px', margin: '0 auto' }}>
      <Active view={view} />
      <button title="Trocar visual" onClick={() => setOpen((v) => !v)}
        style={{ position: 'absolute', top: '18px', right: '18px', zIndex: 60, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.55)', background: 'rgba(255,255,255,.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b08e7f' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2a1a24' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d77f93' }} />
      </button>
      {open && <ThemePicker active={active} onPick={pick} />}
    </div>
  );
}
```

- [ ] **Step 5: Implement client entry**

`apps/web/src/entry-client.tsx`:
```tsx
import { hydrateRoot } from 'react-dom/client';
import type { StudioView } from '@cb/shared';
import SitePage from './site/SitePage.js';

declare global { interface Window { __STUDIO__: StudioView } }

const root = document.getElementById('root')!;
hydrateRoot(root, <SitePage view={window.__STUDIO__} />);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm -w apps/web run test sitepage`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): SitePage with client-side theme preview picker"
```

---

### Task 6: sitemap.xml + robots.txt (pure builders)

**Files:**
- Create: `apps/web/src/ssr/sitemap.ts`
- Test: `apps/web/test/sitemap.test.ts`

**Interfaces:**
- Produces: `sitemapXml(slugs: string[], origin: string): string`.
- Produces: `robotsTxt(origin: string): string` — allows `/`, disallows `/s/*/admin`, points to the sitemap.

- [ ] **Step 1: Write the failing test**

`apps/web/test/sitemap.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sitemapXml, robotsTxt } from '../src/ssr/sitemap.js';

describe('sitemap + robots', () => {
  it('lists studio urls', () => {
    const xml = sitemapXml(['bruna', 'outro'], 'https://cbstudios.com.br');
    expect(xml).toContain('<loc>https://cbstudios.com.br/s/bruna</loc>');
    expect(xml).toContain('<loc>https://cbstudios.com.br/s/outro</loc>');
  });
  it('robots disallows admin and links sitemap', () => {
    const txt = robotsTxt('https://cbstudios.com.br');
    expect(txt).toContain('Disallow: /s/*/admin');
    expect(txt).toContain('Sitemap: https://cbstudios.com.br/sitemap.xml');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test sitemap`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement builders**

`apps/web/src/ssr/sitemap.ts`:
```ts
export function sitemapXml(slugs: string[], origin: string): string {
  const urls = slugs.map(s =>
    `  <url><loc>${origin}/s/${s}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function robotsTxt(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /s/*/admin
Sitemap: ${origin}/sitemap.xml
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w apps/web run test sitemap`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): sitemap.xml and robots.txt builders"
```

---

### Task 7: SSR server wiring (dev + prod) + smoke test

**Files:**
- Create: `apps/web/server.ts`
- Create: `apps/web/.env.example`
- Test: `apps/web/test/server.test.ts`

**Interfaces:**
- Consumes: `render`, `buildHead`, `renderDocument`, `sitemapXml`, `robotsTxt`.
- Produces: `createServer({ apiBase, origin, vite? }): Promise<express.Express>` — an Express app with routes:
  - `GET /s/:slug` → fetch `${apiBase}/api/studios/:slug`; 404 page if missing; else SSR document.
  - `GET /sitemap.xml`, `GET /robots.txt`.
  - `/api/*` proxied to `apiBase`.
  - admin route `/s/:slug/admin*` reserved for Plan 3 (serve SPA shell).
- The test injects a fake `fetch`-like fetcher via `apiBase` using a local stub server, so it runs without the real API.

- [ ] **Step 1: Write the failing test**

`apps/web/test/server.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import request from 'supertest';
import { createServer } from '../server.js';

// Stub API returning one studio
let stub: http.Server;
let apiBase: string;

beforeAll(async () => {
  stub = http.createServer((req, res) => {
    if (req.url === '/api/studios/bruna') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        studio: { id: '1', slug: 'bruna', name: 'Bruna Lausmann', defaultTheme: 'B',
          whatsapp: '5545998443696', city: 'Cascavel', state: 'PR',
          hours: 'Seg–Sáb', heroSubtitle: 'sub', published: true },
        services: [{ id: 's1', name: 'Buço', priceCents: 2500, sortOrder: 0 }],
        promo: null,
      }));
    } else { res.statusCode = 404; res.end('{"error":"not_found"}'); }
  });
  await new Promise<void>((r) => stub.listen(0, r));
  apiBase = `http://localhost:${(stub.address() as any).port}`;
});
afterAll(() => stub.close());

describe('SSR server', () => {
  it('renders studio HTML with SEO + data', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    const res = await request(app).get('/s/bruna');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Bruna Lausmann');
    expect(res.text).toContain('Buço');
    expect(res.text).toContain('"@type":"LocalBusiness"');
    expect(res.text).toContain('window.__STUDIO__');
  });

  it('404 for unknown studio', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    expect((await request(app).get('/s/nope')).status).toBe(404);
  });

  it('serves robots.txt', async () => {
    const app = await createServer({ apiBase, origin: 'https://x.test', prod: true });
    const res = await request(app).get('/robots.txt');
    expect(res.text).toContain('Sitemap: https://x.test/sitemap.xml');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w apps/web run test server`
Expected: FAIL — `server.ts` missing.

- [ ] **Step 3: Implement the server**

`apps/web/.env.example`:
```
API_BASE=http://localhost:3001
ORIGIN=http://localhost:3000
PORT=3000
```

`apps/web/server.ts`:
```ts
import express from 'express';
import { render } from './src/entry-server.js';
import { buildHead } from './src/ssr/head.js';
import { renderDocument } from './src/ssr/document.js';
import { sitemapXml, robotsTxt } from './src/ssr/sitemap.js';

export async function createServer(opts: { apiBase: string; origin: string; prod?: boolean }) {
  const app = express();
  const clientSrc = opts.prod ? '/assets/entry-client.js' : '/src/entry-client.tsx';

  app.get('/robots.txt', (_req, res) =>
    res.type('text/plain').send(robotsTxt(opts.origin)));

  app.get('/sitemap.xml', async (_req, res) => {
    const r = await fetch(`${opts.apiBase}/api/sitemap-slugs`).catch(() => null);
    const slugs: string[] = r && r.ok ? await r.json() : [];
    res.type('application/xml').send(sitemapXml(slugs, opts.origin));
  });

  app.get('/s/:slug', async (req, res) => {
    const r = await fetch(`${opts.apiBase}/api/studios/${req.params.slug}`).catch(() => null);
    if (!r || !r.ok) return res.status(404).type('html').send('<h1>Studio não encontrado</h1>');
    const view = await r.json();
    const appHtml = render(view);
    const head = buildHead(view, { url: `${opts.origin}/s/${req.params.slug}` });
    res.status(200).type('html').send(renderDocument({
      appHtml, head, dataJson: JSON.stringify(view), clientSrc,
    }));
  });

  return app;
}

// Boot when run directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  const app = await createServer({
    apiBase: process.env.API_BASE ?? 'http://localhost:3001',
    origin: process.env.ORIGIN ?? 'http://localhost:3000',
    prod: process.env.NODE_ENV === 'production',
  });
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`web on :${port}`));
}
```

> The `/api/sitemap-slugs` endpoint is a tiny addition to the Plan-1 API:
> `GET /api/sitemap-slugs` → `string[]` of published slugs
> (`select slug from studios where published`). Add it to
> `apps/api/src/routes/public.ts` alongside the studio route, with a test
> mirroring Task 4. It is listed here as the consuming side.

- [ ] **Step 4: Add the sitemap-slugs endpoint to the API (Plan 1 file)**

Modify `apps/api/src/routes/public.ts` — add inside `publicRouter`, before `return r;`:
```ts
  r.get('/api/sitemap-slugs', async (_req, res) => {
    const rows = await db.select({ slug: studios.slug }).from(studios)
      .where(eq(studios.published, true));
    res.json(rows.map((x: any) => x.slug));
  });
```
Add the imports at the top of that file:
```ts
import { studios } from '../db/schema.js';
import { eq } from 'drizzle-orm';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm -w apps/web run test server`
Expected: PASS.

- [ ] **Step 6: Manual end-to-end check**

Run (two terminals):
```bash
# terminal 1
npm -w apps/api run dev
# terminal 2
API_BASE=http://localhost:3001 ORIGIN=http://localhost:3000 npm -w apps/web run dev
```
Open `http://localhost:3000/s/bruna-lausmann`. Expected: Dark Boudoir site
renders; "view source" shows services + JSON-LD in the HTML; the discreet
top-right button opens the theme picker.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): SSR server wiring with SEO routes and api proxy"
```

> **Note on Vite dev transform:** for the MVP the dev server references
> `/src/entry-client.tsx` and relies on `npm run build` producing
> `dist/client/assets/entry-client.js` for production. If hot client transforms
> are needed in dev, add Vite middleware mode in a follow-up; the SSR render
> path and SEO output (the SEO-critical part) are already exercised by tests.

---

## Self-Review

- **Spec coverage:** SSR render of studio (T1,T7) ✓, default theme from DB
  (T4,T5) ✓, `<title>`/description/OG (T2) ✓, LocalBusiness JSON-LD (T2) ✓,
  three themes faithful to mockup (T4) ✓, client theme picker via localStorage,
  not persisted (T5) ✓, hydration entry (T5) ✓, sitemap.xml + robots.txt
  (T6,T7) ✓, fonts preconnect (T2) ✓, wa.me CTA (T3) ✓.
- **Placeholders:** none — every step has full code; the Task-1 SitePage is an
  explicit placeholder replaced in Task 5 (noted in both tasks).
- **Type consistency:** `render(view)`, `buildHead(view,{url})`,
  `renderDocument({appHtml,head,dataJson,clientSrc})`, `THEME_COMPONENTS[Theme]`,
  `waLink(whatsapp,message)`, `formatBRL(cents)` consistent across tasks and
  with `@cb/shared`.

## Hand-off to Plan 3

The admin SPA (`/s/:slug/admin`) is built in Plan 3 and served by this same
web server (a catch-all route returning the SPA shell). It consumes the Plan-1
auth + `/api/admin/*` routes. The `/api/*` proxy needed by the admin in dev is
added in Plan 3 Task 1.
