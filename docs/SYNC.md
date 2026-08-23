# Sync

The app is offline-first: every screen reads and writes local SQLite only, and
that never changes based on whether a cloud connection exists. Cloud sync is a
separate, manual, two-way operation the user triggers from **Settings > Cloud
Sync** — never automatic or backgrounded — because courtside connectivity is
unreliable. For the exact wire contract (row shapes, endpoints, conflict
rule), see [`SYNC_PROTOCOL.md`](./SYNC_PROTOCOL.md); this doc covers how the
pieces fit together.

## Architecture

```
┌─────────────────────┐        HTTPS + X-API-Key        ┌──────────────────────┐        ┌──────────────┐
│  Expo app (client)  │ ───────────────────────────────▶ │  NestJS API (server/)│ ─────▶ │ MySQL         │
│  local SQLite (all  │ ◀─────────────────────────────── │  hosted on Railway    │        │ hosted on     │
│  screens read here) │        POST /sync/push            │                       │        │ Hostinger     │
│                      │        GET  /sync/pull            │                       │        │               │
└─────────────────────┘                                   └──────────────────────┘        └──────────────┘
```

- **Client** (`src/`): fully local app + the sync client under `src/sync/`.
- **Server** (`server/`): standalone NestJS project (own `package.json`,
  excluded from the root Expo project's tsc/eslint/Metro/Jest — see its
  README) exposing `/sync/push`, `/sync/pull`, `/health`.
- **Databases**: MySQL on Hostinger is the durable store; local Docker MySQL
  (`server/docker-compose.yml`) is for development only and is never pointed
  at production data.

## Client-side pieces (`src/sync/`)

- **`connectionStore.ts`** — the API base URL + key, stored in
  `expo-secure-store` (Keychain/Keystore), not AsyncStorage, since they're
  credentials. Supports "one as a default, but possible to have none":
  - A default connection can be compiled into the build via
    `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_API_KEY` (see `.env.example`).
  - `load()` uses that default only if the user has never explicitly saved or
    cleared a connection.
  - `clearConnection()` writes an explicit tombstone (`sync_explicitly_cleared`)
    so a cleared connection stays cleared across restarts instead of falling
    back to the compiled-in default again.
  - `setConnection()` (Settings > Cloud Sync) overrides the default and
    clears that tombstone.
- **`syncStatusStore.ts`** — `lastSyncedAt` watermark (persisted via
  AsyncStorage — not sensitive, unlike the credentials above) plus in-memory
  `phase`/`lastError` for the Settings UI. `lastSyncedAt` is always the
  *server's* clock (`serverTime` from the last successful sync response), not
  the device's, to avoid clock-skew compounding across syncs.
- **`syncMerge.ts`** — the pure last-write-wins decision function. Kept as an
  independent implementation from the server's copy (`server/src/sync/sync.merge.ts`)
  per `SYNC_PROTOCOL.md` — the two projects don't share code.
- **`syncEngine.ts`** — `collectLocalChanges`, `markRowsSynced`,
  `applyRemoteChanges` (each independently unit-tested against
  `createTestDb()`) and `runSync`, the single entry point Settings calls.
  Push includes every row with `syncStatus != 'synced'` — **not** rows with
  `updatedAt` newer than the pull watermark. Every local write
  (`baseRepository.ts`'s create/update/softDelete) sets `syncStatus` to
  `pending_sync`; after a successful push, `markRowsSynced` clears it back to
  `synced` for exactly the rows just pushed (guarded by `updatedAt` still
  matching what was sent, so a row edited again mid-sync stays pending).
  `applyRemoteChanges` also marks whatever it just pulled in as `synced`.
  This exists because comparing `updatedAt` (this device's clock) against the
  pull watermark (the server's clock, see below) has the same failure mode
  the server's own pull filtering had before its `syncedAt` fix: a lagging
  device clock could make a brand-new row look "older" than the watermark
  and get silently, permanently skipped by every future push. `syncStatus`
  sidesteps clock comparison for this entirely. All 5 tables are still
  processed in the FK-safe order (`teams` → `players` → `matches` → `sets` →
  `actionEvents`) both ways.

## UI

`src/components/settings/CloudSyncSection.tsx`, rendered in
`app/(tabs)/settings.tsx`. Shows the current connection (or an editable
URL/key form if none is set), a **Sync Now** button that's disabled mid-sync,
last-synced time, and a plain-language reminder that sync is manual and the
app works fully offline. "Disconnect" clears the connection back to
local-only.

## Testing

- **Pure logic** (`syncMerge.ts` both sides): plain Jest unit tests.
- **Client DB-touching logic** (`collectLocalChanges`/`applyRemoteChanges`):
  Jest against the in-memory `createTestDb()`, same pattern as the
  repository tests — no mocks. `runSync`'s production `db` is a lazy dynamic
  import specifically so importing `syncEngine.ts` in a test file never
  touches the native `expo-sqlite` driver.
- **Server DB-touching logic**: Jest unit tests plus manual `curl` runs
  against a real local Docker MySQL instance (auth rejection, full
  push/pull round-trip, last-write-wins in both directions, `?since=`
  filtering) — see `server/README.md`.
- Screens (Settings UI, actually tapping Sync Now against a deployed API)
  are manual-verification lane, same as the rest of the app's UI.

## Known, accepted limitation

Last-write-wins by `updatedAt` means a true concurrent edit to the *same row*
from two devices between syncs can lose one side's change — there's no
field-level merge or CRDT behavior. Given the actual usage pattern (one coach
per device session, occasional cross-device sync rather than two people
editing the same match live), this was judged an acceptable tradeoff. See
`SYNC_PROTOCOL.md` for the full reasoning.
