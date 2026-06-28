import { useState } from 'react';
import { adminApi } from '../api.js';

const ERRORS: Record<string, string> = {
  invalid_current_password: 'Senha atual incorreta',
  weak_password: 'Senha muito curta (mínimo 8 caracteres)',
  network: 'Não foi possível alterar a senha. Verifique a conexão.',
};

export function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() { setError(''); setSaved(false); }

  async function save() {
    if (busy) return;
    setError(''); setSaved(false);
    if (!current) { setError('Informe a senha atual'); return; }
    if (next !== confirm) { setError('As senhas não conferem'); return; }
    if (next.length < 8) { setError('Senha muito curta (mínimo 8 caracteres)'); return; }
    setBusy(true);
    try {
      const r = await adminApi.changePassword(current, next);
      if (r.ok) {
        setSaved(true);
        setCurrent(''); setNext(''); setConfirm('');
        return;
      }
      setError(ERRORS[r.error ?? ''] ?? 'Não foi possível alterar a senha');
    } finally {
      setBusy(false);
    }
  }

  const field = { padding: '12px', borderRadius: '12px', border: '1px solid #d9c8c0', width: '100%' } as const;
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Senha atual
        <input type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); reset(); }} style={field} />
      </label>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Nova senha
        <input type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); reset(); }} style={field} />
      </label>
      <label style={{ fontSize: '13px', color: '#7a6a72' }}>Confirmar senha
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); reset(); }} style={field} />
      </label>
      <button type="submit" disabled={busy} style={{ padding: '14px', borderRadius: '100px', border: 'none', background: '#2c2630', color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Salvando…' : 'Salvar'}</button>
      {error && <div style={{ color: '#b3402f', fontSize: '13px' }}>{error}</div>}
      {saved && <div style={{ color: '#3a8a5c', fontSize: '13px' }}>Senha alterada ✓</div>}
    </form>
  );
}
