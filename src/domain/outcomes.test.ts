import { ACTION_OUTCOMES, ACTION_TYPES, getPointImpact, isValidOutcome } from "./outcomes";

describe("outcomes taxonomy", () => {
  it("maps every outcome in every action type to exactly one valid point-impact class", () => {
    const validImpacts = new Set(["our_point", "opponent_point", "neutral"]);
    for (const actionType of ACTION_TYPES) {
      for (const outcome of ACTION_OUTCOMES[actionType]) {
        expect(validImpacts.has(outcome.pointImpact)).toBe(true);
      }
    }
  });

  it("has no duplicate outcome codes within a single action type", () => {
    for (const actionType of ACTION_TYPES) {
      const codes = ACTION_OUTCOMES[actionType].map((o) => o.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it("resolves point impact for a known (actionType, outcomeCode) pair", () => {
    expect(getPointImpact("serve", "ace")).toBe("our_point");
    expect(getPointImpact("attack", "error_net")).toBe("opponent_point");
    expect(getPointImpact("dig", "good")).toBe("neutral");
  });

  it("throws for an unknown outcome code", () => {
    expect(() => getPointImpact("serve", "not_a_real_outcome")).toThrow();
  });

  it("validates outcome codes with isValidOutcome", () => {
    expect(isValidOutcome("block", "stuff")).toBe(true);
    expect(isValidOutcome("block", "kill")).toBe(false);
  });

  it("gives team_point_adjustment exactly the two manual outcomes", () => {
    const codes = ACTION_OUTCOMES.team_point_adjustment.map((o) => o.code).sort();
    expect(codes).toEqual(["manual_plus_opponent", "manual_plus_us"]);
  });
});
