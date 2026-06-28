import { describe, it, expect } from 'vitest';
import { formatBRL } from '../src/money.js';

describe('formatBRL', () => {
  it('whole reais drop decimals', () => {
    expect(formatBRL(2500)).toBe('25');
    expect(formatBRL(13000)).toBe('130');
  });
  it('cents use comma', () => {
    expect(formatBRL(12350)).toBe('123,50');
  });
});
