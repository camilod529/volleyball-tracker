# The sync seam

The app is fully local today — everything lives in on-device SQLite, there is no
network layer, no auth, and no server. This doc is about the seam that was left
in place on purpose, so a future sync backend can be added without redesigning
the data model or rewriting the screens.

## What's already in place

**Repository pattern.** Every table has a repository (`src/repositories/*Repository.ts`)
implementing the shared `Repository<T>` interface (`src/repositories/types.ts`):

```ts
interface Repository<TSelect, TCreate, TUpdate> {
  create(input: TCreate): Promise<TSelect>;
  update(id: string, input: TUpdate): Promise<TSelect>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<TSelect | undefined>;
  list(): Promise<TSelect[]>;
}
```

Screens and the recalculation service call these interfaces, not the SQLite
driver directly. `src/repositories/index.ts` is the single place that
constructs the concrete (currently SQLite-backed) instances and exports them —
that's the seam. A sync-aware build would change what gets constructed there
without touching any call site.

**Schema readiness** (`src/db/schema.ts`), on every table:
- UUID primary keys (generated client-side), not autoincrement integers —
  no collision risk when two devices create rows independently.
- `created_at` / `updated_at` timestamps.
- `is_deleted` soft-delete instead of hard deletes, so a sync engine has
  something to diff against instead of silently losing rows a peer hasn't
  seen yet.
- `sync_status` column, currently always `'local_only'` and otherwise unused.
  It exists so a sync engine can move rows through `'pending_sync'` →
  `'synced'` without a migration that touches every table again.

**Reactive UI is decoupled from the repository layer.** Screens read live data
via Drizzle's `useLiveQuery(db.select()...)` directly against the local SQLite
`db` (see `src/db/client.ts`), not through the repositories. This matters for
sync: a future sync engine pulling remote changes into local SQLite would just
be another writer to the same tables — every screen already re-renders on any
write to a table it's watching, regardless of what wrote it.

## What a sync backend would still need to add

None of this exists yet; it's the actual work of a "v2":

- **A remote repository per entity** (e.g. `createRemoteActionEventRepository`)
  implementing the same `Repository<T>` interface against whatever backend is
  chosen (REST API, Supabase, Firebase, etc.) — swapped in at
  `src/repositories/index.ts`, or composed with the local one behind a single
  exported instance.
- **A sync engine/reconciler** that walks `sync_status`, pushes local changes,
  pulls remote changes into local SQLite, and decides conflict resolution
  (last-write-wins using `updated_at`? server-authoritative? field-level
  merge?) — not designed yet, and genuinely needs a decision once there's a
  real backend to reconcile against.
- **Auth/session management** — there is none today; every row is implicitly
  "owned" by whoever's device it's on.
- **Background sync scheduling / retry / offline queueing** for spotty
  courtside connectivity, which is the realistic environment this app runs in.

## Why this shape

The goal wasn't to half-build a sync system — it was to avoid the two
mistakes that make sync painful to retrofit later: integer primary keys that
collide across devices, and hard deletes that give a reconciler nothing to
work with. Everything else (the actual network code, conflict resolution,
auth) is deferred until there's a concrete backend to design against, since
guessing at that API now would likely just be wrong.
