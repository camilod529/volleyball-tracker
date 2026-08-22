import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import type * as schema from "../db/schema";

/**
 * Structural type both the production expo-sqlite driver and the
 * better-sqlite3 driver used in tests satisfy, so repository logic can be
 * exercised in Jest without the native Expo SQLite module.
 */
export type AppDatabase = BaseSQLiteDatabase<"sync", unknown, typeof schema>;

export interface Repository<TSelect, TCreate, TUpdate = Partial<TCreate>> {
  create(input: TCreate): Promise<TSelect>;
  update(id: string, input: TUpdate): Promise<TSelect>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<TSelect | undefined>;
  list(): Promise<TSelect[]>;
}
