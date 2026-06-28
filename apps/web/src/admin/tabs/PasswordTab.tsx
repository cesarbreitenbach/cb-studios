import { useState } from 'react';
import { adminApi } from '../api.js';

const ERRORS: Record<string, string> = {
  invalid_current_password: 'Senha atual incorreta',
  weak_password: 'Senha muito curta (mínimo 8 caracteres)',
};

export function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function reset() { setError(''); setSaved(false); }

  async function save() {
    setError(''); setSaved(false);
    if (next !== confirm) { setError('As senhas não conferem'); return; }
    if (next.length < 8) { setError('Senha muito curta (mínimo 8 caracteres)'); return; }
    const r = await adminApi.changePassword(current, next);
    if (r.ok) {
      setSaved(true);
      setCurrent(''); setNext(''); setConfirm('');
      return;
    }
    setError(ERRORS[r.error ?? ''] ?? 'Não foi possível alterar a senha');
  }

  const field = { padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0', width: '100%' } as const;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Senha atual
        <input type="password" value={current} onChange={(e) => { setCurrent(e.target.value); reset(); }} style={field} />
      </label>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Nova senha
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); reset(); }} style={field} />
      </label>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Confirmar senha
        <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); reset(); }} style={field} />
      </label>
      <button onClick={save} style={{ padding: '14px', borderRadius: '100px', border: 'none', background: '#2c2630', color: '#fff', cursor: 'pointer' }}>Salvar</button>
      {error && <div style={{ color: '#b3402f', fontSize: '13px' }}>{error}</div>}
      {saved && <div style={{ color: '#3a8a5c', fontSize: '13px' }}>Senha alterada ✓</div>}
    </div>
  );
}
