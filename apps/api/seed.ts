import bcrypt from 'bcryptjs';
import { makeDb } from './src/db/client.js';
import { studios, admins, services, promos } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

const { pool, db } = makeDb(process.env.DATABASE_URL!);

const existing = await db.select().from(studios).where(eq(studios.slug, 'bruna'));
if (existing.length === 0) {
  const [s] = await db.insert(studios).values({
    slug: 'bruna',
    name: 'Bruna Lausmann',
    defaultTheme: 'B',
    whatsapp: '5545998443696',
    city: 'Cascavel',
    state: 'PR',
    hours: 'Seg–Sáb · 9h às 19h',
    heroSubtitle: 'Um ritual de cuidado pensado para realçar a beleza natural da sua pele.',
  }).returning();

  await db.insert(admins).values({
    studioId: s.id,
    email: 'bruna@cbstudios.com.br',
    passwordHash: await bcrypt.hash('bruna123', 10),
  });

  await db.insert(services).values([
    { studioId: s.id, name: 'Buço', priceCents: 2500, sortOrder: 0 },
    { studioId: s.id, name: 'Axila', priceCents: 3000, sortOrder: 1 },
    { studioId: s.id, name: 'Meia perna', priceCents: 4500, sortOrder: 2 },
    { studioId: s.id, name: 'Perna completa', priceCents: 7000, sortOrder: 3 },
    { studioId: s.id, name: 'Virilha simples', priceCents: 4000, sortOrder: 4 },
    { studioId: s.id, name: 'Virilha completa', priceCents: 6500, sortOrder: 5 },
  ]);

  await db.insert(promos).values({
    studioId: s.id,
    title: 'Combo Completo',
    description: 'Perna completa + virilha completa + axila',
    priceCents: 13000,
    oldPriceCents: 16500,
    active: true,
  });
  console.log('seeded bruna (login bruna@cbstudios.com.br / bruna123)');
} else {
  console.log('bruna already seeded');
}
await pool.end();
