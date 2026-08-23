import { and, eq, ne } from "drizzle-orm";
import type { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { actionEvents, matches, players, sets, teams } from "@/src/db/schema";
import type { AppDatabase } from "@/src/repositories/types";

import { shouldWriteIncomingRow } from "./syncMerge";

/** Parent-before-child, matching docs/SYNC_PROTOCOL.md and the server's TABLE_ORDER. */
const TABLE_ORDER = [
  "teams",
  "players",
  "matches",
  "sets",
  "actionEvents",
] as const;
type TableName = (typeof TABLE_ORDER)[number];

const TABLES = { teams, players, matches, sets, actionEvents } satisfies Record<
  TableName,
  SQLiteTable
>;

interface AnyRow {
  id: string;
  updatedAt: string;
  [key: string]: unknown;
}

type SyncTablesPayload = Record<TableName, AnyRow[]>;

// The 5 local tables are structurally different; this module operates on
// them generically via their shared id/updatedAt/syncStatus shape, same
// pattern as the server's SyncService.
type GenericSyncTable = SQLiteTable & {
  id: AnySQLiteColumn;
  updatedAt: AnySQLiteColumn;
  syncStatus: AnySQLiteColumn;
};

export class SyncHttpError extends Error {}

async function apiFetch<T>(
  apiBaseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new SyncHttpError(
      `Sync request failed (${response.status}): ${body}`,
    );
  }
  return response.json() as Promise<T>;
}

/**
 * Exported (not just used internally) so it's directly unit-testable against
 * the in-memory test DB — this is the part most likely to have a subtle bug
 * (wrong table, wrong column).
 *
 * Filters by syncStatus, not by comparing updatedAt against a watermark.
 * updatedAt is set from this device's own clock; a since-watermark comes
 * from the server's clock (see docs/SYNC_PROTOCOL.md). Comparing across
 * those two clock domains has the same failure mode the server's pull
 * filtering had (fixed via its own syncedAt column): if this device's clock
 * lags the server's, a newly-created row's updatedAt can already look
 * "older" than the stored watermark, so it'd be silently, permanently
 * skipped by every future push. syncStatus sidesteps that entirely — it's
 * set to "pending_sync" by every local write and only clears once that
 * exact write has actually been pushed (see runSync).
 */
export async function collectLocalChanges(db: AppDatabase): Promise<SyncTablesPayload> {
  const payload = {} as SyncTablesPayload;
  for (const tableName of TABLE_ORDER) {
    const table = TABLES[tableName] as unknown as GenericSyncTable;
    const rows = await db.select().from(table).where(ne(table.syncStatus, "synced"));
    payload[tableName] = rows as AnyRow[];
  }
  return payload;
}

/**
 * Marks exactly the rows just included in a successful push as synced —
 * guarded by updatedAt still matching what was pushed, so a row edited
 * again mid-sync (after being read for the payload but before this runs)
 * correctly stays pending_sync instead of being marked synced too early.
 */
export async function markRowsSynced(db: AppDatabase, payload: SyncTablesPayload) {
  for (const tableName of TABLE_ORDER) {
    const table = TABLES[tableName] as unknown as GenericSyncTable;
    for (const row of payload[tableName]) {
      await db
        .update(table)
        .set({ syncStatus: "synced" })
        .where(and(eq(table.id, row.id), eq(table.updatedAt, row.updatedAt)));
    }
  }
}

export async function applyRemoteChanges(
  db: AppDatabase,
  payload: Partial<SyncTablesPayload>,
) {
  for (const tableName of TABLE_ORDER) {
    const table = TABLES[tableName] as unknown as GenericSyncTable;
    for (const row of payload[tableName] ?? []) {
      const [existing] = await db
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
        continue;
      }

      if (existing) {
        await db
          .update(table)
          .set({ ...row, syncStatus: "synced" })
          .where(eq(table.id, row.id));
      } else {
        await db.insert(table).values({ ...row, syncStatus: "synced" });
      }
    }
  }
}

export interface SyncResult {
  serverTime: string;
}

/**
 * Manual "Sync Now" entry point — push first (every locally-changed row not
 * yet marked synced), then pull (remote changes since the last successful
 * pull's server-time watermark), per docs/SYNC_PROTOCOL.md. Never runs
 * automatically. `db` defaults to the real on-device database, imported
 * lazily so importing this module for tests never touches the native
 * expo-sqlite driver.
 */
export async function runSync(
  apiBaseUrl: string,
  apiKey: string,
  lastSyncedAt: string | null,
  db?: AppDatabase,
): Promise<SyncResult> {
  const resolvedDb = db ?? (await import("@/src/db/client")).db;
  const localChanges = await collectLocalChanges(resolvedDb);
  await apiFetch(apiBaseUrl, apiKey, "/sync/push", {
    method: "POST",
    body: JSON.stringify(localChanges),
  });
  await markRowsSynced(resolvedDb, localChanges);

  const query = lastSyncedAt
    ? `?since=${encodeURIComponent(lastSyncedAt)}`
    : "";
  const { serverTime, ...remoteChanges } = await apiFetch<
    SyncTablesPayload & { serverTime: string }
  >(apiBaseUrl, apiKey, `/sync/pull${query}`);
  await applyRemoteChanges(resolvedDb, remoteChanges);

  return { serverTime };
}
