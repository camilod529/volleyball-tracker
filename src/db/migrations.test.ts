import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

/**
 * Migration 0001 renames players.position -> players.positions and adds
 * sort_order. Camilo already has real teams/players/matches on his device
 * from testing, so this specifically checks the upgrade path preserves an
 * existing row's data — not just that a fresh DB ends up with the right
 * schema (which the repository tests already cover via createTestDb()).
 */
function runMigrationFile(db: Database.Database, filename: string) {
  const sql = fs.readFileSync(path.join(__dirname, "migrations", filename), "utf-8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed) db.exec(trimmed);
  }
}

describe("0001_add_player_positions_and_sort_order migration", () => {
  it("preserves an existing player's position value through the rename, and defaults sort_order to 0", () => {
    const db = new Database(":memory:");

    runMigrationFile(db, "0000_rapid_inhumans.sql");

    db.exec(`
      INSERT INTO teams (id, name, created_at, updated_at, is_deleted, sync_status)
      VALUES ('team-1', 'Team A', '2026-01-01', '2026-01-01', 0, 'local_only');
    `);
    db.exec(`
      INSERT INTO players (id, team_id, name, number, position, is_active, created_at, updated_at, is_deleted, sync_status)
      VALUES ('player-1', 'team-1', 'Camila', 7, 'setter', 1, '2026-01-01', '2026-01-01', 0, 'local_only');
    `);

    runMigrationFile(db, "0001_add_player_positions_and_sort_order.sql");

    const row = db.prepare("SELECT * FROM players WHERE id = 'player-1'").get() as Record<
      string,
      unknown
    >;

    expect(row.positions).toBe("setter");
    expect(row.position).toBeUndefined();
    expect(row.sort_order).toBe(0);
    // Everything else on the row is untouched by the migration.
    expect(row.name).toBe("Camila");
    expect(row.number).toBe(7);

    db.close();
  });
});
