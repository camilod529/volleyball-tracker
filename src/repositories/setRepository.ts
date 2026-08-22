import { and, eq } from "drizzle-orm";

import { sets, type NewSet, type Set } from "../db/schema";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type SetCreateInput = Pick<NewSet, "matchId" | "setNumber">;
export type SetUpdateInput = Partial<
  Pick<NewSet, "ourScore" | "opponentScore" | "status" | "winner" | "endedAt">
>;

export interface SetRepository extends Repository<Set, SetCreateInput, SetUpdateInput> {
  listByMatch(matchId: string): Promise<Set[]>;
}

export function createSetRepository(db: AppDatabase): SetRepository {
  const base = createBaseRepository<typeof sets, Set, SetCreateInput, SetUpdateInput>(db, sets);

  return {
    ...base,
    async listByMatch(matchId: string) {
      return db
        .select()
        .from(sets)
        .where(and(eq(sets.matchId, matchId), eq(sets.isDeleted, false)));
    },
  };
}
