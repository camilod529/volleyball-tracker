import type { ActionType, PointImpact } from "./outcomes";

/**
 * Minimal shape these functions need — a DB `ActionEvent` row satisfies this
 * structurally, but keeping it separate lets the aggregations be unit
 * tested against plain fixtures instead of a database.
 */
export interface StatsEvent {
  playerId: string | null;
  setId: string;
  sequenceInSet: number;
  rallyNumber: number;
  actionType: ActionType;
  outcomeCode: string;
  pointImpact: PointImpact;
}

/**
 * Converts a raw DB action_events row (or anything with the same shape) into
 * a StatsEvent, narrowing the loosely-typed `actionType`/`pointImpact`
 * text columns to their known literal unions.
 */
export function toStatsEvent(row: {
  playerId: string | null;
  setId: string;
  sequenceInSet: number;
  rallyNumber: number;
  actionType: string;
  outcomeCode: string;
  pointImpact: string;
}): StatsEvent {
  return {
    playerId: row.playerId,
    setId: row.setId,
    sequenceInSet: row.sequenceInSet,
    rallyNumber: row.rallyNumber,
    actionType: row.actionType as ActionType,
    outcomeCode: row.outcomeCode,
    pointImpact: row.pointImpact as PointImpact,
  };
}

const ERROR_PREFIX = "error";

function isError(outcomeCode: string): boolean {
  return outcomeCode === "error" || outcomeCode.startsWith(ERROR_PREFIX);
}

export interface ServeStats {
  attempts: number;
  aces: number;
  errors: number;
  acePct: number;
  /** (aces - errors) / attempts */
  rating: number;
}

export function computeServeStats(events: readonly StatsEvent[]): ServeStats {
  const serves = events.filter((e) => e.actionType === "serve");
  const attempts = serves.length;
  const aces = serves.filter((e) => e.outcomeCode === "ace").length;
  const errors = serves.filter((e) => isError(e.outcomeCode)).length;
  return {
    attempts,
    aces,
    errors,
    acePct: attempts ? aces / attempts : 0,
    rating: attempts ? (aces - errors) / attempts : 0,
  };
}

export interface ServeReceiveStats {
  attempts: number;
  perfect: number;
  good: number;
  poor: number;
  overpass: number;
  errors: number;
  /** Weighted average: perfect=3, good=2, poor/overpass=1, error=0. */
  passerRating: number;
}

const PASSER_WEIGHTS: Record<string, number> = {
  perfect: 3,
  good: 2,
  poor: 1,
  overpass: 1,
  error: 0,
};

export function computeServeReceiveStats(events: readonly StatsEvent[]): ServeReceiveStats {
  const receives = events.filter((e) => e.actionType === "serve_receive");
  const attempts = receives.length;
  const countOf = (code: string) => receives.filter((e) => e.outcomeCode === code).length;
  const weightedSum = receives.reduce((sum, e) => sum + (PASSER_WEIGHTS[e.outcomeCode] ?? 0), 0);

  return {
    attempts,
    perfect: countOf("perfect"),
    good: countOf("good"),
    poor: countOf("poor"),
    overpass: countOf("overpass"),
    errors: countOf("error"),
    passerRating: attempts ? weightedSum / attempts : 0,
  };
}

export interface AttackStats {
  attempts: number;
  kills: number;
  errors: number;
  /** (kills - errors) / attempts, the standard hitting-efficiency formula. */
  efficiency: number;
  killPct: number;
}

const ATTACK_ERROR_OUTCOMES = new Set(["blocked_stuffed", "error_net", "error_out"]);

export function computeAttackStats(events: readonly StatsEvent[]): AttackStats {
  const attacks = events.filter((e) => e.actionType === "attack");
  const attempts = attacks.length;
  const kills = attacks.filter((e) => e.outcomeCode === "kill").length;
  const errors = attacks.filter((e) => ATTACK_ERROR_OUTCOMES.has(e.outcomeCode)).length;
  return {
    attempts,
    kills,
    errors,
    efficiency: attempts ? (kills - errors) / attempts : 0,
    killPct: attempts ? kills / attempts : 0,
  };
}

export interface BlockStats {
  attempts: number;
  stuffs: number;
  touches: number;
  errors: number;
  blocksPerSet: number;
}

const BLOCK_ERROR_OUTCOMES = new Set(["error", "blocked_out"]);

export function computeBlockStats(events: readonly StatsEvent[], setsPlayed: number): BlockStats {
  const blocks = events.filter((e) => e.actionType === "block");
  const attempts = blocks.length;
  const stuffs = blocks.filter((e) => e.outcomeCode === "stuff").length;
  const touches = blocks.filter((e) => e.outcomeCode === "touch").length;
  const errors = blocks.filter((e) => BLOCK_ERROR_OUTCOMES.has(e.outcomeCode)).length;
  return {
    attempts,
    stuffs,
    touches,
    errors,
    blocksPerSet: setsPlayed ? stuffs / setsPlayed : 0,
  };
}

export interface DigStats {
  attempts: number;
  good: number;
  poor: number;
  errors: number;
  successRate: number;
}

export function computeDigStats(events: readonly StatsEvent[]): DigStats {
  const digs = events.filter((e) => e.actionType === "dig");
  const attempts = digs.length;
  const good = digs.filter((e) => e.outcomeCode === "good").length;
  const poor = digs.filter((e) => e.outcomeCode === "poor").length;
  const errors = digs.filter((e) => e.outcomeCode === "error").length;
  return {
    attempts,
    good,
    poor,
    errors,
    successRate: attempts ? (attempts - errors) / attempts : 0,
  };
}

export interface FreeballStats {
  attempts: number;
  good: number;
  poor: number;
  errors: number;
}

export function computeFreeballStats(events: readonly StatsEvent[]): FreeballStats {
  const freeballs = events.filter((e) => e.actionType === "freeball");
  return {
    attempts: freeballs.length,
    good: freeballs.filter((e) => e.outcomeCode === "good").length,
    poor: freeballs.filter((e) => e.outcomeCode === "poor").length,
    errors: freeballs.filter((e) => e.outcomeCode === "error").length,
  };
}

export interface SettingStats {
  attempts: number;
  good: number;
  poor: number;
  errors: number;
  assists: number;
}

/**
 * An assist is derived, never tapped: a `set` event immediately followed
 * (by sequence, within the same set + rally) by an `attack` event whose
 * outcome is `kill` credits the setter. Grouping by (setId, rallyNumber)
 * rather than rallyNumber alone avoids collisions, since rally numbers
 * reset within each set.
 */
export function computeAssistsByPlayer(events: readonly StatsEvent[]): Map<string, number> {
  const byRally = new Map<string, StatsEvent[]>();
  for (const event of events) {
    const key = `${event.setId}:${event.rallyNumber}`;
    const list = byRally.get(key);
    if (list) {
      list.push(event);
    } else {
      byRally.set(key, [event]);
    }
  }

  const assists = new Map<string, number>();
  for (const rallyEvents of byRally.values()) {
    const sorted = [...rallyEvents].sort((a, b) => a.sequenceInSet - b.sequenceInSet);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.actionType === "set" && current.playerId && next.actionType === "attack" && next.outcomeCode === "kill") {
        assists.set(current.playerId, (assists.get(current.playerId) ?? 0) + 1);
      }
    }
  }
  return assists;
}

export function computeSettingStats(events: readonly StatsEvent[], assists: number): SettingStats {
  const sets = events.filter((e) => e.actionType === "set");
  return {
    attempts: sets.length,
    good: sets.filter((e) => e.outcomeCode === "good").length,
    poor: sets.filter((e) => e.outcomeCode === "poor").length,
    errors: sets.filter((e) => e.outcomeCode === "error").length,
    assists,
  };
}

export interface PlayerStats {
  serve: ServeStats;
  serveReceive: ServeReceiveStats;
  attack: AttackStats;
  block: BlockStats;
  dig: DigStats;
  set: SettingStats;
  freeball: FreeballStats;
}

/**
 * All stats for one player from a pool of events. `allEvents` should be the
 * full event list for whatever scope is being reported on (a single match,
 * or a team's whole season) — assists need every player's `set`/`attack`
 * events to find the pairing, and "sets played" is inferred from the
 * distinct sets the player has any event in.
 */
export function computePlayerStats(allEvents: readonly StatsEvent[], playerId: string): PlayerStats {
  const playerEvents = allEvents.filter((e) => e.playerId === playerId);
  const setsPlayed = new Set(playerEvents.map((e) => e.setId)).size;
  const assists = computeAssistsByPlayer(allEvents).get(playerId) ?? 0;

  return {
    serve: computeServeStats(playerEvents),
    serveReceive: computeServeReceiveStats(playerEvents),
    attack: computeAttackStats(playerEvents),
    block: computeBlockStats(playerEvents, setsPlayed),
    dig: computeDigStats(playerEvents),
    set: computeSettingStats(playerEvents, assists),
    freeball: computeFreeballStats(playerEvents),
  };
}

export interface TeamScoringBreakdown {
  aces: number;
  kills: number;
  blocks: number;
  /** Manual +1 Us adjustments — in practice mostly opponent unforced errors, which have no event of their own since opponent actions aren't logged. */
  other: number;
  total: number;
}

export function computeHowWeScored(events: readonly StatsEvent[]): TeamScoringBreakdown {
  const ourPoints = events.filter((e) => e.pointImpact === "our_point");
  return {
    aces: ourPoints.filter((e) => e.actionType === "serve").length,
    kills: ourPoints.filter((e) => e.actionType === "attack").length,
    blocks: ourPoints.filter((e) => e.actionType === "block").length,
    other: ourPoints.filter((e) => e.actionType === "team_point_adjustment").length,
    total: ourPoints.length,
  };
}

export interface TeamLossBreakdown {
  byAction: Partial<Record<ActionType, number>>;
  total: number;
}

export function computeHowWeLostPoints(events: readonly StatsEvent[]): TeamLossBreakdown {
  const opponentPoints = events.filter((e) => e.pointImpact === "opponent_point");
  const byAction: Partial<Record<ActionType, number>> = {};
  for (const event of opponentPoints) {
    byAction[event.actionType] = (byAction[event.actionType] ?? 0) + 1;
  }
  return { byAction, total: opponentPoints.length };
}
