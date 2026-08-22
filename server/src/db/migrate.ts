import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

import { resolveDbConnectionConfig } from './connection-config';

/**
 * One-shot script: `npm run db:migrate` (see package.json). Applies every
 * migration in src/db/migrations against the configured DB. Safe to run
 * repeatedly — already-applied migrations are tracked and skipped.
 */
async function main() {
  const config = resolveDbConnectionConfig((key) => process.env[key]);
  // mysql2's overloads don't resolve against a union type directly — the
  // typeof branch (same call either way) narrows config for TS.
  const connection =
    typeof config === 'string'
      ? await mysql.createConnection(config)
      : await mysql.createConnection(config);
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
