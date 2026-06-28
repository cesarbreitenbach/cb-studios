import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeB({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  const ctaStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(180deg,#e3a6b5,#c97c8f)', color: '#2a1620',
    textDecoration: 'none', padding: '22px', fontSize: '15px', fontWeight: 600, letterSpacing: '.04em' } as const;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: 'radial-gradient(120% 70% at 50% 0%, #3a2330 0%, #241620 55%, #1a1018 100%)', color: '#efe3e6', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '60px 32px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '.36em', textTransform: 'uppercase', color: '#caa07d' }}>Estúdio de Depilação</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontSize: '58px', lineHeight: .92, margin: '20px 0 0', color: '#f3dde2' }}>{studio.name.split(' ')[0]}</h1>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 400, fontStyle: 'italic', fontSize: '46px', lineHeight: 1, margin: '2px 0 0', color: '#e3a6b5' }}>{studio.name.split(' ').slice(1).join(' ')}</h1>
        <div style={{ width: '46px', height: '1px', background: 'linear-gradient(90deg,transparent,#caa07d,transparent)', margin: '24px auto' }} />
        <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: '#c4b0b8', margin: '0 auto', maxWidth: '28ch' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '30px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#e3a6b5,#c97c8f)', color: '#2a1620', textDecoration: 'none', padding: '17px 34px', borderRadius: '100px', fontSize: '15px', fontWeight: 600 }} />
        </div>
      </div>
      <div style={{ padding: '30px 32px' }}>
        <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: 500, marginBottom: '20px', color: '#f3dde2' }}>Serviços</div>
        {services.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid rgba(202,160,125,.18)' }}>
            <span style={{ fontSize: '15.5px', color: '#e7d8dc' }}>{s.name}</span>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', fontWeight: 600, color: '#caa07d' }}>R$ {formatBRL(s.priceCents)}</span>
          </div>
        ))}
      </div>
      {promo && (
        <div style={{ margin: '6px 24px 30px', border: '1px solid rgba(227,166,181,.3)', borderRadius: '22px', padding: '28px 24px', textAlign: 'center', background: 'rgba(227,166,181,.06)' }}>
          <div style={{ fontSize: '10px', letterSpacing: '.28em', textTransform: 'uppercase', color: '#caa07d' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 500, margin: '12px 0 8px', color: '#f3dde2' }}>{promo.title}</div>
          <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#bca7af', margin: '0 0 18px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '38px', fontWeight: 600, color: '#e3a6b5' }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', color: '#7d6770' }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ padding: '0 32px 30px', textAlign: 'center', fontSize: '13px', lineHeight: 1.9, color: '#bca7af', letterSpacing: '.03em' }}>{studio.hours}<br />{studio.city} · {studio.state}</div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={ctaStyle} />
    </div>
  );
}
