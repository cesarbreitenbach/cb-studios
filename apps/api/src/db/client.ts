import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export function makeDb(url = process.env.DATABASE_URL!) {
  const pool = new pg.Pool({ connectionString: url });
  return { pool, db: drizzle(pool, { schema }) };
}

export const { pool, db } = makeDb(process.env.DATABASE_URL!);
