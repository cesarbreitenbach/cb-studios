import { useEffect, useState } from 'react';
import type { StudioView, Theme } from '@cb/shared';
import { isTheme } from '@cb/shared';
import { THEME_COMPONENTS } from './themes/index.js';
import { ThemePicker } from './ThemePicker.js';

export default function SitePage({ view }: { view: StudioView }) {
  const [active, setActive] = useState<Theme>(view.studio.defaultTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bl_theme');
    if (stored && isTheme(stored)) setActive(stored);
  }, []);

  function pick(t: Theme) {
    setActive(t);
    setOpen(false);
    try { localStorage.setItem('bl_theme', t); } catch {}
  }

  const Active = THEME_COMPONENTS[active];
  return (
    <div style={{ position: 'relative', maxWidth: '430px', margin: '0 auto' }}>
      <Active view={view} />
      <button title="Trocar visual" onClick={() => setOpen((v) => !v)}
        style={{ position: 'absolute', top: '18px', right: '18px', zIndex: 60, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.55)', background: 'rgba(255,255,255,.55)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b08e7f' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2a1a24' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d77f93' }} />
      </button>
      {open && <ThemePicker active={active} onPick={pick} />}
    </div>
  );
}
