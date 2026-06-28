import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeA({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: '#f6f1ec', color: '#2c2630', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '58px 32px 34px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '.34em', textTransform: 'uppercase', color: '#b08e7f' }}>Estúdio de Depilação</div>
        <span style={{ display: 'none' }}>{studio.name}</span>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: '55px', lineHeight: .95, margin: '20px 0 0' }}>
          {studio.name.split(' ')[0]}<br /><em style={{ fontStyle: 'italic', color: '#9c5a6b' }}>{studio.name.split(' ').slice(1).join(' ')}</em>
        </h1>
        <p style={{ fontSize: '15px', lineHeight: 1.65, color: '#6a5c63', margin: '22px 0 0', maxWidth: '26ch' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '30px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp →" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2c2630', color: '#f6f1ec', textDecoration: 'none', padding: '18px', borderRadius: '100px', fontSize: '15px', fontWeight: 500 }} />
        </div>
      </div>
      <div style={{ padding: '26px 32px 30px', borderTop: '1px solid rgba(44,38,48,.12)' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 500, margin: '0 0 20px' }}>Serviços</h2>
        {services.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '10.5px 0' }}>
            <span style={{ fontSize: '16px', color: '#3a323d' }}>{s.name}</span>
            <span style={{ flex: 1, borderBottom: '1px dotted rgba(44,38,48,.32)', transform: 'translateY(-5px)' }} />
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '21px', fontWeight: 600 }}>R$ {formatBRL(s.priceCents)}</span>
          </div>
        ))}
      </div>
      {promo && (
        <div style={{ margin: '4px 32px 30px', background: '#2c2630', color: '#f1e8e3', borderRadius: '22px', padding: '26px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '.26em', textTransform: 'uppercase', color: '#d99fae' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '27px', fontWeight: 500, margin: '10px 0 6px' }}>{promo.title}</div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: '#bdb0b7', margin: '0 0 16px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '34px', fontWeight: 600, color: '#fff' }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', color: '#8a7d84' }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ padding: '0 32px 30px', color: '#3a323d', fontSize: '14px' }}>{studio.hours} · {studio.city}-{studio.state}</div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#9c5a6b', color: '#fff', textDecoration: 'none', padding: '22px', fontSize: '15px', fontWeight: 500, letterSpacing: '.04em' }} />
    </div>
  );
}
