import type { ContextBlock } from "@context-meter/shared";
import { estimateTokens } from "@context-meter/shared";
import type { BenchCase } from "./types.js";
import type { BenchLLM } from "./llm.js";

/**
 * Answer-accuracy grading: the core "does removing context actually help?"
 * measurement. For one case:
 *
 *   1. replay the task with ALL context blocks           -> answerFull
 *   2. replay the task with only the KEEP blocks          -> answerOptimized
 *   3. judge each answer against the dataset's gold        -> scoreFull, scoreOptimized
 *
 * If scoreOptimized >= scoreFull the pruning was free (same answer, fewer
 * tokens). If scoreOptimized > scoreFull the removed blocks were actively
 * hurting — stale, contradictory, or distracting. That delta, averaged over
 * many real cases, is the number that either backs the product's claim or
 * doesn't.
 */
export interface CaseAccuracy {
  caseId: string;
  source: string;
  datasetTag?: string;
  scoreFull: number;
  scoreOptimized: number;
  /** scoreOptimized - scoreFull, in points (0-100 scale). */
  delta: number;
  replayTokensFull: number;
  replayTokensOptimized: number;
  keptBlockCount: number;
  totalBlockCount: number;
}

export interface AccuracyReport {
  cases: number;
  meanScoreFull: number;
  meanScoreOptimized: number;
  /** Mean of per-case (optimized - full). Positive = pruning helped on average. */
  meanDelta: number;
  /** Share of cases where the optimized answer scored at least as high as the full-context answer. */
  fractionNoWorse: number;
  /** Share of cases where the optimized answer scored strictly higher. */
  fractionImproved: number;
  /** Mean per-case token reduction on the replayed context. */
  meanReplayTokenReductionPct: number;
}

function renderContext(blocks: ContextBlock[]): string {
  return blocks
    .map(
      (b) =>
        `[${b.title}] (source: ${b.source}${b.effectiveDate ? `, effective ${b.effectiveDate}` : ""})\n${b.content}`
    )
    .join("\n\n---\n\n");
}

function buildReplayPrompt(task: string, blocks: ContextBlock[]): string {
  return `Answer the task using ONLY the context below. Do not use outside knowledge. Prefer current/verified sources over older or superseded ones. If the context is insufficient, say so. Answer in 1-4 sentences.

TASK: ${task}

CONTEXT:
${renderContext(blocks)}`;
}

function buildJudgePrompt(task: string, reference: string, candidate: string): string {
  return `You are grading an assistant's answer for factual correctness against a reference answer.

TASK: ${task}

REFERENCE ANSWER (ground truth): ${reference}

ASSISTANT ANSWER: ${candidate}

Score from 0 to 100 how well the assistant answer matches the reference answer on factual substance for this task. 100 = fully correct and consistent with the reference; 50 = partially correct or missing key facts; 0 = wrong or contradicts the reference. Ignore differences in wording, length, and style.

Respond with ONLY a JSON object: {"score": <number 0-100>}`;
}

function parseScore(raw: string): number {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = (fence?.[1] ?? raw).trim();
  try {
    const obj = JSON.parse(text) as { score?: unknown };
    const n = Number(obj.score);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  } catch {
    // fall through to regex
  }
  const m = text.match(/(\d{1,3}(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export async function scoreCaseAccuracy(
  llm: BenchLLM,
  benchCase: BenchCase,
  keptBlockIds: string[]
): Promise<CaseAccuracy | null> {
  const reference = benchCase.groundTruth.referenceLabel?.trim();
  if (!reference) return null; // nothing to grade against

  const keptSet = new Set(keptBlockIds);
  const fullBlocks = benchCase.contextBlocks;
  const optimizedBlocks = fullBlocks.filter((b) => keptSet.has(b.id));
  if (optimizedBlocks.length === 0) return null; // engine kept nothing — not a meaningful replay

  const [answerFull, answerOptimized] = await Promise.all([
    llm.generate(buildReplayPrompt(benchCase.task, fullBlocks)),
    llm.generate(buildReplayPrompt(benchCase.task, optimizedBlocks)),
  ]);

  const [scoreFull, scoreOptimized] = await Promise.all([
    llm.generate(buildJudgePrompt(benchCase.task, reference, answerFull)).then(parseScore),
    llm.generate(buildJudgePrompt(benchCase.task, reference, answerOptimized)).then(parseScore),
  ]);

  const replayTokensFull = fullBlocks.reduce((s, b) => s + (b.estimatedTokens || estimateTokens(b.content)), 0);
  const replayTokensOptimized = optimizedBlocks.reduce(
    (s, b) => s + (b.estimatedTokens || estimateTokens(b.content)),
    0
  );

  return {
    caseId: benchCase.id,
    source: benchCase.source,
    datasetTag: benchCase.datasetTag,
    scoreFull,
    scoreOptimized,
    delta: scoreOptimized - scoreFull,
    replayTokensFull,
    replayTokensOptimized,
    keptBlockCount: optimizedBlocks.length,
    totalBlockCount: fullBlocks.length,
  };
}

export function aggregateAccuracy(rows: CaseAccuracy[]): AccuracyReport {
  if (rows.length === 0) {
    return {
      cases: 0,
      meanScoreFull: 0,
      meanScoreOptimized: 0,
      meanDelta: 0,
      fractionNoWorse: 0,
      fractionImproved: 0,
      meanReplayTokenReductionPct: 0,
    };
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    cases: rows.length,
    meanScoreFull: mean(rows.map((r) => r.scoreFull)),
    meanScoreOptimized: mean(rows.map((r) => r.scoreOptimized)),
    meanDelta: mean(rows.map((r) => r.delta)),
    fractionNoWorse: rows.filter((r) => r.scoreOptimized >= r.scoreFull).length / rows.length,
    fractionImproved: rows.filter((r) => r.scoreOptimized > r.scoreFull).length / rows.length,
    meanReplayTokenReductionPct: mean(
      rows.map((r) =>
        r.replayTokensFull > 0 ? (1 - r.replayTokensOptimized / r.replayTokensFull) * 100 : 0
      )
    ),
  };
}
