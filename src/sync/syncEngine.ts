import { eq, gt } from "drizzle-orm";
import type { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { actionEvents, matches, players, sets, teams } from "@/src/db/schema";
import type { AppDatabase } from "@/src/repositories/types";

import { shouldWriteIncomingRow } from "./syncMerge";

/** Parent-before-child, matching docs/SYNC_PROTOCOL.md and the server's TABLE_ORDER. */
const TABLE_ORDER = ["teams", "players", "matches", "sets", "actionEvents"] as const;
type TableName = (typeof TABLE_ORDER)[number];

const TABLES = { teams, players, matches, sets, actionEvents } satisfies Record<TableName, SQLiteTable>;

interface AnyRow {
  id: string;
  updatedAt: string;
  [key: string]: unknown;
}

type SyncTablesPayload = Record<TableName, AnyRow[]>;

// The 5 local tables are structurally different; this module operates on
// them generically via their shared id/updatedAt shape, same pattern as the
// server's SyncService.
type GenericSyncTable = SQLiteTable & { id: AnySQLiteColumn; updatedAt: AnySQLiteColumn };

export class SyncHttpError extends Error {}

async function apiFetch<T>(
  apiBaseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit
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
    throw new SyncHttpError(`Sync request failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

/** Exported (not just used internally) so it's directly unit-testable against the in-memory test DB — this is the part most likely to have a subtle bug (wrong table, wrong column). */
export async function collectLocalChanges(
  db: AppDatabase,
  since: string | null
): Promise<SyncTablesPayload> {
  const payload = {} as SyncTablesPayload;
  for (const tableName of TABLE_ORDER) {
    const table = TABLES[tableName] as unknown as GenericSyncTable;
    const rows = since
      ? await db.select().from(table).where(gt(table.updatedAt, since))
      : await db.select().from(table);
    payload[tableName] = rows as AnyRow[];
  }
  return payload;
}

export async function applyRemoteChanges(db: AppDatabase, payload: Partial<SyncTablesPayload>) {
  for (const tableName of TABLE_ORDER) {
    const table = TABLES[tableName] as unknown as GenericSyncTable;
    for (const row of payload[tableName] ?? []) {
      const [existing] = await db.select().from(table).where(eq(table.id, row.id)).limit(1);

      if (!shouldWriteIncomingRow(row.updatedAt, (existing as AnyRow | undefined)?.updatedAt)) {
        continue;
      }

      if (existing) {
        await db.update(table).set(row).where(eq(table.id, row.id));
      } else {
        await db.insert(table).values(row);
      }
    }
  }
}

export interface SyncResult {
  serverTime: string;
}

/**
 * Manual "Sync Now" entry point — push first (local changes since the last
 * successful sync), then pull (remote changes since the same watermark),
 * per docs/SYNC_PROTOCOL.md. Never runs automatically. `db` defaults to the
 * real on-device database, imported lazily so importing this module for
 * tests never touches the native expo-sqlite driver.
 */
export async function runSync(
  apiBaseUrl: string,
  apiKey: string,
  lastSyncedAt: string | null,
  db?: AppDatabase
): Promise<SyncResult> {
  const resolvedDb = db ?? (await import("@/src/db/client")).db;
  const localChanges = await collectLocalChanges(resolvedDb, lastSyncedAt);
  await apiFetch(apiBaseUrl, apiKey, "/sync/push", {
    method: "POST",
    body: JSON.stringify(localChanges),
  });

  const query = lastSyncedAt ? `?since=${encodeURIComponent(lastSyncedAt)}` : "";
  const { serverTime, ...remoteChanges } = await apiFetch<SyncTablesPayload & { serverTime: string }>(
    apiBaseUrl,
    apiKey,
    `/sync/pull${query}`
  );
  await applyRemoteChanges(resolvedDb, remoteChanges);

  return { serverTime };
}
