import { Inject, Injectable } from '@nestjs/common';
import { eq, gt } from 'drizzle-orm';
import type { AnyMySqlColumn, MySqlTable } from 'drizzle-orm/mysql-core';

import { DB, type Db } from '../db/db.module';
import { SYNC_TABLES } from '../db/schema';
import { shouldWriteIncomingRow } from './sync.merge';
import { TABLE_ORDER, type SyncTablesPayload } from './sync.types';

interface AnyRow {
  id: string;
  updatedAt: string;
  [key: string]: unknown;
}

// SYNC_TABLES holds 5 structurally different Drizzle tables; this service
// operates on all of them generically via their common id/updatedAt shape,
// so the exact column types are deliberately widened at this boundary (the
// public payload types in sync.types.ts stay precise).
type GenericSyncTable = MySqlTable & {
  id: AnyMySqlColumn;
  updatedAt: AnyMySqlColumn;
};

@Injectable()
export class SyncService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async push(
    payload: Partial<SyncTablesPayload>,
  ): Promise<{ serverTime: string }> {
    for (const tableName of TABLE_ORDER) {
      const table = SYNC_TABLES[tableName] as unknown as GenericSyncTable;
      const rows = (payload[tableName] ?? []) as unknown as AnyRow[];
      for (const row of rows) {
        await this.upsertRow(table, row);
      }
    }
    return { serverTime: new Date().toISOString() };
  }

  async pull(
    since?: string,
  ): Promise<SyncTablesPayload & { serverTime: string }> {
    const result: Record<string, unknown> = {};

    for (const tableName of TABLE_ORDER) {
      const table = SYNC_TABLES[tableName] as unknown as GenericSyncTable;
      result[tableName] = since
        ? await this.db.select().from(table).where(gt(table.updatedAt, since))
        : await this.db.select().from(table);
    }

    return {
      ...result,
      serverTime: new Date().toISOString(),
    } as SyncTablesPayload & {
      serverTime: string;
    };
  }

  private async upsertRow(table: GenericSyncTable, row: AnyRow) {
    const [existing] = await this.db
      .select()
      .from(table)
      .where(eq(table.id, row.id))
      .limit(1);

    if (
      !shouldWriteIncomingRow(
        row.updatedAt,
        (existing as AnyRow | undefined)?.updatedAt,
      )
    ) {
      return;
    }

    if (existing) {
      await this.db.update(table).set(row).where(eq(table.id, row.id));
    } else {
      await this.db.insert(table).values(row);
    }
  }
}
