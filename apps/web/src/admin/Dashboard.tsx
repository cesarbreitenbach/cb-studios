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
