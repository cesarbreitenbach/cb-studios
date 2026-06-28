import { makeDb } from '../src/db/client.js';

const url = process.env.TEST_DATABASE_URL
  ?? 'postgres://cb:cb@localhost:5435/cbstudios_test';
export const { pool, db } = makeDb(url);

export async function resetDb() {
  await pool.query('TRUNCATE studios, admins, services, promos RESTART IDENTITY CASCADE');
}
export async function closeDb() {
  await pool.end();
}
