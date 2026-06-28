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
