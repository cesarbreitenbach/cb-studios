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
