import type { ActionEvent, Match, Player, Set as SetRow } from "@/src/db/schema";

import type { ActionEventCsvRow } from "./csvBuilder";

interface CsvMappingContext {
  matchesById: ReadonlyMap<string, Match>;
  setsById: ReadonlyMap<string, SetRow>;
  playersById: ReadonlyMap<string, Player>;
}

/** Joins the raw event log against matches/sets/players so the CSV is self-contained — no ids the recipient can't resolve. */
export function mapEventsToCsvRows(
  events: readonly ActionEvent[],
  { matchesById, setsById, playersById }: CsvMappingContext
): ActionEventCsvRow[] {
  return events.map((event) => {
    const match = matchesById.get(event.matchId);
    const set = setsById.get(event.setId);
    const player = event.playerId ? playersById.get(event.playerId) : undefined;

    return {
      matchId: event.matchId,
      matchDate: match?.matchDate ?? "",
      opponentName: match?.opponentName ?? "",
      setNumber: set?.setNumber ?? 0,
      sequenceInSet: event.sequenceInSet,
      rallyNumber: event.rallyNumber,
      occurredAt: event.occurredAt,
      playerNumber: player?.number ?? null,
      playerName: player?.name ?? null,
      actionType: event.actionType,
      outcomeCode: event.outcomeCode,
      pointImpact: event.pointImpact,
      ourScoreAfter: event.ourScoreAfter,
      opponentScoreAfter: event.opponentScoreAfter,
      notes: event.notes,
    };
  });
}
