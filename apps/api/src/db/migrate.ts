import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { makeDb } from './client.js';

const url = process.env.DATABASE_URL!;
const { pool, db } = makeDb(url);
await migrate(db, { migrationsFolder: 'drizzle' });
await pool.end();
console.log('migrations applied');
