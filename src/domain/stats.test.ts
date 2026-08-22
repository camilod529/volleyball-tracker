import {
  computeAssistsByPlayer,
  computeAttackStats,
  computeBlockStats,
  computeDigStats,
  computeFreeballStats,
  computeHowWeLostPoints,
  computeHowWeScored,
  computePlayerStats,
  computeServeReceiveStats,
  computeServeStats,
  computeSettingStats,
  type StatsEvent,
} from "./stats";

function event(overrides: Partial<StatsEvent>): StatsEvent {
  return {
    playerId: "p1",
    setId: "s1",
    sequenceInSet: 1,
    rallyNumber: 1,
    actionType: "serve",
    outcomeCode: "ace",
    pointImpact: "our_point",
    ...overrides,
  };
}

describe("computeServeStats", () => {
  it("computes attempts, aces, errors, ace%, and rating", () => {
    const events = [
      event({ actionType: "serve", outcomeCode: "ace", pointImpact: "our_point" }),
      event({ actionType: "serve", outcomeCode: "in_play", pointImpact: "neutral" }),
      event({ actionType: "serve", outcomeCode: "error_net", pointImpact: "opponent_point" }),
      event({ actionType: "attack", outcomeCode: "kill", pointImpact: "our_point" }), // not a serve
    ];
    expect(computeServeStats(events)).toEqual({
      attempts: 3,
      aces: 1,
      errors: 1,
      acePct: 1 / 3,
      rating: 0,
    });
  });

  it("returns zeros with no attempts, never divides by zero", () => {
    expect(computeServeStats([])).toEqual({ attempts: 0, aces: 0, errors: 0, acePct: 0, rating: 0 });
  });
});

describe("computeServeReceiveStats", () => {
  it("computes the weighted passer rating", () => {
    const events = [
      event({ actionType: "serve_receive", outcomeCode: "perfect" }),
      event({ actionType: "serve_receive", outcomeCode: "good" }),
      event({ actionType: "serve_receive", outcomeCode: "poor" }),
      event({ actionType: "serve_receive", outcomeCode: "error" }),
    ];
    const stats = computeServeReceiveStats(events);
    expect(stats.attempts).toBe(4);
    expect(stats.passerRating).toBeCloseTo((3 + 2 + 1 + 0) / 4);
  });
});

describe("computeAttackStats", () => {
  it("counts blocked_stuffed and net/out errors as attack errors for efficiency", () => {
    const events = [
      event({ actionType: "attack", outcomeCode: "kill" }),
      event({ actionType: "attack", outcomeCode: "kill" }),
      event({ actionType: "attack", outcomeCode: "blocked_stuffed" }),
      event({ actionType: "attack", outcomeCode: "error_net" }),
      event({ actionType: "attack", outcomeCode: "in_play" }),
      event({ actionType: "attack", outcomeCode: "blocked_touched" }),
    ];
    const stats = computeAttackStats(events);
    expect(stats).toEqual({
      attempts: 6,
      kills: 2,
      errors: 2,
      efficiency: (2 - 2) / 6,
      killPct: 2 / 6,
    });
  });
});

describe("computeBlockStats", () => {
  it("normalizes stuff blocks per set played", () => {
    const events = [
      event({ actionType: "block", outcomeCode: "stuff", setId: "s1" }),
      event({ actionType: "block", outcomeCode: "stuff", setId: "s2" }),
      event({ actionType: "block", outcomeCode: "touch", setId: "s2" }),
      event({ actionType: "block", outcomeCode: "error", setId: "s2" }),
    ];
    const stats = computeBlockStats(events, 2);
    expect(stats).toEqual({ attempts: 4, stuffs: 2, touches: 1, errors: 1, blocksPerSet: 1 });
  });
});

describe("computeDigStats", () => {
  it("counts poor digs as successful (ball stayed in play)", () => {
    const events = [
      event({ actionType: "dig", outcomeCode: "good" }),
      event({ actionType: "dig", outcomeCode: "poor" }),
      event({ actionType: "dig", outcomeCode: "error" }),
    ];
    expect(computeDigStats(events)).toEqual({
      attempts: 3,
      good: 1,
      poor: 1,
      errors: 1,
      successRate: 2 / 3,
    });
  });
});

describe("computeFreeballStats", () => {
  it("tallies freeball outcomes", () => {
    const events = [
      event({ actionType: "freeball", outcomeCode: "good" }),
      event({ actionType: "freeball", outcomeCode: "error" }),
    ];
    expect(computeFreeballStats(events)).toEqual({ attempts: 2, good: 1, poor: 0, errors: 1 });
  });
});

describe("computeAssistsByPlayer / computeSettingStats", () => {
  it("credits the setter when the very next event in the rally is a kill", () => {
    const events = [
      event({ playerId: "setter1", actionType: "set", outcomeCode: "good", setId: "s1", rallyNumber: 1, sequenceInSet: 1 }),
      event({ playerId: "hitter1", actionType: "attack", outcomeCode: "kill", setId: "s1", rallyNumber: 1, sequenceInSet: 2 }),
    ];
    const assists = computeAssistsByPlayer(events);
    expect(assists.get("setter1")).toBe(1);
  });

  it("does not credit an assist if the attack after the set wasn't a kill", () => {
    const events = [
      event({ playerId: "setter1", actionType: "set", outcomeCode: "good", setId: "s1", rallyNumber: 1, sequenceInSet: 1 }),
      event({ playerId: "hitter1", actionType: "attack", outcomeCode: "in_play", setId: "s1", rallyNumber: 1, sequenceInSet: 2 }),
    ];
    expect(computeAssistsByPlayer(events).get("setter1")).toBeUndefined();
  });

  it("does not confuse rally numbers that repeat across different sets", () => {
    const events = [
      // set 1, rally 1: set -> kill (assist)
      event({ playerId: "setter1", actionType: "set", outcomeCode: "good", setId: "s1", rallyNumber: 1, sequenceInSet: 1 }),
      event({ playerId: "hitter1", actionType: "attack", outcomeCode: "kill", setId: "s1", rallyNumber: 1, sequenceInSet: 2 }),
      // set 2, rally 1 (number reused): set -> in_play (no assist)
      event({ playerId: "setter1", actionType: "set", outcomeCode: "good", setId: "s2", rallyNumber: 1, sequenceInSet: 1 }),
      event({ playerId: "hitter1", actionType: "attack", outcomeCode: "in_play", setId: "s2", rallyNumber: 1, sequenceInSet: 2 }),
    ];
    expect(computeAssistsByPlayer(events).get("setter1")).toBe(1);
  });

  it("computeSettingStats folds a precomputed assist count into the outcome tally", () => {
    const events = [
      event({ actionType: "set", outcomeCode: "good" }),
      event({ actionType: "set", outcomeCode: "error" }),
    ];
    expect(computeSettingStats(events, 3)).toEqual({ attempts: 2, good: 1, poor: 0, errors: 1, assists: 3 });
  });
});

describe("computePlayerStats", () => {
  it("scopes each stat bucket to the given player only", () => {
    const events = [
      event({ playerId: "p1", actionType: "serve", outcomeCode: "ace" }),
      event({ playerId: "p2", actionType: "serve", outcomeCode: "ace" }),
    ];
    const stats = computePlayerStats(events, "p1");
    expect(stats.serve.attempts).toBe(1);
  });

  it("infers sets played from the distinct sets the player has any event in", () => {
    const events = [
      event({ playerId: "p1", actionType: "dig", outcomeCode: "good", setId: "s1" }),
      event({ playerId: "p1", actionType: "block", outcomeCode: "stuff", setId: "s2" }),
    ];
    const stats = computePlayerStats(events, "p1");
    // 1 stuff block across 2 sets played -> 0.5 blocks/set
    expect(stats.block.blocksPerSet).toBe(0.5);
  });
});

describe("computeHowWeScored / computeHowWeLostPoints", () => {
  it("buckets our_point events by action type, including manual adjustments as 'other'", () => {
    const events = [
      event({ actionType: "serve", outcomeCode: "ace", pointImpact: "our_point" }),
      event({ actionType: "attack", outcomeCode: "kill", pointImpact: "our_point" }),
      event({ actionType: "block", outcomeCode: "stuff", pointImpact: "our_point" }),
      event({ actionType: "team_point_adjustment", outcomeCode: "manual_plus_us", pointImpact: "our_point", playerId: null }),
      event({ actionType: "attack", outcomeCode: "error_net", pointImpact: "opponent_point" }),
    ];
    expect(computeHowWeScored(events)).toEqual({ aces: 1, kills: 1, blocks: 1, other: 1, total: 4 });
  });

  it("buckets opponent_point events by our action type", () => {
    const events = [
      event({ actionType: "attack", outcomeCode: "error_net", pointImpact: "opponent_point" }),
      event({ actionType: "attack", outcomeCode: "error_out", pointImpact: "opponent_point" }),
      event({ actionType: "serve", outcomeCode: "error_net", pointImpact: "opponent_point" }),
      event({ actionType: "serve", outcomeCode: "ace", pointImpact: "our_point" }),
    ];
    expect(computeHowWeLostPoints(events)).toEqual({ byAction: { attack: 2, serve: 1 }, total: 3 });
  });
});
