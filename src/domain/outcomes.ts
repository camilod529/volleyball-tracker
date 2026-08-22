export const ACTION_TYPES = [
  "serve",
  "serve_receive",
  "attack",
  "block",
  "dig",
  "set",
  "freeball",
  "team_point_adjustment",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export type PointImpact = "our_point" | "opponent_point" | "neutral";

export const PLAYER_POSITIONS = [
  "setter",
  "outside_hitter",
  "opposite",
  "middle_blocker",
  "libero",
  "defensive_specialist",
  "serve_specialist",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

interface OutcomeDefinition {
  code: string;
  pointImpact: PointImpact;
  /** react-i18next key under `outcomes.<actionType>.<code>` */
  labelKey: string;
}

/**
 * Single source of truth for the action/outcome taxonomy and its point-impact
 * classification. Score auto-derivation (src/domain/scoring.ts) reads only
 * from this table, so a taxonomy change can never silently desync from the
 * scoreboard logic.
 */
export const ACTION_OUTCOMES: Record<ActionType, readonly OutcomeDefinition[]> = {
  serve: [
    { code: "ace", pointImpact: "our_point", labelKey: "outcomes.serve.ace" },
    { code: "in_play", pointImpact: "neutral", labelKey: "outcomes.serve.in_play" },
    { code: "error_net", pointImpact: "opponent_point", labelKey: "outcomes.serve.error_net" },
    { code: "error_out", pointImpact: "opponent_point", labelKey: "outcomes.serve.error_out" },
    {
      code: "error_foot_fault",
      pointImpact: "opponent_point",
      labelKey: "outcomes.serve.error_foot_fault",
    },
  ],
  serve_receive: [
    { code: "perfect", pointImpact: "neutral", labelKey: "outcomes.serve_receive.perfect" },
    { code: "good", pointImpact: "neutral", labelKey: "outcomes.serve_receive.good" },
    { code: "poor", pointImpact: "neutral", labelKey: "outcomes.serve_receive.poor" },
    { code: "overpass", pointImpact: "neutral", labelKey: "outcomes.serve_receive.overpass" },
    { code: "error", pointImpact: "opponent_point", labelKey: "outcomes.serve_receive.error" },
  ],
  attack: [
    { code: "kill", pointImpact: "our_point", labelKey: "outcomes.attack.kill" },
    { code: "in_play", pointImpact: "neutral", labelKey: "outcomes.attack.in_play" },
    {
      code: "blocked_stuffed",
      pointImpact: "opponent_point",
      labelKey: "outcomes.attack.blocked_stuffed",
    },
    {
      code: "blocked_touched",
      pointImpact: "neutral",
      labelKey: "outcomes.attack.blocked_touched",
    },
    { code: "error_net", pointImpact: "opponent_point", labelKey: "outcomes.attack.error_net" },
    { code: "error_out", pointImpact: "opponent_point", labelKey: "outcomes.attack.error_out" },
  ],
  block: [
    { code: "stuff", pointImpact: "our_point", labelKey: "outcomes.block.stuff" },
    { code: "touch", pointImpact: "neutral", labelKey: "outcomes.block.touch" },
    { code: "error", pointImpact: "opponent_point", labelKey: "outcomes.block.error" },
    { code: "blocked_out", pointImpact: "opponent_point", labelKey: "outcomes.block.blocked_out" },
  ],
  dig: [
    { code: "good", pointImpact: "neutral", labelKey: "outcomes.dig.good" },
    { code: "poor", pointImpact: "neutral", labelKey: "outcomes.dig.poor" },
    { code: "error", pointImpact: "opponent_point", labelKey: "outcomes.dig.error" },
  ],
  set: [
    { code: "good", pointImpact: "neutral", labelKey: "outcomes.set.good" },
    { code: "poor", pointImpact: "neutral", labelKey: "outcomes.set.poor" },
    { code: "error", pointImpact: "opponent_point", labelKey: "outcomes.set.error" },
  ],
  freeball: [
    { code: "good", pointImpact: "neutral", labelKey: "outcomes.freeball.good" },
    { code: "poor", pointImpact: "neutral", labelKey: "outcomes.freeball.poor" },
    { code: "error", pointImpact: "opponent_point", labelKey: "outcomes.freeball.error" },
  ],
  team_point_adjustment: [
    {
      code: "manual_plus_us",
      pointImpact: "our_point",
      labelKey: "outcomes.team_point_adjustment.manual_plus_us",
    },
    {
      code: "manual_plus_opponent",
      pointImpact: "opponent_point",
      labelKey: "outcomes.team_point_adjustment.manual_plus_opponent",
    },
  ],
};

/**
 * The only place `point_impact` is derived from `(action_type, outcome_code)`.
 * Every score computation must go through this function rather than
 * re-deriving the classification inline.
 */
export function getPointImpact(actionType: ActionType, outcomeCode: string): PointImpact {
  const outcome = ACTION_OUTCOMES[actionType].find((o) => o.code === outcomeCode);
  if (!outcome) {
    throw new Error(`Unknown outcome "${outcomeCode}" for action type "${actionType}"`);
  }
  return outcome.pointImpact;
}

export function isValidOutcome(actionType: ActionType, outcomeCode: string): boolean {
  return ACTION_OUTCOMES[actionType].some((o) => o.code === outcomeCode);
}
