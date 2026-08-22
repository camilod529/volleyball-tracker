import { and, eq } from "drizzle-orm";

import { players, type NewPlayer, type Player } from "../db/schema";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type PlayerCreateInput = Pick<NewPlayer, "teamId" | "name" | "number" | "position" | "isActive">;
export type PlayerUpdateInput = Partial<Omit<PlayerCreateInput, "teamId">>;

export interface PlayerRepository extends Repository<Player, PlayerCreateInput, PlayerUpdateInput> {
  listByTeam(teamId: string): Promise<Player[]>;
}

export function createPlayerRepository(db: AppDatabase): PlayerRepository {
  const base = createBaseRepository<typeof players, Player, PlayerCreateInput, PlayerUpdateInput>(
    db,
    players
  );

  return {
    ...base,
    async listByTeam(teamId: string) {
      return db
        .select()
        .from(players)
        .where(and(eq(players.teamId, teamId), eq(players.isDeleted, false)));
    },
  };
}
