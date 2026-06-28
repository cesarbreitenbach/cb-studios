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
