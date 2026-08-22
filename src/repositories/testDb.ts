import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

import * as schema from "../db/schema";
import type { AppDatabase } from "./types";

/**
 * An in-memory SQLite database, migrated with the same SQL files the app
 * ships, for exercising repository logic in Jest without the native
 * expo-sqlite module. Both drivers are drizzle's "sync" SQLite dialect, so
 * repositories written against `AppDatabase` work unmodified against this.
 */
export function createTestDb(): AppDatabase {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, "../db/migrations") });
  return db as unknown as AppDatabase;
}
