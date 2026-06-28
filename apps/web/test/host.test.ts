import { describe, it, expect } from 'vitest';
import { slugFromHost, originForHost } from '../src/ssr/host.js';

describe('slugFromHost', () => {
  const base = 'agendou.vip';
  it('extracts a single-label subdomain as slug', () => {
    expect(slugFromHost('bruna.agendou.vip', base)).toBe('bruna');
    expect(slugFromHost('studiox.agendou.vip', base)).toBe('studiox');
  });
  it('strips a port', () => {
    expect(slugFromHost('bruna.agendou.vip:3000', base)).toBe('bruna');
  });
  it('returns null for apex, www, and foreign hosts', () => {
    expect(slugFromHost('agendou.vip', base)).toBeNull();
    expect(slugFromHost('www.agendou.vip', base)).toBeNull();
    expect(slugFromHost('localhost', base)).toBeNull();
    expect(slugFromHost('example.com', base)).toBeNull();
  });
  it('returns null for nested subdomains', () => {
    expect(slugFromHost('a.b.agendou.vip', base)).toBeNull();
  });
});

describe('originForHost', () => {
  it('builds an https origin for a studio host', () => {
    expect(originForHost('bruna.agendou.vip', 'https://agendou.vip')).toBe('https://bruna.agendou.vip');
  });
  it('keeps the dev fallback for localhost', () => {
    expect(originForHost('localhost', 'http://localhost:3000')).toBe('http://localhost:3000');
  });
});
