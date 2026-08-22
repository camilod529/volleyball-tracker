/**
 * One row per logged action, using stable machine-readable codes (not
 * localized display strings) so the file behaves the same regardless of
 * which language the app was set to when it was recorded — the point of
 * this export is to hand raw data to another tool or analyst, not to be
 * read as-is.
 */
export interface ActionEventCsvRow {
  matchId: string;
  matchDate: string;
  opponentName: string;
  setNumber: number;
  sequenceInSet: number;
  rallyNumber: number;
  occurredAt: string;
  playerNumber: number | null;
  playerName: string | null;
  actionType: string;
  outcomeCode: string;
  pointImpact: string;
  ourScoreAfter: number;
  opponentScoreAfter: number;
  notes: string | null;
}

const CSV_HEADERS = [
  "match_id",
  "match_date",
  "opponent_name",
  "set_number",
  "sequence_in_set",
  "rally_number",
  "occurred_at",
  "player_number",
  "player_name",
  "action_type",
  "outcome_code",
  "point_impact",
  "our_score_after",
  "opponent_score_after",
  "notes",
] as const;

/** RFC 4180: quote a field if it contains a comma, quote, or newline; double up any interior quotes. */
function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCell(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  return escapeCsvField(String(value));
}

function rowToCells(row: ActionEventCsvRow): string[] {
  return [
    row.matchId,
    row.matchDate,
    row.opponentName,
    row.setNumber,
    row.sequenceInSet,
    row.rallyNumber,
    row.occurredAt,
    row.playerNumber,
    row.playerName,
    row.actionType,
    row.outcomeCode,
    row.pointImpact,
    row.ourScoreAfter,
    row.opponentScoreAfter,
    row.notes,
  ].map(toCell);
}

/** RFC 4180 CSV text (CRLF line endings, trailing CRLF on the last row) for a list of action events. */
export function buildActionEventsCsv(rows: readonly ActionEventCsvRow[]): string {
  const lines = [CSV_HEADERS.join(","), ...rows.map((row) => rowToCells(row).join(","))];
  return lines.join("\r\n") + "\r\n";
}
