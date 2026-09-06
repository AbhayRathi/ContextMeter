import { ContextMeterClient } from "@context-meter/sdk";
import { loadDruidCases } from "./sources/druid.js";
import { loadRagbenchCases, DEFAULT_RAGBENCH_SUBSETS } from "./sources/ragbench.js";
import { aggregate, scoreCase } from "./metrics.js";
import type { AggregateReport, BenchCase, BenchSource, CaseScore } from "./types.js";

export interface RunBenchOptions {
  apiUrl: string;
  sources: BenchSource[];
  casesPerSource: number;
  ragbenchSubsets?: string[];
  /** Called after each case is scored, for progress reporting. */
  onCaseScored?: (score: CaseScore, index: number, total: number) => void;
}

export interface RunBenchResult {
  perCase: CaseScore[];
  bySource: AggregateReport[];
  overall: AggregateReport;
}

/**
 * Loads real, independently-labeled benchmark cases, runs each through the
 * heuristic analyzer of a live apps/api instance, and scores the resulting
 * KEEP/REMOVE decisions and conflict detections against that ground truth.
 * Requires `npm run dev:api` (or `start`) already running at `apiUrl` — this
 * intentionally reuses the same client/engine path as the CLI and Express
 * middleware, so a bench result reflects what a real integration would see.
 */
export async function runBench(options: RunBenchOptions): Promise<RunBenchResult> {
  const client = new ContextMeterClient({ baseUrl: options.apiUrl });

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

  const perCase: CaseScore[] = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    const analysis = await client.analyzeHeuristic(c.task, c.contextBlocks);
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

  return { perCase, bySource, overall };
}
