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
// operates on all of them generically via their common id/updatedAt/syncedAt
// shape, so the exact column types are deliberately widened at this
// boundary (the public payload types in sync.types.ts stay precise).
type GenericSyncTable = MySqlTable & {
  id: AnyMySqlColumn;
  updatedAt: AnyMySqlColumn;
  syncedAt: AnyMySqlColumn;
};

@Injectable()
export class SyncService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async push(
    payload: Partial<SyncTablesPayload>,
  ): Promise<{ serverTime: string }> {
    // One shared value for every row this push writes — a client's own
    // updatedAt is never used for this, since it's this server's clock that
    // pull filtering has to stay consistent with. See schema.ts's syncedAt.
    const syncedAt = new Date().toISOString();
    for (const tableName of TABLE_ORDER) {
      const table = SYNC_TABLES[tableName] as unknown as GenericSyncTable;
      const rows = (payload[tableName] ?? []) as unknown as AnyRow[];
      for (const row of rows) {
        await this.upsertRow(table, row, syncedAt);
      }
    }
    return { serverTime: new Date().toISOString() };
  }

  async pull(
    since?: string,
  ): Promise<SyncTablesPayload & { serverTime: string }> {
    // Captured before querying, not after: if a concurrent push lands with
    // syncedAt between this value and when the SELECTs actually run, that
    // row is simply included again on the *next* pull (its syncedAt is
    // still > this serverTime) instead of ever being silently skipped.
    const serverTime = new Date().toISOString();
    const result: Record<string, unknown> = {};

    for (const tableName of TABLE_ORDER) {
      const table = SYNC_TABLES[tableName] as unknown as GenericSyncTable;
      const rows = since
        ? await this.db.select().from(table).where(gt(table.syncedAt, since))
        : await this.db.select().from(table);
      // syncedAt is server-internal bookkeeping — strip it before it goes
      // out over the wire, since the client schema has no such column.
      result[tableName] = rows.map((row: AnyRow) => {
        const rest = { ...row };
        delete rest.syncedAt;
        return rest;
      });
    }

    return {
      ...result,
      serverTime,
    } as SyncTablesPayload & {
      serverTime: string;
    };
  }

  private async upsertRow(
    table: GenericSyncTable,
    row: AnyRow,
    syncedAt: string,
  ) {
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
      await this.db
        .update(table)
        .set({ ...row, syncedAt })
        .where(eq(table.id, row.id));
    } else {
      await this.db.insert(table).values({ ...row, syncedAt });
    }
  }
}
