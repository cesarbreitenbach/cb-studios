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
