import { createTeamRepository } from "@/src/repositories/teamRepository";
import { createTestDb } from "@/src/repositories/testDb";
import type { AppDatabase } from "@/src/repositories/types";

import { applyRemoteChanges, collectLocalChanges, markRowsSynced } from "./syncEngine";

describe("collectLocalChanges", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns every row not yet synced", async () => {
    const teamRepository = createTeamRepository(db);
    await teamRepository.create({ name: "Team A" });
    await teamRepository.create({ name: "Team B" });

    const changes = await collectLocalChanges(db);
    expect(changes.teams).toHaveLength(2);
    expect(changes.players).toHaveLength(0);
  });

  it("excludes rows already marked synced, regardless of clock skew between device and server", async () => {
    const teamRepository = createTeamRepository(db);
    // A row whose updatedAt is far in the past relative to "now" (simulating
    // a device clock that lags the server) must still be included as long as
    // it hasn't actually been pushed yet — this is the bug this fix closes.
    await applyRemoteChanges(db, {
      teams: [
        {
          id: "already-synced-team",
          name: "Synced Team",
          color: null,
          createdAt: "2000-01-01T00:00:00.000Z",
          updatedAt: "2000-01-01T00:00:00.000Z",
          isDeleted: false,
        },
      ],
    });
    const localOnly = await teamRepository.create({ name: "Never Synced" });

    const changes = await collectLocalChanges(db);
    const names = changes.teams.map((t) => t.name);
    expect(names).toContain("Never Synced");
    expect(names).not.toContain("Synced Team");
    expect(localOnly.name).toBe("Never Synced");
  });
});

describe("markRowsSynced", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("marks a pushed row synced so it's excluded from the next collectLocalChanges", async () => {
    const teamRepository = createTeamRepository(db);
    const team = await teamRepository.create({ name: "Team A" });

    const pushed = await collectLocalChanges(db);
    await markRowsSynced(db, pushed);

    const changes = await collectLocalChanges(db);
    expect(changes.teams.map((t) => t.id)).not.toContain(team.id);
  });

  it("does not mark a row synced if it was edited again after being read for the push payload", async () => {
    const teamRepository = createTeamRepository(db);
    const team = await teamRepository.create({ name: "Team A" });

    const pushed = await collectLocalChanges(db);
    // Simulate an edit happening after the payload was read but before this
    // sync's push actually completes and marks rows synced.
    await teamRepository.update(team.id, { name: "Edited Mid-Sync" });
    await markRowsSynced(db, pushed);

    const changes = await collectLocalChanges(db);
    expect(changes.teams.map((t) => t.id)).toContain(team.id);
  });
});

describe("applyRemoteChanges", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("inserts a remote row that doesn't exist locally", async () => {
    await applyRemoteChanges(db, {
      teams: [
        {
          id: "remote-team-1",
          name: "Remote Team",
          color: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          isDeleted: false,
        },
      ],
    });

    const teamRepository = createTeamRepository(db);
    const team = await teamRepository.getById("remote-team-1");
    expect(team?.name).toBe("Remote Team");
  });

  it("overwrites a local row when the incoming row is newer", async () => {
    const teamRepository = createTeamRepository(db);
    const local = await teamRepository.create({ name: "Local Name" });

    await applyRemoteChanges(db, {
      teams: [
        {
          id: local.id,
          name: "Remote Rename",
          color: null,
          createdAt: local.createdAt,
          updatedAt: new Date(Date.parse(local.updatedAt) + 1000).toISOString(),
          isDeleted: false,
        },
      ],
    });

    const updated = await teamRepository.getById(local.id);
    expect(updated?.name).toBe("Remote Rename");
  });

  it("keeps the local row when the incoming row is older (last-write-wins)", async () => {
    const teamRepository = createTeamRepository(db);
    const local = await teamRepository.create({ name: "Local Name" });

    await applyRemoteChanges(db, {
      teams: [
        {
          id: local.id,
          name: "Stale Remote Name",
          color: null,
          createdAt: local.createdAt,
          updatedAt: new Date(Date.parse(local.updatedAt) - 1000).toISOString(),
          isDeleted: false,
        },
      ],
    });

    const stillLocal = await teamRepository.getById(local.id);
    expect(stillLocal?.name).toBe("Local Name");
  });
});
