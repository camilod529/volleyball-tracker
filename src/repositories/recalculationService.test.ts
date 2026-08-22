import { createActionEventRepository } from "./actionEventRepository";
import { createMatchRepository } from "./matchRepository";
import { createPlayerRepository } from "./playerRepository";
import { createRecalculationService } from "./recalculationService";
import { createSetRepository } from "./setRepository";
import { createTeamRepository } from "./teamRepository";
import { createTestDb } from "./testDb";
import type { AppDatabase } from "./types";

describe("recalculationService", () => {
  let db: AppDatabase;

  async function setupMatchWithEvents() {
    const teamRepository = createTeamRepository(db);
    const playerRepository = createPlayerRepository(db);
    const matchRepository = createMatchRepository(db);
    const setRepository = createSetRepository(db);
    const actionEventRepository = createActionEventRepository(db);

    const team = await teamRepository.create({ name: "Team A" });
    const player = await playerRepository.create({
      teamId: team.id,
      name: "Camila",
      number: 7,
      positions: "outside_hitter",
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

    // Ace (our_point) -> Attack error (opponent_point) -> Kill (our_point)
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
    const third = await actionEventRepository.create({
      matchId: match.id,
      setId: set.id,
      teamId: team.id,
      playerId: player.id,
      actionType: "attack",
      outcomeCode: "kill",
      rallyNumber: 3,
      notes: null,
    });

    return { team, player, match, set, first, second, third, setRepository, actionEventRepository };
  }

  beforeEach(() => {
    db = createTestDb();
  });

  it("recomputes score snapshots for every event after a deleted middle event", async () => {
    const { second, third, setRepository, actionEventRepository } = await setupMatchWithEvents();
    // before: 1-0 (ace), 1-1 (error), 2-1 (kill)
    const recalculationService = createRecalculationService(db);

    await recalculationService.deleteEvent(second.id);

    const thirdAfter = await actionEventRepository.getById(third.id);
    // with the middle (opponent-scoring) event gone: 1-0 (ace), 2-0 (kill)
    expect(thirdAfter).toMatchObject({
      sequenceInSet: 2,
      pointImpact: "our_point",
      ourScoreAfter: 2,
      opponentScoreAfter: 0,
    });

    const set = await setRepository.getById((await actionEventRepository.getById(third.id))!.setId);
    expect(set).toMatchObject({ ourScore: 2, opponentScore: 0 });
  });

  it("recomputes downstream events when an earlier event's outcome is edited", async () => {
    const { first, third, actionEventRepository } = await setupMatchWithEvents();
    const recalculationService = createRecalculationService(db);

    // Change the ace into a serve error: now opponent scores the first point instead.
    await recalculationService.editEvent(first.id, { actionType: "serve", outcomeCode: "error_out" });

    const firstAfter = await actionEventRepository.getById(first.id);
    expect(firstAfter).toMatchObject({ pointImpact: "opponent_point", ourScoreAfter: 0, opponentScoreAfter: 1 });

    const thirdAfter = await actionEventRepository.getById(third.id);
    // sequence unchanged (still 3 events), but scores shift: 0-1 (error), 0-2 (error), 1-2 (kill)
    expect(thirdAfter).toMatchObject({ sequenceInSet: 3, ourScoreAfter: 1, opponentScoreAfter: 2 });
  });

  it("excludes a deleted event from listBySet after recalculation", async () => {
    const { second, actionEventRepository } = await setupMatchWithEvents();
    const recalculationService = createRecalculationService(db);

    await recalculationService.deleteEvent(second.id);

    const remaining = await actionEventRepository.listBySet(second.setId);
    expect(remaining.map((e) => e.id)).not.toContain(second.id);
    expect(remaining).toHaveLength(2);
    expect(remaining.map((e) => e.sequenceInSet)).toEqual([1, 2]);
  });

  it("is a no-op for an unknown event id", async () => {
    const recalculationService = createRecalculationService(db);
    await expect(recalculationService.deleteEvent("does-not-exist")).resolves.toBeUndefined();
  });
});
