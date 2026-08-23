import { and, asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { actionEvents, type ActionEvent, type NewActionEvent } from "../db/schema";
import { getPointImpact, type ActionType } from "../domain/outcomes";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type ActionEventCreateInput = Pick<
  NewActionEvent,
  "matchId" | "setId" | "teamId" | "playerId" | "rallyNumber" | "notes"
> & {
  actionType: ActionType;
  outcomeCode: string;
};
export type ActionEventUpdateInput = Partial<
  Pick<NewActionEvent, "playerId" | "notes"> & { actionType: ActionType; outcomeCode: string }
>;

export interface ActionEventRepository
  extends Repository<ActionEvent, ActionEventCreateInput, ActionEventUpdateInput> {
  /** Events for a set, in the order they occurred. */
  listBySet(setId: string): Promise<ActionEvent[]>;
  listByMatch(matchId: string): Promise<ActionEvent[]>;
}

/**
 * Appends a new action event to the end of its set. `point_impact`,
 * `sequence_in_set`, and the score snapshot are all derived here from the
 * taxonomy (src/domain/outcomes.ts) and the set's current running score —
 * callers never pass these in directly, which is what keeps the score
 * auto-derivation invariant from being violated at a call site.
 */
export function createActionEventRepository(db: AppDatabase): ActionEventRepository {
  const base = createBaseRepository<
    typeof actionEvents,
    ActionEvent,
    ActionEventCreateInput,
    ActionEventUpdateInput
  >(db, actionEvents);

  async function listBySet(setId: string) {
    return db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.setId, setId), eq(actionEvents.isDeleted, false)))
      .orderBy(asc(actionEvents.sequenceInSet));
  }

  return {
    ...base,
    listBySet,
    async listByMatch(matchId: string) {
      return db
        .select()
        .from(actionEvents)
        .where(and(eq(actionEvents.matchId, matchId), eq(actionEvents.isDeleted, false)))
        .orderBy(asc(actionEvents.sequenceInSet));
    },

    async create(input: ActionEventCreateInput) {
      const existing = await listBySet(input.setId);
      const previous = existing[existing.length - 1];
      const ourScoreSoFar = previous?.ourScoreAfter ?? 0;
      const opponentScoreSoFar = previous?.opponentScoreAfter ?? 0;

      const pointImpact = getPointImpact(input.actionType, input.outcomeCode);
      const ourScoreAfter = ourScoreSoFar + (pointImpact === "our_point" ? 1 : 0);
      const opponentScoreAfter = opponentScoreSoFar + (pointImpact === "opponent_point" ? 1 : 0);

      const now = new Date().toISOString();
      const [row] = await db
        .insert(actionEvents)
        .values({
          id: uuidv4(),
          ...input,
          pointImpact,
          sequenceInSet: existing.length + 1,
          ourScoreAfter,
          opponentScoreAfter,
          occurredAt: now,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending_sync",
        })
        .returning();
      return row;
    },
  };
}
