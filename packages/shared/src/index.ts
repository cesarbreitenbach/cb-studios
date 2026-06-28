export const THEMES = ['A', 'B', 'C'] as const;
export type Theme = typeof THEMES[number];
export const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

export interface Studio {
  id: string; slug: string; name: string; defaultTheme: Theme;
  whatsapp: string; city: string; state: string; hours: string;
  heroSubtitle: string; published: boolean;
}
export interface Service { id: string; name: string; priceCents: number; sortOrder: number; }
export interface Promo {
  id: string; title: string; description: string;
  priceCents: number; oldPriceCents: number | null; active: boolean;
}
export interface StudioView { studio: Studio; services: Service[]; promo: Promo | null; }
