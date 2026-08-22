import { db } from "../db/client";
import { createActionEventRepository } from "./actionEventRepository";
import { createMatchRepository } from "./matchRepository";
import { createPlayerRepository } from "./playerRepository";
import { createRecalculationService } from "./recalculationService";
import { createSetRepository } from "./setRepository";
import { createTeamRepository } from "./teamRepository";

export const teamRepository = createTeamRepository(db);
export const playerRepository = createPlayerRepository(db);
export const matchRepository = createMatchRepository(db);
export const setRepository = createSetRepository(db);
export const actionEventRepository = createActionEventRepository(db);
export const recalculationService = createRecalculationService(db);

export * from "./types";
export * from "./teamRepository";
export * from "./playerRepository";
export * from "./matchRepository";
export * from "./setRepository";
export * from "./actionEventRepository";
export * from "./recalculationService";
