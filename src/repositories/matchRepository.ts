import { and, eq } from "drizzle-orm";

import { matches, type Match, type NewMatch } from "../db/schema";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type MatchCreateInput = Pick<
  NewMatch,
  "teamId" | "opponentName" | "matchDate" | "location" | "format" | "notes"
>;
export type MatchUpdateInput = Partial<Omit<MatchCreateInput, "teamId">> & {
  status?: NewMatch["status"];
};

export interface MatchRepository extends Repository<Match, MatchCreateInput, MatchUpdateInput> {
  listByTeam(teamId: string): Promise<Match[]>;
}

export function createMatchRepository(db: AppDatabase): MatchRepository {
  const base = createBaseRepository<typeof matches, Match, MatchCreateInput, MatchUpdateInput>(
    db,
    matches
  );

  return {
    ...base,
    async listByTeam(teamId: string) {
      return db
        .select()
        .from(matches)
        .where(and(eq(matches.teamId, teamId), eq(matches.isDeleted, false)));
    },
  };
}
