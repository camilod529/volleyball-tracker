import { ActionType, getPointImpact, PointImpact } from "./outcomes";

export interface ScorableEvent {
  actionType: ActionType;
  outcomeCode: string;
}

export interface ScoredEvent<T extends ScorableEvent = ScorableEvent> {
  event: T;
  sequenceInSet: number;
  pointImpact: PointImpact;
  ourScoreAfter: number;
  opponentScoreAfter: number;
}

/**
 * Walks a set's events in order and derives sequence numbers + running score
 * snapshots from each event's point impact. This is the one place score
 * reconstruction happens, so an edit/delete/insert anywhere in the sequence
 * is corrected by re-running this over the full (surviving) event list —
 * the "recalculation cascade" referenced in the plan.
 */
export function recomputeSetScore<T extends ScorableEvent>(
  events: readonly T[],
  startingScore: { our: number; opponent: number } = { our: 0, opponent: 0 }
): ScoredEvent<T>[] {
  let our = startingScore.our;
  let opponent = startingScore.opponent;

  return events.map((event, index) => {
    const pointImpact = getPointImpact(event.actionType, event.outcomeCode);
    if (pointImpact === "our_point") our += 1;
    if (pointImpact === "opponent_point") opponent += 1;

    return {
      event,
      sequenceInSet: index + 1,
      pointImpact,
      ourScoreAfter: our,
      opponentScoreAfter: opponent,
    };
  });
}

export interface SetWinCondition {
  /** Points needed to win, e.g. 25 for a normal set, 15 for a deciding set. */
  target: number;
  /** Minimum lead required to win, standard volleyball rule is 2. */
  winBy: number;
}

export const STANDARD_SET: SetWinCondition = { target: 25, winBy: 2 };
export const DECIDING_SET: SetWinCondition = { target: 15, winBy: 2 };

export type SetWinner = "us" | "opponent" | null;

/**
 * Returns the winner of a set given the current score, or null if the set
 * is still in progress. Used after every scored event to detect whether a
 * "Set Complete" prompt should fire.
 */
export function getSetWinner(
  ourScore: number,
  opponentScore: number,
  condition: SetWinCondition = STANDARD_SET
): SetWinner {
  const leader: SetWinner = ourScore > opponentScore ? "us" : opponentScore > ourScore ? "opponent" : null;
  if (!leader) return null;

  const leaderScore = Math.max(ourScore, opponentScore);
  const lead = Math.abs(ourScore - opponentScore);
  return leaderScore >= condition.target && lead >= condition.winBy ? leader : null;
}

export type MatchFormat = "best_of_3" | "best_of_5";

/** Number of sets required to win a match of the given format. */
export function setsToWinMatch(format: MatchFormat): number {
  return format === "best_of_3" ? 2 : 3;
}

/** True set index (1-based) is the deciding set for the given format. */
export function isDecidingSet(setNumber: number, format: MatchFormat): boolean {
  return setNumber === (format === "best_of_3" ? 3 : 5);
}

export function getMatchWinner(
  setWinsByTeam: { us: number; opponent: number },
  format: MatchFormat
): SetWinner {
  const needed = setsToWinMatch(format);
  if (setWinsByTeam.us >= needed) return "us";
  if (setWinsByTeam.opponent >= needed) return "opponent";
  return null;
}
