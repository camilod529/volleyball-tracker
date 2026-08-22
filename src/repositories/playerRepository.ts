import { and, eq, max } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { players, type NewPlayer, type Player } from "../db/schema";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type PlayerCreateInput = Pick<NewPlayer, "teamId" | "name" | "number" | "positions" | "isActive">;
export type PlayerUpdateInput = Partial<Omit<PlayerCreateInput, "teamId">> & {
  sortOrder?: number;
};

export interface PlayerRepository extends Repository<Player, PlayerCreateInput, PlayerUpdateInput> {
  listByTeam(teamId: string): Promise<Player[]>;
}

export function createPlayerRepository(db: AppDatabase): PlayerRepository {
  const base = createBaseRepository<typeof players, Player, PlayerCreateInput, PlayerUpdateInput>(
    db,
    players
  );

  async function listByTeam(teamId: string) {
    return db
      .select()
      .from(players)
      .where(and(eq(players.teamId, teamId), eq(players.isDeleted, false)))
      .orderBy(players.sortOrder);
  }

  return {
    ...base,
    listByTeam,

    async create(input: PlayerCreateInput) {
      const [row] = await db
        .select({ maxSortOrder: max(players.sortOrder) })
        .from(players)
        .where(eq(players.teamId, input.teamId));
      const nextSortOrder = (row?.maxSortOrder ?? -1) + 1;

      const [created] = await db
        .insert(players)
        .values({ id: uuidv4(), ...input, sortOrder: nextSortOrder })
        .returning();
      return created;
    },
  };
}
