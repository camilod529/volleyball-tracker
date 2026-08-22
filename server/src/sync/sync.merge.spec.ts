import { shouldWriteIncomingRow } from './sync.merge';

describe('shouldWriteIncomingRow', () => {
  it('writes when no existing row is present (insert case)', () => {
    expect(shouldWriteIncomingRow('2026-01-01T00:00:00.000Z', undefined)).toBe(
      true,
    );
  });

  it('writes when the incoming row is newer than the stored one', () => {
    expect(
      shouldWriteIncomingRow(
        '2026-01-02T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ),
    ).toBe(true);
  });

  it('does not write when the incoming row is older than the stored one', () => {
    expect(
      shouldWriteIncomingRow(
        '2026-01-01T00:00:00.000Z',
        '2026-01-02T00:00:00.000Z',
      ),
    ).toBe(false);
  });

  it('does not write when the timestamps are identical (nothing changed)', () => {
    expect(
      shouldWriteIncomingRow(
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ),
    ).toBe(false);
  });
});
