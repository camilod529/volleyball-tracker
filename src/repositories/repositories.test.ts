import { createActionEventRepository } from "./actionEventRepository";
import { createMatchRepository } from "./matchRepository";
import { createPlayerRepository } from "./playerRepository";
import { createSetRepository } from "./setRepository";
import { createTeamRepository } from "./teamRepository";
import { createTestDb } from "./testDb";
import type { AppDatabase } from "./types";

describe("teamRepository", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("creates, lists, updates, and soft-deletes a team", async () => {
    const teamRepository = createTeamRepository(db);

    const team = await teamRepository.create({ name: "Las Panteras", color: "#ff0000" });
    expect(team.id).toBeTruthy();
    expect(team.name).toBe("Las Panteras");

    expect(await teamRepository.list()).toHaveLength(1);

    const updated = await teamRepository.update(team.id, { name: "Las Panteras Negras" });
    expect(updated.name).toBe("Las Panteras Negras");

    await teamRepository.softDelete(team.id);
    expect(await teamRepository.list()).toHaveLength(0);
    expect(await teamRepository.getById(team.id)).toMatchObject({ isDeleted: true });
  });
});

describe("playerRepository", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("scopes players to their team and excludes soft-deleted players", async () => {
    const teamRepository = createTeamRepository(db);
    const playerRepository = createPlayerRepository(db);

    const teamA = await teamRepository.create({ name: "Team A" });
    const teamB = await teamRepository.create({ name: "Team B" });

    const player1 = await playerRepository.create({
      teamId: teamA.id,
      name: "Camila",
      number: 7,
      position: "setter",
      isActive: true,
    });
    await playerRepository.create({
      teamId: teamA.id,
      name: "Valentina",
      number: null,
      position: "libero",
      isActive: true,
    });
    await playerRepository.create({
      teamId: teamB.id,
      name: "Other Team Player",
      number: 4,
      position: "opposite",
      isActive: true,
    });

    expect(await playerRepository.listByTeam(teamA.id)).toHaveLength(2);
    expect(await playerRepository.listByTeam(teamB.id)).toHaveLength(1);

    await playerRepository.softDelete(player1.id);
    expect(await playerRepository.listByTeam(teamA.id)).toHaveLength(1);
  });
});

describe("actionEventRepository", () => {
  let db: AppDatabase;

  async function setupMatch() {
    const teamRepository = createTeamRepository(db);
    const playerRepository = createPlayerRepository(db);
    const matchRepository = createMatchRepository(db);
    const setRepository = createSetRepository(db);

    const team = await teamRepository.create({ name: "Team A" });
    const player = await playerRepository.create({
      teamId: team.id,
      name: "Camila",
      number: 7,
      position: "outside_hitter",
      isActive: true,
    });
    const match = await matchRepository.create({
      teamId: team.id,
      opponentName: "Rivales FC",
      matchDate: "2026-08-22",
      location: null,
      format: "best_of_3",
      notes: null,
    });
    const set = await setRepository.create({ matchId: match.id, setNumber: 1 });

    return { team, player, match, set };
  }

  beforeEach(() => {
    db = createTestDb();
  });

  it("derives point_impact, sequence_in_set, and running score on create", async () => {
    const { team, player, match, set } = await setupMatch();
    const actionEventRepository = createActionEventRepository(db);

    const first = await actionEventRepository.create({
      matchId: match.id,
      setId: set.id,
      teamId: team.id,
      playerId: player.id,
      actionType: "serve",
      outcomeCode: "ace",
      rallyNumber: 1,
      notes: null,
    });
    expect(first).toMatchObject({
      pointImpact: "our_point",
      sequenceInSet: 1,
      ourScoreAfter: 1,
      opponentScoreAfter: 0,
    });

    const second = await actionEventRepository.create({
      matchId: match.id,
      setId: set.id,
      teamId: team.id,
      playerId: player.id,
      actionType: "attack",
      outcomeCode: "error_net",
      rallyNumber: 2,
      notes: null,
    });
    expect(second).toMatchObject({
      pointImpact: "opponent_point",
      sequenceInSet: 2,
      ourScoreAfter: 1,
      opponentScoreAfter: 1,
    });

    const third = await actionEventRepository.create({
      matchId: match.id,
      setId: set.id,
      teamId: team.id,
      playerId: player.id,
      actionType: "dig",
      outcomeCode: "good",
      rallyNumber: 3,
      notes: null,
    });
    expect(third).toMatchObject({
      pointImpact: "neutral",
      sequenceInSet: 3,
      ourScoreAfter: 1,
      opponentScoreAfter: 1,
    });

    expect(await actionEventRepository.listBySet(set.id)).toHaveLength(3);
  });

  it("excludes soft-deleted events from listBySet (the Undo Last path)", async () => {
    const { team, player, match, set } = await setupMatch();
    const actionEventRepository = createActionEventRepository(db);

    const event = await actionEventRepository.create({
      matchId: match.id,
      setId: set.id,
      teamId: team.id,
      playerId: player.id,
      actionType: "serve",
      outcomeCode: "ace",
      rallyNumber: 1,
      notes: null,
    });

    await actionEventRepository.softDelete(event.id);
    expect(await actionEventRepository.listBySet(set.id)).toHaveLength(0);
  });
});
