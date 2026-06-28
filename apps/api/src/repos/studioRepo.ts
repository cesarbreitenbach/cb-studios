import { eq, and, asc } from 'drizzle-orm';
import { studios, services, promos } from '../db/schema.js';
import type { StudioView } from '@cb/shared';

export async function getStudioBySlug(db: any, slug: string): Promise<StudioView | null> {
  const [studio] = await db.select().from(studios).where(eq(studios.slug, slug)).limit(1);
  if (!studio) return null;
  const svc = await db.select().from(services)
    .where(eq(services.studioId, studio.id)).orderBy(asc(services.sortOrder));
  const [promo] = await db.select().from(promos)
    .where(and(eq(promos.studioId, studio.id), eq(promos.active, true))).limit(1);
  return { studio, services: svc, promo: promo ?? null };
}
