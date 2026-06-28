// Resolve a studio slug from the request Host header in subdomain mode.
// `bruna.agendou.vip` -> "bruna"; the apex, www, and multi-label hosts -> null
// (null means "not a studio subdomain" — fall back to path-based /s/:slug).
export function slugFromHost(host: string | undefined, baseDomain: string): string | null {
  const h = (host ?? '').split(':')[0].toLowerCase().trim();
  const base = baseDomain.toLowerCase().trim();
  if (!h || !base) return null;
  if (h === base || h === `www.${base}`) return null;
  if (!h.endsWith(`.${base}`)) return null;
  const label = h.slice(0, h.length - base.length - 1);
  // Only a single-label subdomain is a studio (no nested dots, no empty/www).
  if (!label || label.includes('.') || label === 'www') return null;
  return label;
}

// The public origin for a given request host, used for canonical/OG/sitemap URLs.
// In subdomain mode each studio canonicalizes to its own https origin.
export function originForHost(host: string | undefined, fallbackOrigin: string): string {
  const h = (host ?? '').split(':')[0].toLowerCase().trim();
  if (!h) return fallbackOrigin;
  const scheme = fallbackOrigin.startsWith('https') ? 'https' : 'http';
  // Preserve the dev fallback (localhost keeps its port-bearing origin).
  if (h === 'localhost' || h === '127.0.0.1') return fallbackOrigin;
  return `${scheme}://${h}`;
}
