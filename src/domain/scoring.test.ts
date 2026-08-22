import {
  DECIDING_SET,
  getMatchWinner,
  getSetWinner,
  isDecidingSet,
  recomputeSetScore,
  setsToWinMatch,
  STANDARD_SET,
} from "./scoring";

describe("recomputeSetScore", () => {
  it("increments the correct side for our_point / opponent_point and holds for neutral", () => {
    const events = [
      { actionType: "serve", outcomeCode: "ace" }, // our_point -> 1-0
      { actionType: "attack", outcomeCode: "error_net" }, // opponent_point -> 1-1
      { actionType: "dig", outcomeCode: "good" }, // neutral -> 1-1
      { actionType: "attack", outcomeCode: "kill" }, // our_point -> 2-1
    ] as const;

    const scored = recomputeSetScore(events);

    expect(scored.map((s) => [s.ourScoreAfter, s.opponentScoreAfter])).toEqual([
      [1, 0],
      [1, 1],
      [1, 1],
      [2, 1],
    ]);
    expect(scored.map((s) => s.sequenceInSet)).toEqual([1, 2, 3, 4]);
  });

  it("only the rally-ending action carries a non-neutral point impact, per event", () => {
    const events = [
      { actionType: "serve_receive", outcomeCode: "good" },
      { actionType: "set", outcomeCode: "good" },
      { actionType: "attack", outcomeCode: "kill" },
    ] as const;

    const scored = recomputeSetScore(events);
    expect(scored[0].pointImpact).toBe("neutral");
    expect(scored[1].pointImpact).toBe("neutral");
    expect(scored[2].pointImpact).toBe("our_point");
  });

  it("recalculates cleanly from a starting score (e.g. after deleting an earlier event)", () => {
    const events = [{ actionType: "block", outcomeCode: "stuff" }] as const;
    const scored = recomputeSetScore(events, { our: 10, opponent: 12 });
    expect(scored[0].ourScoreAfter).toBe(11);
    expect(scored[0].opponentScoreAfter).toBe(12);
  });

  it("produces an identical result when re-run on an edited sequence (idempotent recalculation)", () => {
    const original = [
      { actionType: "serve", outcomeCode: "ace" },
      { actionType: "attack", outcomeCode: "error_out" },
      { actionType: "attack", outcomeCode: "kill" },
    ] as const;
    // simulate deleting the middle (opponent-scoring) event
    const edited = [original[0], original[2]];

    const recalculated = recomputeSetScore(edited);
    expect(recalculated[recalculated.length - 1]).toMatchObject({
      ourScoreAfter: 2,
      opponentScoreAfter: 0,
    });
  });
});

describe("getSetWinner", () => {
  it("requires reaching the target with at least a 2-point lead", () => {
    expect(getSetWinner(25, 20, STANDARD_SET)).toBe("us");
    expect(getSetWinner(24, 25, STANDARD_SET)).toBe(null);
    expect(getSetWinner(25, 24, STANDARD_SET)).toBe(null);
    expect(getSetWinner(26, 24, STANDARD_SET)).toBe("us");
  });

  it("supports extended deuce play past the target", () => {
    expect(getSetWinner(28, 26, STANDARD_SET)).toBe("us");
    expect(getSetWinner(27, 27, STANDARD_SET)).toBe(null);
  });

  it("uses the deciding-set target when passed explicitly", () => {
    expect(getSetWinner(15, 10, DECIDING_SET)).toBe("us");
    expect(getSetWinner(14, 12, DECIDING_SET)).toBe(null);
  });

  it("returns null while the set is still in progress", () => {
    expect(getSetWinner(10, 8, STANDARD_SET)).toBe(null);
  });
});

describe("match format helpers", () => {
  it("computes sets needed to win per format", () => {
    expect(setsToWinMatch("best_of_3")).toBe(2);
    expect(setsToWinMatch("best_of_5")).toBe(3);
  });

  it("identifies the deciding set number per format", () => {
    expect(isDecidingSet(3, "best_of_3")).toBe(true);
    expect(isDecidingSet(2, "best_of_3")).toBe(false);
    expect(isDecidingSet(5, "best_of_5")).toBe(true);
    expect(isDecidingSet(4, "best_of_5")).toBe(false);
  });

  it("derives the match winner once a team reaches the required set count", () => {
    expect(getMatchWinner({ us: 2, opponent: 1 }, "best_of_3")).toBe("us");
    expect(getMatchWinner({ us: 1, opponent: 1 }, "best_of_3")).toBe(null);
    expect(getMatchWinner({ us: 2, opponent: 3 }, "best_of_5")).toBe("opponent");
  });
});
