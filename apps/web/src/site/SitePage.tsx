import type { StudioView } from '@cb/shared';
import { formatBRL } from '../money.js';

export default function SitePage({ view }: { view: StudioView }) {
  return (
    <div>
      <h1>{view.studio.name}</h1>
      <ul>
        {view.services.map((s) => (
          <li key={s.id}>{s.name} — R$ {formatBRL(s.priceCents)}</li>
        ))}
      </ul>
    </div>
  );
}
