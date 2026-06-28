import type { StudioView } from '@cb/shared';
import { formatBRL } from '../../money.js';
import { WhatsappCTA } from '../parts/WhatsappCTA.js';

export default function ThemeC({ view }: { view: StudioView }) {
  const { studio, services, promo } = view;
  return (
    <div style={{ width: '100%', minHeight: '800px', background: '#fbf2f3', color: '#3a2730', fontFamily: "'Jost',sans-serif" }}>
      <div style={{ padding: '54px 28px 30px', background: 'linear-gradient(180deg,#f7dfe4,#fbf2f3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#b14a63' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#b14a63' }} />Estúdio de Depilação
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: '50px', lineHeight: .98, margin: '18px 0 0' }}>{studio.name}</h1>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#7a5a64', margin: '18px 0 0' }}>{studio.heroSubtitle}</p>
        <div style={{ marginTop: '26px' }}>
          <WhatsappCTA whatsapp={studio.whatsapp} label="Agendar pelo WhatsApp →" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#b14a63', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '18px', fontSize: '15px', fontWeight: 500 }} />
        </div>
      </div>
      <div style={{ padding: '30px 28px 26px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '30px', fontWeight: 500, margin: '0 0 18px' }}>Serviços & valores</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {services.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderRadius: '16px', padding: '15px 18px', boxShadow: '0 6px 16px -10px rgba(177,74,99,.3)' }}>
              <span style={{ fontSize: '15.5px', color: '#3a2730' }}>{s.name}</span>
              <span style={{ background: '#fbe6ea', color: '#b14a63', fontWeight: 600, fontSize: '14px', padding: '6px 12px', borderRadius: '100px' }}>R$ {formatBRL(s.priceCents)}</span>
            </div>
          ))}
        </div>
      </div>
      {promo && (
        <div style={{ margin: '0 28px 28px', background: 'linear-gradient(135deg,#b14a63,#d77f93)', color: '#fff', borderRadius: '22px', padding: '26px' }}>
          <div style={{ display: 'inline-block', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', background: 'rgba(255,255,255,.22)', padding: '5px 11px', borderRadius: '100px' }}>Promoção do mês</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 500, margin: '14px 0 6px' }}>{promo.title}</div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.55, color: 'rgba(255,255,255,.85)', margin: '0 0 16px' }}>{promo.description}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '36px', fontWeight: 600 }}>R$ {formatBRL(promo.priceCents)}</span>
            {promo.oldPriceCents != null && <span style={{ fontSize: '15px', textDecoration: 'line-through', opacity: .65 }}>R$ {formatBRL(promo.oldPriceCents)}</span>}
          </div>
        </div>
      )}
      <div style={{ margin: '0 28px 28px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b14a63', marginBottom: '6px' }}>Horário</div><div style={{ fontSize: '14px' }}>{studio.hours}</div></div>
        <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b14a63', marginBottom: '6px' }}>Local</div><div style={{ fontSize: '14px' }}>{studio.city}<br />{studio.state}</div></div>
      </div>
      <WhatsappCTA whatsapp={studio.whatsapp} label="Reservar meu horário" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 28px 28px', background: '#3a2730', color: '#fff', textDecoration: 'none', padding: '20px', borderRadius: '18px', fontSize: '15px', fontWeight: 500 }} />
    </div>
  );
}
