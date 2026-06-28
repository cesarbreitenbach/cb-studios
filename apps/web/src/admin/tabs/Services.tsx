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
