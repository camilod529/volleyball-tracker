/**
 * Hostinger's control panel hands you host/database/user/password, not a
 * ready-made connection URL — hand-building one risks silently mangling a
 * password with special characters (@, :, /, etc. need percent-encoding).
 * So discrete DB_* vars are the primary/recommended path; a single
 * DATABASE_URL is still supported as a fallback for hosts that hand you one
 * directly (e.g. a managed MySQL add-on).
 */
export type DbConnectionConfig =
  | string
  | {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };

export function resolveDbConnectionConfig(
  get: (key: string) => string | undefined,
): DbConnectionConfig {
  const host = get('DB_HOST');
  const user = get('DB_USER');
  const password = get('DB_PASSWORD');
  const database = get('DB_NAME');

  if (host && user && password && database) {
    return {
      host,
      port: Number(get('DB_PORT') ?? 3306),
      user,
      password,
      database,
    };
  }

  const databaseUrl = get('DATABASE_URL');
  if (databaseUrl) {
    return databaseUrl;
  }

  throw new Error(
    'Set either DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (recommended) or DATABASE_URL in server/.env — see .env.example.',
  );
}
