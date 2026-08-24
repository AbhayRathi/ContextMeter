import type { ContextAction, ContextConflict, ContextDecision } from "@context-meter/shared";

/**
 * Response shape of POST /api/analyze — the "smart" engine (gemini or fallback),
 * adapted by apps/api/src/adapters/studioContract.ts. Field names differ from the
 * internal ContextDecision/ContextConflict shapes on purpose (contextBlockId vs.
 * blockId, blockA/blockB vs. blockIds) — this mirrors studio-web's wire contract.
 */
export interface AdaptedContextDecision {
  contextBlockId: string;
  recommendedAction: ContextAction;
  recommendationReason: string;
  riskIfRemoved: string;
}

export interface AdaptedConflictBlockInfo {
  id: string;
  source: string;
  value: string;
  isNewer: boolean;
  verified: boolean;
}

export interface AdaptedContextConflict {
  id: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
  blockA: AdaptedConflictBlockInfo;
  blockB: AdaptedConflictBlockInfo;
}

export interface AdaptedAnalyzeResponse {
  decisions: AdaptedContextDecision[];
  conflicts: AdaptedContextConflict[];
  optimizedContextIds: string[];
  summary: string;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  mode: "gemini" | "fallback";
}

/**
 * Response shape of POST /api/analyze/heuristic — pure similarity/recency math,
 * not per-scenario fixture lookups, so it isn't run through the studio-web
 * adapter and stays on the internal ContextDecision/ContextConflict shape.
 * This is the engine the CLI and middleware call by default, since it works on
 * any task + block set instead of only the 3 shipped demo scenarios.
 */
export interface HeuristicAnalyzeResponse {
  decisions: ContextDecision[];
  conflicts: ContextConflict[];
  optimizedContextIds: string[];
  summary: string;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  mode: "heuristic";
}

export interface EvaluationResultWire {
  id: string;
  label: string;
  passed: boolean;
  explanation: string;
  baselineResult: string;
  optimizedResult: string;
}

export interface EvaluationSummaryWire {
  passed: number;
  total: number;
  /** 0-100, unlike the internal EvaluationSummary's 0-1 score. */
  score: number;
  results: EvaluationResultWire[];
}

export interface ReplayResponse {
  response: string;
  estimatedInputTokens: number;
  evaluation: EvaluationSummaryWire;
  mode: "gemini" | "fallback" | "heuristic";
}

/** Combined result of ContextMeterClient#lint(): heuristic analysis + replay in one call. */
export interface LintResult {
  decisions: ContextDecision[];
  conflicts: ContextConflict[];
  summary: string;
  optimizedEstimatedTokens: number;
  response: string;
  estimatedInputTokens: number;
  evaluation: EvaluationSummaryWire;
}
