/** Mirrors docs/SYNC_PROTOCOL.md — keep in sync with that doc and the client's copy of the same shapes. */

export interface SyncTeamRow {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface SyncPlayerRow {
  id: string;
  teamId: string;
  name: string;
  number: number | null;
  positions: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface SyncMatchRow {
  id: string;
  teamId: string;
  opponentName: string;
  matchDate: string;
  location: string | null;
  format: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface SyncSetRow {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  opponentScore: number;
  status: string;
  winner: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface SyncActionEventRow {
  id: string;
  matchId: string;
  setId: string;
  teamId: string;
  playerId: string | null;
  actionType: string;
  outcomeCode: string;
  pointImpact: string;
  rallyNumber: number;
  sequenceInSet: number;
  ourScoreAfter: number;
  opponentScoreAfter: number;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface SyncTablesPayload {
  teams: SyncTeamRow[];
  players: SyncPlayerRow[];
  matches: SyncMatchRow[];
  sets: SyncSetRow[];
  actionEvents: SyncActionEventRow[];
}

/** Parent-before-child, so sequential upserts never violate a foreign key. */
export const TABLE_ORDER = [
  'teams',
  'players',
  'matches',
  'sets',
  'actionEvents',
] as const;
