import { and, asc, eq } from "drizzle-orm";

import { actionEvents, sets } from "../db/schema";
import type { ActionType } from "../domain/outcomes";
import { recomputeSetScore } from "../domain/scoring";
import type { AppDatabase } from "./types";

export interface EventEditChanges {
  playerId?: string | null;
  actionType?: ActionType;
  outcomeCode?: string;
}

export interface RecalculationService {
  editEvent(eventId: string, changes: EventEditChanges): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}

/**
 * Edits/deletes to any event but the most recent one require re-walking the
 * rest of the set: `sequence_in_set`, `point_impact`, and the score
 * snapshots on every surviving event after the change point can all shift.
 * `recalculateSet` re-runs domain/scoring's recomputeSetScore over the
 * full (non-deleted) event list for a set and writes back whatever
 * changed, then syncs the set's denormalized score to the new final tally.
 */
export function createRecalculationService(db: AppDatabase): RecalculationService {
  async function recalculateSet(setId: string) {
    const events = await db
      .select()
      .from(actionEvents)
      .where(and(eq(actionEvents.setId, setId), eq(actionEvents.isDeleted, false)))
      .orderBy(asc(actionEvents.sequenceInSet));

    const scored = recomputeSetScore(
      events.map((event) => ({
        actionType: event.actionType as ActionType,
        outcomeCode: event.outcomeCode,
      }))
    );

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const result = scored[i];
      const changed =
        event.sequenceInSet !== result.sequenceInSet ||
        event.pointImpact !== result.pointImpact ||
        event.ourScoreAfter !== result.ourScoreAfter ||
        event.opponentScoreAfter !== result.opponentScoreAfter;

      if (changed) {
        await db
          .update(actionEvents)
          .set({
            sequenceInSet: result.sequenceInSet,
            pointImpact: result.pointImpact,
            ourScoreAfter: result.ourScoreAfter,
            opponentScoreAfter: result.opponentScoreAfter,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(actionEvents.id, event.id));
      }
    }

    const final = scored[scored.length - 1];
    await db
      .update(sets)
      .set({
        ourScore: final?.ourScoreAfter ?? 0,
        opponentScore: final?.opponentScoreAfter ?? 0,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sets.id, setId));
  }

  return {
    async editEvent(eventId, changes) {
      const [event] = await db.select().from(actionEvents).where(eq(actionEvents.id, eventId)).limit(1);
      if (!event) return;

      await db
        .update(actionEvents)
        .set({ ...changes, updatedAt: new Date().toISOString() })
        .where(eq(actionEvents.id, eventId));

      await recalculateSet(event.setId);
    },

    async deleteEvent(eventId) {
      const [event] = await db.select().from(actionEvents).where(eq(actionEvents.id, eventId)).limit(1);
      if (!event) return;

      await db
        .update(actionEvents)
        .set({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(actionEvents.id, eventId));

      await recalculateSet(event.setId);
    },
  };
}
