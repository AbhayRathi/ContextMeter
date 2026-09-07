import { describe, expect, it } from "vitest";
import { aggregateAccuracy } from "../accuracy.js";
import type { CaseAccuracy } from "../accuracy.js";

function row(over: Partial<CaseAccuracy>): CaseAccuracy {
  return {
    caseId: "c",
    source: "ragbench",
    scoreFull: 50,
    scoreOptimized: 50,
    delta: 0,
    replayTokensFull: 100,
    replayTokensOptimized: 100,
    keptBlockCount: 1,
    totalBlockCount: 1,
    ...over,
  };
}

describe("aggregateAccuracy", () => {
  it("returns a zeroed report for no rows", () => {
    const r = aggregateAccuracy([]);
    expect(r.cases).toBe(0);
    expect(r.meanDelta).toBe(0);
  });

  it("computes means, no-worse / improved fractions, and token reduction", () => {
    const rows = [
      row({ scoreFull: 40, scoreOptimized: 60, delta: 20, replayTokensFull: 100, replayTokensOptimized: 50 }),
      row({ scoreFull: 80, scoreOptimized: 80, delta: 0, replayTokensFull: 100, replayTokensOptimized: 80 }),
      row({ scoreFull: 70, scoreOptimized: 50, delta: -20, replayTokensFull: 100, replayTokensOptimized: 90 }),
    ];
    const r = aggregateAccuracy(rows);
    expect(r.cases).toBe(3);
    expect(r.meanScoreFull).toBeCloseTo(63.33, 1);
    expect(r.meanScoreOptimized).toBeCloseTo(63.33, 1);
    expect(r.meanDelta).toBeCloseTo(0, 5);
    // rows 1 and 2 are >= full; row 3 is worse
    expect(r.fractionNoWorse).toBeCloseTo(2 / 3, 5);
    expect(r.fractionImproved).toBeCloseTo(1 / 3, 5);
    // reductions: 50%, 20%, 10% -> mean ~26.67%
    expect(r.meanReplayTokenReductionPct).toBeCloseTo(26.67, 1);
  });
});
