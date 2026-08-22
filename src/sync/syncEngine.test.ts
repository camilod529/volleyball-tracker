import { createTeamRepository } from "@/src/repositories/teamRepository";
import { createTestDb } from "@/src/repositories/testDb";
import type { AppDatabase } from "@/src/repositories/types";

import { applyRemoteChanges, collectLocalChanges } from "./syncEngine";

describe("collectLocalChanges", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("returns every row when since is null (first sync)", async () => {
    const teamRepository = createTeamRepository(db);
    await teamRepository.create({ name: "Team A" });
    await teamRepository.create({ name: "Team B" });

    const changes = await collectLocalChanges(db, null);
    expect(changes.teams).toHaveLength(2);
    expect(changes.players).toHaveLength(0);
  });

  it("only returns rows updated after the given watermark", async () => {
    const teamRepository = createTeamRepository(db);
    const team = await teamRepository.create({ name: "Team A" });

    // A watermark set to this team's own updatedAt (or later) should exclude it.
    const changes = await collectLocalChanges(db, team.updatedAt);
    expect(changes.teams).toHaveLength(0);
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
