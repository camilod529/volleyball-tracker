# Sync protocol

The contract between the Expo app (client) and the NestJS API (`server/`). Both sides implement this independently — there's no shared TS import between the two projects (different runtimes/bundlers), so this doc is the source of truth if they ever drift. Row field names below are camelCase JSON on the wire; each side maps that to its own DB column naming.

## Model

- **Two-way, manual sync.** Nothing syncs automatically or in the background — the user taps "Sync Now" in Settings. The app must be fully usable offline; sync is purely additive.
- **Conflict rule: last-write-wins by `updatedAt`.** Every row already carries `createdAt`/`updatedAt` (maintained by existing repository code on every write, no schema change needed for this). Whichever side has the newer `updatedAt` for a given row id wins; the older side's write is discarded for that row on that sync. This is a real, accepted limitation — true concurrent edits to the *same row* from two devices between syncs can lose data. Given the actual usage pattern (one coach logging per device session, occasional cross-device sync rather than simultaneous live editing of the same match), this is judged an acceptable tradeoff over building real CRDT-style merging.
- **Deletes are soft.** `isDeleted: true` is just a normal field update, so it's captured by the same `updatedAt` watermark mechanism as any other change — no special delete endpoint.
- **All local data syncs, unfiltered.** No per-team scoping — everyone with the shared API key sees and can write all synced data. This matches the "single shared key, two-way sync so multiple coaches can log the same team" requirement; per-team access control is a future refinement if ever needed.
- **The watermark is the server's clock, not the client's.** After a successful pull, the client stores the `serverTime` the response returned (not its own `Date.now()`) as the cutoff for the *next* pull's `?since=`. This avoids client/server clock skew compounding over repeated syncs. Push doesn't use a watermark at all — the client always pushes every row with `updatedAt` newer than its last successful sync in either direction.

## Auth

Every `/sync/*` request requires:

```
X-API-Key: <shared secret, matches the server's API_KEY env var>
```

Missing or wrong key → `401`. `GET /health` is unauthenticated (deploy/connectivity checks).

## Tables, in FK-safe order

Both push and pull always process tables in this order — parents before children — so inserting them in sequence never violates a foreign key:

1. `teams`
2. `players` (`teamId` → `teams.id`)
3. `matches` (`teamId` → `teams.id`)
4. `sets` (`matchId` → `matches.id`)
5. `actionEvents` (`matchId`, `setId`, `teamId`, `playerId` → their respective tables)

## Row shapes

Every row across every table carries: `id` (string, client-generated UUID), `createdAt`, `updatedAt` (ISO 8601 strings), `isDeleted` (boolean). `syncStatus` exists in the local schema but is not used by this protocol (kept for a possible future UI indicator) — don't rely on it server-side.

```ts
interface SyncTeamRow {
  id: string; name: string; color: string | null;
  createdAt: string; updatedAt: string; isDeleted: boolean;
}

interface SyncPlayerRow {
  id: string; teamId: string; name: string; number: number | null;
  positions: string; // comma-separated PlayerPosition codes
  sortOrder: number; isActive: boolean;
  createdAt: string; updatedAt: string; isDeleted: boolean;
}

interface SyncMatchRow {
  id: string; teamId: string; opponentName: string; matchDate: string;
  location: string | null; format: string; status: string; notes: string | null;
  createdAt: string; updatedAt: string; isDeleted: boolean;
}

interface SyncSetRow {
  id: string; matchId: string; setNumber: number;
  ourScore: number; opponentScore: number; status: string; winner: string | null;
  startedAt: string; endedAt: string | null;
  createdAt: string; updatedAt: string; isDeleted: boolean;
}

interface SyncActionEventRow {
  id: string; matchId: string; setId: string; teamId: string; playerId: string | null;
  actionType: string; outcomeCode: string; pointImpact: string;
  rallyNumber: number; sequenceInSet: number;
  ourScoreAfter: number; opponentScoreAfter: number;
  occurredAt: string; notes: string | null;
  createdAt: string; updatedAt: string; isDeleted: boolean; deletedAt: string | null;
}

interface SyncTablesPayload {
  teams: SyncTeamRow[];
  players: SyncPlayerRow[];
  matches: SyncMatchRow[];
  sets: SyncSetRow[];
  actionEvents: SyncActionEventRow[];
}
```

## Endpoints

### `GET /health`

No auth. `200 { "status": "ok", "time": "<ISO 8601>" }` — used for deploy platform health checks. The app itself doesn't call this; tapping "Sync Now" against a bad connection surfaces the failure directly.

### `POST /sync/push`

Body: `SyncTablesPayload` — every local row with `updatedAt` newer than the client's last successful sync, across all 5 tables.

Server behavior, per table in FK order, per row: if no row with that `id` exists, insert it. If one exists, upsert only if `incoming.updatedAt > stored.updatedAt`; otherwise leave the stored row untouched (it's newer or equal — the client will receive it back on its next pull).

Response: `200 { "ok": true, "serverTime": "<ISO 8601>" }`.

### `GET /sync/pull?since=<ISO 8601, omit for "everything">`

Server behavior: for each table in FK order, return every row where `updatedAt > since` (or all rows if `since` is omitted — first sync on a new device).

Response: `200 SyncTablesPayload & { "serverTime": "<ISO 8601>" }`. Client applies the same last-write-wins rule locally (skip a row if its local `updatedAt` is already newer than the incoming one — can happen if a local edit happened after the push but before the pull completed in the same sync run), upserts in the same FK-safe table order, then stores `serverTime` as the new watermark.
