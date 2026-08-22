# Contributing

Thanks for taking a look at Volleyball Tracker. This is a small, focused project, so the process is intentionally lightweight.

## Getting set up

Follow [README.md](./README.md) to get the app running locally before making changes.

## Before you start

- **Open an issue first for anything non-trivial.** For a bug fix or small tweak, a pull request on its own is fine. For a new feature or a change to the data model (anything in `src/db/schema.ts`), open an issue describing what you want to do and why before writing code — it's much cheaper to align on approach before the work than after.
- **Check `docs/SYNC.md`** before touching anything related to remote sync or a cloud backend — it explains what's deliberately unbuilt and why.

## Making changes

- Keep the localization complete. If you add or change a user-facing string, add it to **both** `locales/en.json` and `locales/es.json` in the same change — `src/i18n/glossary.test.ts` enforces this for the action/outcome/position taxonomy, but it's expected everywhere.
- If you touch `src/db/schema.ts`, you need a real migration, not a schema-only change:
  1. Run `npx drizzle-kit generate` and follow its prompts (it may ask to disambiguate a rename vs. drop+add — get this right, since an incorrect answer can destroy existing local data on a real device).
  2. If drizzle-kit's interactive prompt isn't usable in your environment, hand-write the migration SQL, and hand-update `src/db/migrations/meta/_journal.json` and `src/db/migrations/migrations.js` to match — see `0001_add_player_positions_and_sort_order.sql` for the pattern.
  3. Add a test that exercises the upgrade path itself (insert a row shaped like the *old* schema, run the new migration, assert the data survived) — see `src/db/migrations.test.ts`. A migration that only works against a fresh database isn't good enough; people will run it against real data.
- Don't use Tamagui's `theme="active"` for a persistent "this is selected" state (toggle chips, tabs, etc.) — it renders too dark on iOS. Use `src/components/shared/SelectableChip.tsx` instead.
- Match the existing repository pattern (`src/repositories/`) for any new data access — screens should read live data via `useLiveQuery` against `db` directly, but all writes should go through a repository, not raw Drizzle calls in a component.

## Testing your change

This project draws a hard line between what can be verified from a console and what needs a simulator/device:

- **Console-verifiable** (do this before opening a PR): `npm run typecheck`, `npm run lint`, `npm test`. Domain logic (`src/domain/`), repositories (`src/repositories/`), CSV export (`src/export/`), and i18n coverage all have Jest coverage running against an in-memory SQLite database — no simulator needed. Add tests here for any new pure logic or repository method.
- **Needs a real device or simulator**: anything about how a screen actually looks or behaves (layout, gestures, native modules like haptics/sharing/file-system). Note in your PR description what you tested manually and on what device/orientation, since this can't be automated away.

## Pull requests

- Keep PRs focused — one fix or feature per PR is easier to review than a bundle of unrelated changes.
- Describe *why* the change is needed, not just what it does — the diff already shows what changed.
- Make sure `npm run typecheck`, `npm run lint`, and `npm test` all pass before requesting review.
