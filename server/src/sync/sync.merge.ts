/**
 * The one place the last-write-wins rule (docs/SYNC_PROTOCOL.md) is decided.
 * Pure and DB-free on purpose, so it's unit-testable without a real MySQL
 * connection — sync.service.ts is the thin DB-touching wrapper around this.
 */
export function shouldWriteIncomingRow(
  incomingUpdatedAt: string,
  existingUpdatedAt: string | undefined,
): boolean {
  if (existingUpdatedAt === undefined) return true;
  return incomingUpdatedAt > existingUpdatedAt;
}
