import { ContextMeterClient } from "@context-meter/sdk";
import { loadDruidCases } from "./sources/druid.js";
import { loadRagbenchCases, DEFAULT_RAGBENCH_SUBSETS } from "./sources/ragbench.js";
import { aggregate, scoreCase } from "./metrics.js";
import { aggregateAccuracy, scoreCaseAccuracy } from "./accuracy.js";
import { BenchLLM } from "./llm.js";
import type { AccuracyReport, CaseAccuracy } from "./accuracy.js";
import type { AggregateReport, BenchCase, BenchSource, CaseScore } from "./types.js";

export interface RunBenchOptions {
  apiUrl: string;
  sources: BenchSource[];
  casesPerSource: number;
  ragbenchSubsets?: string[];
  /**
   * Also run answer-accuracy grading: replay each case with full vs.
   * engine-optimized context and judge both against the dataset gold with an
   * LLM. Needs GEMINI_API_KEY in the environment. Costs ~4 Gemini calls/case.
   */
  accuracy?: boolean;
  /** Max cases graded concurrently in accuracy mode (each is ~4 Gemini calls). Default 4. */
  accuracyConcurrency?: number;
  /** Called after each case's decision scoring, for progress reporting. */
  onCaseScored?: (score: CaseScore, index: number, total: number) => void;
  /** Called after each case's accuracy grading (accuracy mode only). */
  onCaseGraded?: (row: CaseAccuracy | null, index: number, total: number) => void;
}

export interface RunBenchResult {
  perCase: CaseScore[];
  bySource: AggregateReport[];
  overall: AggregateReport;
  accuracy?: {
    perCase: CaseAccuracy[];
    bySource: (AccuracyReport & { source: string })[];
    overall: AccuracyReport;
    geminiCalls: number;
  };
}

async function loadCases(options: RunBenchOptions): Promise<BenchCase[]> {
  const cases: BenchCase[] = [];
  for (const source of options.sources) {
    if (source === "druid") {
      cases.push(...(await loadDruidCases(options.casesPerSource)));
    } else if (source === "ragbench") {
      cases.push(
        ...(await loadRagbenchCases(
          options.casesPerSource,
          options.ragbenchSubsets ?? DEFAULT_RAGBENCH_SUBSETS
        ))
      );
    }
  }
  return cases;
}

/**
 * Loads real, independently-labeled benchmark cases, runs each through the
 * heuristic analyzer of a live apps/api instance, and scores the resulting
 * KEEP/REMOVE decisions and conflict detections against that ground truth.
 * Requires `npm run dev:api` (or `start`) already running at `apiUrl` — this
 * intentionally reuses the same client/engine path as the CLI and Express
 * middleware, so a bench result reflects what a real integration would see.
 *
 * With `accuracy: true`, additionally replays each case (full vs. optimized
 * context) and LLM-judges both answers against the dataset gold.
 */
export async function runBench(options: RunBenchOptions): Promise<RunBenchResult> {
  const client = new ContextMeterClient({ baseUrl: options.apiUrl });
  const cases = await loadCases(options);

  const perCase: CaseScore[] = [];
  const keptByCase = new Map<string, string[]>();
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    const analysis = await client.analyzeHeuristic(c.task, c.contextBlocks);
    keptByCase.set(
      c.id,
      analysis.decisions.filter((d) => d.action === "KEEP").map((d) => d.blockId)
    );
    const score = scoreCase(
      c,
      analysis.decisions,
      analysis.conflicts,
      analysis.baselineEstimatedTokens,
      analysis.optimizedEstimatedTokens
    );
    perCase.push(score);
    options.onCaseScored?.(score, i + 1, cases.length);
  }

  const bySource = options.sources.map((source) =>
    aggregate(
      perCase.filter((s) => s.source === source),
      source
    )
  );
  const overall = aggregate(perCase, "all");

  const result: RunBenchResult = { perCase, bySource, overall };

  if (options.accuracy) {
    const llm = new BenchLLM();
    const concurrency = Math.max(1, options.accuracyConcurrency ?? 4);
    const accRows: CaseAccuracy[] = [];
    let graded = 0;

    for (let start = 0; start < cases.length; start += concurrency) {
      const batch = cases.slice(start, start + concurrency);
      const settled = await Promise.all(
        batch.map((c) =>
          scoreCaseAccuracy(llm, c, keptByCase.get(c.id) ?? []).catch((err: unknown) => {
            console.warn(`\n  [accuracy] case ${c.id} failed, skipping: ${(err as Error).message}`);
            return null;
          })
        )
      );
      for (const row of settled) {
        graded++;
        options.onCaseGraded?.(row, graded, cases.length);
        if (row) accRows.push(row);
      }
    }

    result.accuracy = {
      perCase: accRows,
      bySource: options.sources.map((source) => ({
        source,
        ...aggregateAccuracy(accRows.filter((r) => r.source === source)),
      })),
      overall: aggregateAccuracy(accRows),
      geminiCalls: llm.callCount,
    };
  }

  return result;
}
