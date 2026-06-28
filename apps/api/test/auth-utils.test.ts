import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/password.js';
import { signToken, verifyToken } from '../src/auth/jwt.js';

describe('auth utils', () => {
  it('hashes and verifies password', async () => {
    const h = await hashPassword('secret');
    expect(await verifyPassword('secret', h)).toBe(true);
    expect(await verifyPassword('wrong', h)).toBe(false);
  });

  it('signs and verifies a token', () => {
    const t = signToken({ adminId: 'a1', studioId: 's1' });
    expect(verifyToken(t)).toMatchObject({ adminId: 'a1', studioId: 's1' });
    expect(verifyToken('garbage')).toBeNull();
  });
});
