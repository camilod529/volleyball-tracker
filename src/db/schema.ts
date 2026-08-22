import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  // Reserved for a future sync backend: rows stay 'local_only' until a
  // sync engine exists to move them through 'pending_sync' / 'synced'.
  syncStatus: text("sync_status").notNull().default("local_only"),
};

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  ...timestamps,
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  opponentName: text("opponent_name").notNull(),
  matchDate: text("match_date").notNull(),
  location: text("location"),
  format: text("format").notNull(), // 'best_of_3' | 'best_of_5'
  status: text("status").notNull().default("setup"), // 'setup' | 'in_progress' | 'completed'
  notes: text("notes"),
  ...timestamps,
});

export const sets = sqliteTable("sets", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id),
  setNumber: integer("set_number").notNull(),
  ourScore: integer("our_score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  status: text("status").notNull().default("in_progress"), // 'in_progress' | 'completed'
  winner: text("winner"), // 'us' | 'opponent' | null
  startedAt: text("started_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  endedAt: text("ended_at"),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
  isDeleted: timestamps.isDeleted,
  syncStatus: timestamps.syncStatus,
});

export const actionEvents = sqliteTable("action_events", {
  id: text("id").primaryKey(),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.id),
  setId: text("set_id")
    .notNull()
    .references(() => sets.id),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id),
  playerId: text("player_id").references(() => players.id),
  actionType: text("action_type").notNull(),
  outcomeCode: text("outcome_code").notNull(),
  pointImpact: text("point_impact").notNull(), // 'our_point' | 'opponent_point' | 'neutral'
  rallyNumber: integer("rally_number").notNull(),
  sequenceInSet: integer("sequence_in_set").notNull(),
  ourScoreAfter: integer("our_score_after").notNull(),
  opponentScoreAfter: integer("opponent_score_after").notNull(),
  occurredAt: text("occurred_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  notes: text("notes"),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
  isDeleted: timestamps.isDeleted,
  deletedAt: text("deleted_at"),
  syncStatus: timestamps.syncStatus,
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
export type ActionEvent = typeof actionEvents.$inferSelect;
export type NewActionEvent = typeof actionEvents.$inferInsert;
