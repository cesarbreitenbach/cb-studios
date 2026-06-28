import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { Login } from './Login.js';
import { Dashboard } from './Dashboard.js';

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { adminApi.me().then((m) => setAuthed(!!m)); }, []);
  if (authed === null) return <div style={{ padding: 40 }}>Carregando…</div>;
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}
