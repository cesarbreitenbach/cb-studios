import { describe, it, expect } from 'vitest';
import { THEMES, isTheme } from '../src/index.js';

describe('shared', () => {
  it('exposes themes and a guard', () => {
    expect(THEMES).toEqual(['A', 'B', 'C']);
    expect(isTheme('A')).toBe(true);
    expect(isTheme('Z')).toBe(false);
  });
});
