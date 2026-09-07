import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { runBench } from "./runner.js";
import type { AccuracyReport } from "./accuracy.js";
import type { AggregateReport } from "./types.js";
import type { BenchSource } from "./types.js";

const { values } = parseArgs({
  options: {
    source: { type: "string", default: "druid,ragbench" },
    n: { type: "string", default: "50" },
    "api-url": { type: "string", default: "http://localhost:8080" },
    "ragbench-subsets": { type: "string" },
    accuracy: { type: "boolean", default: false },
    // Low by default: a free-tier Gemini key allows only ~5 requests/min/model,
    // and each graded case is 4 calls. Raise once billing is enabled on the key.
    concurrency: { type: "string", default: "2" },
    out: { type: "string" },
  },
});

const sources = values.source!.split(",").map((s) => s.trim()) as BenchSource[];
const casesPerSource = parseInt(values.n!, 10);
const ragbenchSubsets = values["ragbench-subsets"]?.split(",").map((s) => s.trim());
const outPath =
  values.out ?? join(fileURLToPath(new URL("../reports", import.meta.url)), `${Date.now()}.json`);

console.log(
  `ContextMeter bench — sources=[${sources.join(", ")}] n=${casesPerSource} api=${values["api-url"]} accuracy=${values.accuracy}\n`
);

const result = await runBench({
  apiUrl: values["api-url"]!,
  sources,
  casesPerSource,
  ragbenchSubsets,
  accuracy: values.accuracy,
  accuracyConcurrency: parseInt(values.concurrency!, 10),
  onCaseScored: (score, i, total) => {
    if (process.stdout.isTTY) {
      process.stdout.write(`\r  analyzed ${i}/${total} cases (${score.source})...`);
    } else if (i % 20 === 0 || i === total) {
      console.log(`  analyzed ${i}/${total} cases`);
    }
  },
  onCaseGraded: (_row, i, total) => {
    if (process.stdout.isTTY) {
      process.stdout.write(`\r  graded ${i}/${total} cases...`);
    } else if (i % 10 === 0 || i === total) {
      console.log(`  graded ${i}/${total} cases`);
    }
  },
});

console.log("\n");
console.log("═══ DECISION QUALITY (KEEP/REMOVE vs. real relevance labels) ═══");
for (const report of result.bySource) printDecisionReport(report);
console.log("");
printDecisionReport(result.overall);

if (result.accuracy) {
  console.log("\n═══ ANSWER ACCURACY (full context vs. optimized context, LLM-judged vs. gold) ═══");
  for (const r of result.accuracy.bySource) printAccuracyReport(r.source, r);
  console.log("");
  printAccuracyReport("all", result.accuracy.overall);
  console.log(`\n  (${result.accuracy.geminiCalls} Gemini calls total)`);
}

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(result, null, 2), "utf-8");
console.log(`\nFull per-case results written to ${outPath}`);

function printDecisionReport(r: AggregateReport): void {
  console.log(`── ${r.source} (${r.cases} cases) ──`);
  console.log(`  precision: ${(r.precision * 100).toFixed(1)}%   recall: ${(r.recall * 100).toFixed(1)}%   F1: ${(r.f1 * 100).toFixed(1)}%`);
  console.log(`  mean token reduction: ${r.meanTokenReductionPct.toFixed(1)}%`);
  console.log(
    `  conflict recall: ${r.conflictRecall === null ? "n/a (no labeled conflict pairs)" : `${(r.conflictRecall * 100).toFixed(1)}%`}`
  );
}

function printAccuracyReport(source: string, r: AccuracyReport): void {
  console.log(`── ${source} (${r.cases} graded) ──`);
  console.log(
    `  mean answer score:  full ${r.meanScoreFull.toFixed(1)}  →  optimized ${r.meanScoreOptimized.toFixed(1)}   (delta ${r.meanDelta >= 0 ? "+" : ""}${r.meanDelta.toFixed(1)} pts)`
  );
  console.log(
    `  optimized answer no worse than full: ${(r.fractionNoWorse * 100).toFixed(1)}%   strictly better: ${(r.fractionImproved * 100).toFixed(1)}%`
  );
  console.log(`  mean replayed-context token reduction: ${r.meanReplayTokenReductionPct.toFixed(1)}%`);
}
