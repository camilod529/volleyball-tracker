import { buildActionEventsCsv, type ActionEventCsvRow } from "./csvBuilder";

function row(overrides: Partial<ActionEventCsvRow> = {}): ActionEventCsvRow {
  return {
    matchId: "match-1",
    matchDate: "2026-08-22",
    opponentName: "Rivales FC",
    setNumber: 1,
    sequenceInSet: 1,
    rallyNumber: 1,
    occurredAt: "2026-08-22T20:00:00.000Z",
    playerNumber: 7,
    playerName: "Camila",
    actionType: "serve",
    outcomeCode: "ace",
    pointImpact: "our_point",
    ourScoreAfter: 1,
    opponentScoreAfter: 0,
    notes: null,
    ...overrides,
  };
}

describe("buildActionEventsCsv", () => {
  it("writes the header row followed by one row per event", () => {
    const csv = buildActionEventsCsv([row(), row({ sequenceInSet: 2 })]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toBe(
      "match_id,match_date,opponent_name,set_number,sequence_in_set,rally_number,occurred_at,player_number,player_name,action_type,outcome_code,point_impact,our_score_after,opponent_score_after,notes"
    );
  });

  it("uses CRLF line endings with a trailing CRLF, per RFC 4180", () => {
    const csv = buildActionEventsCsv([row()]);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(3); // header, row, trailing empty
  });

  it("renders null fields as empty cells", () => {
    const csv = buildActionEventsCsv([row({ playerNumber: null, playerName: null, notes: null })]);
    const dataLine = csv.split("\r\n")[1];
    expect(dataLine).toContain(",,serve,ace,");
  });

  it("quotes a field containing a comma", () => {
    const csv = buildActionEventsCsv([row({ opponentName: "Rivales, FC" })]);
    expect(csv).toContain('"Rivales, FC"');
  });

  it("quotes a field containing a double quote and doubles the interior quote", () => {
    const csv = buildActionEventsCsv([row({ notes: 'Called "let" serve' })]);
    expect(csv).toContain('"Called ""let"" serve"');
  });

  it("quotes a field containing a newline", () => {
    const csv = buildActionEventsCsv([row({ notes: "Line one\nLine two" })]);
    expect(csv).toContain('"Line one\nLine two"');
  });

  it("does not quote a plain field with no special characters", () => {
    const csv = buildActionEventsCsv([row({ playerName: "Camila" })]);
    const dataLine = csv.split("\r\n")[1];
    expect(dataLine).toContain(",Camila,");
    expect(dataLine).not.toContain('"Camila"');
  });

  it("preserves accented characters unescaped (no special handling needed for UTF-8 text)", () => {
    const csv = buildActionEventsCsv([row({ playerName: "María José Núñez" })]);
    expect(csv).toContain("María José Núñez");
  });

  it("produces just the header row for an empty input", () => {
    const csv = buildActionEventsCsv([]);
    expect(csv.trim().split("\r\n")).toHaveLength(1);
  });
});
