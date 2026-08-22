/**
 * Client-side twin of server/src/sync/sync.merge.ts — same decision, kept as
 * an independent implementation per docs/SYNC_PROTOCOL.md (no shared import
 * between the two projects). Pure and DB-free so it's unit-testable.
 */
export function shouldWriteIncomingRow(
  incomingUpdatedAt: string,
  existingUpdatedAt: string | undefined
): boolean {
  if (existingUpdatedAt === undefined) return true;
  return incomingUpdatedAt > existingUpdatedAt;
}
