import {
  boolean,
  index,
  int,
  mysqlTable,
  text,
  varchar,
} from 'drizzle-orm/mysql-core';

/**
 * Mirrors the client's src/db/schema.ts (SQLite) field-for-field — see
 * docs/SYNC_PROTOCOL.md for the row shapes this needs to keep matching.
 *
 * Timestamps are stored as ISO 8601 strings (varchar), not native MySQL
 * DATETIME, so the sync merge logic (`incoming.updatedAt > stored.updatedAt`)
 * is a plain string comparison on both sides — ISO 8601 strings sort
 * correctly lexicographically, and this sidesteps DATETIME
 * timezone/precision differences between MySQL and SQLite entirely.
 */
const timestamps = {
  createdAt: varchar('created_at', { length: 32 }).notNull(),
  updatedAt: varchar('updated_at', { length: 32 }).notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  // Server-only — never sent to or trusted from a client. Stamped with this
  // server's own clock every time a row is written via /sync/push, and used
  // (instead of updatedAt) to filter /sync/pull's `since`. updatedAt is
  // client-clock-based, so two devices with skewed clocks could make a row
  // permanently miss the `updatedAt > since` filter on future pulls; syncedAt
  // is always compared against values from this same server clock, so that
  // can't happen. See docs/SYNC_PROTOCOL.md.
  syncedAt: varchar('synced_at', { length: 32 }).notNull(),
};

// UUIDs are always 36 characters.
const id = () => varchar('id', { length: 36 }).primaryKey();
const fk = (name: string) => varchar(name, { length: 36 }).notNull();

export const teams = mysqlTable(
  'teams',
  {
    id: id(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 32 }),
    ...timestamps,
  },
  (table) => [index('teams_synced_at_idx').on(table.syncedAt)],
);

export const players = mysqlTable(
  'players',
  {
    id: id(),
    teamId: fk('team_id'),
    name: varchar('name', { length: 255 }).notNull(),
    number: int('number'),
    // Comma-separated PlayerPosition codes (e.g. "setter,opposite").
    positions: varchar('positions', { length: 255 }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [index('players_synced_at_idx').on(table.syncedAt)],
);

export const matches = mysqlTable(
  'matches',
  {
    id: id(),
    teamId: fk('team_id'),
    opponentName: varchar('opponent_name', { length: 255 }).notNull(),
    matchDate: varchar('match_date', { length: 32 }).notNull(),
    location: varchar('location', { length: 255 }),
    format: varchar('format', { length: 32 }).notNull(), // 'best_of_3' | 'best_of_5'
    status: varchar('status', { length: 32 }).notNull().default('setup'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [index('matches_synced_at_idx').on(table.syncedAt)],
);

export const sets = mysqlTable(
  'sets',
  {
    id: id(),
    matchId: fk('match_id'),
    setNumber: int('set_number').notNull(),
    ourScore: int('our_score').notNull().default(0),
    opponentScore: int('opponent_score').notNull().default(0),
    status: varchar('status', { length: 32 }).notNull().default('in_progress'),
    winner: varchar('winner', { length: 16 }), // 'us' | 'opponent' | null
    startedAt: varchar('started_at', { length: 32 }).notNull(),
    endedAt: varchar('ended_at', { length: 32 }),
    ...timestamps,
  },
  (table) => [index('sets_synced_at_idx').on(table.syncedAt)],
);

export const actionEvents = mysqlTable(
  'action_events',
  {
    id: id(),
    matchId: fk('match_id'),
    setId: fk('set_id'),
    teamId: fk('team_id'),
    playerId: varchar('player_id', { length: 36 }),
    actionType: varchar('action_type', { length: 32 }).notNull(),
    outcomeCode: varchar('outcome_code', { length: 64 }).notNull(),
    pointImpact: varchar('point_impact', { length: 16 }).notNull(),
    rallyNumber: int('rally_number').notNull(),
    sequenceInSet: int('sequence_in_set').notNull(),
    ourScoreAfter: int('our_score_after').notNull(),
    opponentScoreAfter: int('opponent_score_after').notNull(),
    occurredAt: varchar('occurred_at', { length: 32 }).notNull(),
    notes: text('notes'),
    createdAt: varchar('created_at', { length: 32 }).notNull(),
    updatedAt: varchar('updated_at', { length: 32 }).notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: varchar('deleted_at', { length: 32 }),
    syncedAt: varchar('synced_at', { length: 32 }).notNull(),
  },
  (table) => [index('action_events_synced_at_idx').on(table.syncedAt)],
);

export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Set = typeof sets.$inferSelect;
export type ActionEvent = typeof actionEvents.$inferSelect;

export const SYNC_TABLES = {
  teams,
  players,
  matches,
  sets,
  actionEvents,
} as const;
