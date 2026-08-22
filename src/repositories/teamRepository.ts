import { teams, type NewTeam, type Team } from "../db/schema";
import { createBaseRepository } from "./baseRepository";
import type { AppDatabase, Repository } from "./types";

export type TeamCreateInput = Pick<NewTeam, "name" | "color">;
export type TeamUpdateInput = Partial<TeamCreateInput>;

export function createTeamRepository(db: AppDatabase): Repository<Team, TeamCreateInput, TeamUpdateInput> {
  return createBaseRepository<typeof teams, Team, TeamCreateInput, TeamUpdateInput>(db, teams);
}
