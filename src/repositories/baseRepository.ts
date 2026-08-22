import { eq } from "drizzle-orm";
import { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

import type { AppDatabase, Repository } from "./types";

interface SoftDeletableTable extends SQLiteTable {
  id: SQLiteColumn;
  isDeleted: SQLiteColumn;
  updatedAt: SQLiteColumn;
}

/**
 * Shared create/update/softDelete/getById/list implementation for tables
 * that follow the standard UUID id + soft-delete + updatedAt shape. Entity
 * repositories wrap this and add any bespoke queries they need.
 *
 * Drizzle can't carry a generic table's full column typing through this
 * kind of reusable helper, so the insert/update payloads are widened to
 * `Record<string, unknown>` internally; the public methods stay fully typed
 * via the TSelect/TCreate/TUpdate generics callers actually see.
 */
export function createBaseRepository<TTable extends SoftDeletableTable, TSelect, TCreate, TUpdate>(
  db: AppDatabase,
  table: TTable
): Repository<TSelect, TCreate, TUpdate> {
  const dynamicTable = table as unknown as SQLiteTable;

  return {
    async create(input: TCreate) {
      const now = new Date().toISOString();
      const [row] = await db
        .insert(dynamicTable)
        .values({
          ...(input as Record<string, unknown>),
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row as TSelect;
    },

    async update(id: string, input: TUpdate) {
      const [row] = await db
        .update(dynamicTable)
        .set({ ...(input as Record<string, unknown>), updatedAt: new Date().toISOString() })
        .where(eq(table.id, id))
        .returning();
      return row as TSelect;
    },

    async softDelete(id: string) {
      await db
        .update(dynamicTable)
        .set({ isDeleted: true, updatedAt: new Date().toISOString() })
        .where(eq(table.id, id));
    },

    async getById(id: string) {
      const [row] = await db.select().from(dynamicTable).where(eq(table.id, id)).limit(1);
      return row as TSelect | undefined;
    },

    async list() {
      const rows = await db.select().from(dynamicTable).where(eq(table.isDeleted, false));
      return rows as TSelect[];
    },
  };
}
