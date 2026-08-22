import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

/**
 * One-shot script: `npm run db:migrate` (see package.json). Applies every
 * migration in src/db/migrations against DATABASE_URL. Safe to run
 * repeatedly — already-applied migrations are tracked and skipped.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required (set it in server/.env)');
  }

  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection, { mode: 'default' });

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Migrations complete.');

  await connection.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
