import { describe, it, expect } from 'vitest';
import { waLink } from '../src/site/waLink.js';

describe('waLink', () => {
  it('builds an encoded wa.me url', () => {
    const url = waLink('5545998443696', 'Olá Bruna!');
    expect(url).toBe('https://wa.me/5545998443696?text=Ol%C3%A1%20Bruna!');
  });
  it('uses a default message', () => {
    expect(waLink('5545998443696')).toContain('https://wa.me/5545998443696?text=');
  });
});
