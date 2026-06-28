import type { CSSProperties } from 'react';
import { waLink } from '../waLink.js';

export function WhatsappCTA(p: { whatsapp: string; label: string; style: CSSProperties }) {
  return (
    <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" style={p.style}>
      {p.label}
    </a>
  );
}
