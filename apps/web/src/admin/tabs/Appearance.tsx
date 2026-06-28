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
