import type { ContextBlock } from "@context-meter/shared";

/**
 * One benchmark example: a task plus the context blocks it was retrieved with,
 * annotated with ground truth pulled from a real, independently-labeled dataset
 * (never authored by this repo) so decision-quality metrics aren't circular.
 */
export interface BenchCase {
  id: string;
  source: BenchSource;
  /** Dataset config/subset this case came from, e.g. a RAGBench subset name. */
  datasetTag?: string;
  task: string;
  contextBlocks: ContextBlock[];
  groundTruth: BenchGroundTruth;
}

export type BenchSource = "druid" | "ragbench";

export interface BenchGroundTruth {
  /** Block ids an independent human/model annotation says are actually needed to answer/verify the task. */
  relevantBlockIds: string[];
  /**
   * Pairs of block ids [a, b] known to genuinely conflict on the same topic
   * (e.g. opposing fact-check stances). Only populated for sources that carry
   * stance labels (DRUID). Order is not meaningful.
   */
  conflictBlockIdPairs?: [string, string][];
  /**
   * Free-text reference answer/verdict for the task, for future accuracy
   * grading (LLM-judge or exact-match) once an engine that produces free-text
   * replies is available to score against it. Not used by decision-quality
   * metrics.
   */
  referenceLabel?: string;
}

/** Per-case scoring of one analysis engine's KEEP/REMOVE decisions against ground truth. */
export interface CaseScore {
  caseId: string;
  source: BenchSource;
  datasetTag?: string;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  /** Of the ground-truth conflict pairs for this case, how many the engine flagged (any overlapping conflict). */
  conflictPairsDetected: number;
  conflictPairsTotal: number;
}

export interface AggregateReport {
  source: BenchSource | "all";
  cases: number;
  /** Micro-averaged: precision/recall/F1 computed from pooled TP/FP/FN across all cases. */
  precision: number;
  recall: number;
  f1: number;
  /** Mean per-case token reduction, (baseline - optimized) / baseline. */
  meanTokenReductionPct: number;
  conflictRecall: number | null;
}
