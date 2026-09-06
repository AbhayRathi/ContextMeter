import type { ContextConflict, ContextDecision } from "@context-meter/shared";
import type { AggregateReport, BenchCase, BenchSource, CaseScore } from "./types.js";

/**
 * Scores one engine's decisions for one case against that case's ground
 * truth. Positive class = KEEP (the engine asserting a block is needed).
 */
export function scoreCase(
  benchCase: BenchCase,
  decisions: ContextDecision[],
  conflicts: ContextConflict[],
  baselineEstimatedTokens: number,
  optimizedEstimatedTokens: number
): CaseScore {
  const truth = new Set(benchCase.groundTruth.relevantBlockIds);
  const keptIds = new Set(decisions.filter((d) => d.action === "KEEP").map((d) => d.blockId));

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;
  for (const block of benchCase.contextBlocks) {
    const kept = keptIds.has(block.id);
    const shouldKeep = truth.has(block.id);
    if (kept && shouldKeep) truePositives++;
    else if (kept && !shouldKeep) falsePositives++;
    else if (!kept && shouldKeep) falseNegatives++;
    else trueNegatives++;
  }

  const conflictPairs = benchCase.groundTruth.conflictBlockIdPairs ?? [];
  const conflictPairsDetected = conflictPairs.filter(([a, b]) =>
    conflicts.some((c) => c.blockIds.includes(a) && c.blockIds.includes(b))
  ).length;

  return {
    caseId: benchCase.id,
    source: benchCase.source,
    datasetTag: benchCase.datasetTag,
    truePositives,
    falsePositives,
    falseNegatives,
    trueNegatives,
    baselineEstimatedTokens,
    optimizedEstimatedTokens,
    conflictPairsDetected,
    conflictPairsTotal: conflictPairs.length,
  };
}

/**
 * Pools per-case counts into one report. Precision/recall/F1 are
 * micro-averaged (summed TP/FP/FN across cases) rather than averaging each
 * case's own precision/recall, so cases with more context blocks aren't
 * under-weighted relative to small ones.
 */
export function aggregate(scores: CaseScore[], source: BenchSource | "all"): AggregateReport {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tokenReductionSum = 0;
  let tokenReductionCount = 0;
  let conflictDetected = 0;
  let conflictTotal = 0;

  for (const s of scores) {
    tp += s.truePositives;
    fp += s.falsePositives;
    fn += s.falseNegatives;

    if (s.baselineEstimatedTokens > 0) {
      tokenReductionSum += 1 - s.optimizedEstimatedTokens / s.baselineEstimatedTokens;
      tokenReductionCount++;
    }

    conflictDetected += s.conflictPairsDetected;
    conflictTotal += s.conflictPairsTotal;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    source,
    cases: scores.length,
    precision,
    recall,
    f1,
    meanTokenReductionPct:
      tokenReductionCount > 0 ? (tokenReductionSum / tokenReductionCount) * 100 : 0,
    conflictRecall: conflictTotal > 0 ? conflictDetected / conflictTotal : null,
  };
}
