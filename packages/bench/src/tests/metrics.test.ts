import { describe, expect, it } from "vitest";
import type { ContextBlock, ContextConflict, ContextDecision } from "@context-meter/shared";
import type { BenchCase } from "../types.js";
import { aggregate, scoreCase } from "../metrics.js";

function block(id: string): ContextBlock {
  return {
    id,
    title: id,
    category: "retrieval",
    content: id,
    source: "test",
    estimatedTokens: 10,
    verified: true,
  };
}

function makeCase(blockIds: string[], relevantBlockIds: string[], conflictPairs: [string, string][] = []): BenchCase {
  return {
    id: "case-1",
    source: "ragbench",
    task: "task",
    contextBlocks: blockIds.map(block),
    groundTruth: { relevantBlockIds, conflictBlockIdPairs: conflictPairs },
  };
}

function decision(blockId: string, action: "KEEP" | "REMOVE"): ContextDecision {
  return { blockId, action, reason: "", risk: "LOW" };
}

describe("scoreCase", () => {
  it("counts true/false positives/negatives against ground truth", () => {
    const c = makeCase(["a", "b", "c", "d"], ["a", "b"]);
    const decisions = [
      decision("a", "KEEP"), // TP
      decision("b", "REMOVE"), // FN
      decision("c", "KEEP"), // FP
      decision("d", "REMOVE"), // TN
    ];
    const score = scoreCase(c, decisions, [], 100, 50);
    expect(score.truePositives).toBe(1);
    expect(score.falseNegatives).toBe(1);
    expect(score.falsePositives).toBe(1);
    expect(score.trueNegatives).toBe(1);
  });

  it("counts a labeled conflict pair as detected only when a reported conflict spans both ids", () => {
    const c = makeCase(["a", "b"], ["a", "b"], [["a", "b"]]);
    const decisions = [decision("a", "KEEP"), decision("b", "KEEP")];
    const missed = scoreCase(c, decisions, [], 100, 100);
    expect(missed.conflictPairsDetected).toBe(0);
    expect(missed.conflictPairsTotal).toBe(1);

    const reportedConflict: ContextConflict = {
      id: "conflict-1",
      blockIds: ["a", "b"],
      description: "",
      resolution: "",
      severity: "HIGH",
      title: "",
      blockAValue: "",
      blockBValue: "",
    };
    const found = scoreCase(c, decisions, [reportedConflict], 100, 100);
    expect(found.conflictPairsDetected).toBe(1);
  });
});

describe("aggregate", () => {
  it("micro-averages precision/recall/F1 across cases and reports mean token reduction", () => {
    const scores = [
      {
        caseId: "1",
        source: "ragbench" as const,
        truePositives: 2,
        falsePositives: 1,
        falseNegatives: 0,
        trueNegatives: 1,
        baselineEstimatedTokens: 100,
        optimizedEstimatedTokens: 50,
        conflictPairsDetected: 0,
        conflictPairsTotal: 0,
      },
      {
        caseId: "2",
        source: "ragbench" as const,
        truePositives: 1,
        falsePositives: 0,
        falseNegatives: 1,
        trueNegatives: 1,
        baselineEstimatedTokens: 200,
        optimizedEstimatedTokens: 100,
        conflictPairsDetected: 0,
        conflictPairsTotal: 0,
      },
    ];
    const report = aggregate(scores, "ragbench");
    // pooled TP=3, FP=1, FN=1 -> precision 3/4, recall 3/4
    expect(report.precision).toBeCloseTo(0.75, 5);
    expect(report.recall).toBeCloseTo(0.75, 5);
    expect(report.f1).toBeCloseTo(0.75, 5);
    expect(report.meanTokenReductionPct).toBeCloseTo(50, 5);
    expect(report.conflictRecall).toBeNull();
  });

  it("reports conflictRecall as null when no cases have labeled conflict pairs", () => {
    const report = aggregate([], "all");
    expect(report.conflictRecall).toBeNull();
    expect(report.cases).toBe(0);
  });
});
