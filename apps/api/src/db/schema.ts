import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const studios = pgTable('studios', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  defaultTheme: text('default_theme').notNull().default('B'),
  whatsapp: text('whatsapp').notNull().default(''),
  city: text('city').notNull().default(''),
  state: text('state').notNull().default(''),
  hours: text('hours').notNull().default(''),
  heroSubtitle: text('hero_subtitle').notNull().default(''),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceCents: integer('price_cents').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byStudio: index('services_studio_idx').on(t.studioId) }));

export const promos = pgTable('promos', {
  id: uuid('id').defaultRandom().primaryKey(),
  studioId: uuid('studio_id').notNull().references(() => studios.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priceCents: integer('price_cents').notNull(),
  oldPriceCents: integer('old_price_cents'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byStudio: index('promos_studio_idx').on(t.studioId) }));
