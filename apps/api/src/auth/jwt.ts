import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export type TokenPayload = { adminId: string; studioId: string };

export function signToken(p: TokenPayload): string {
  return jwt.sign(p, secret, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const d = jwt.verify(token, secret) as any;
    return { adminId: d.adminId, studioId: d.studioId };
  } catch {
    return null;
  }
}
