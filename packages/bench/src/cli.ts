import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { runBench } from "./runner.js";
import type { BenchSource } from "./types.js";

const { values } = parseArgs({
  options: {
    source: { type: "string", default: "druid,ragbench" },
    n: { type: "string", default: "50" },
    "api-url": { type: "string", default: "http://localhost:8080" },
    "ragbench-subsets": { type: "string" },
    out: { type: "string" },
  },
});

const sources = values.source!.split(",").map((s) => s.trim()) as BenchSource[];
const casesPerSource = parseInt(values.n!, 10);
const ragbenchSubsets = values["ragbench-subsets"]?.split(",").map((s) => s.trim());
const outPath =
  values.out ?? join(fileURLToPath(new URL("../reports", import.meta.url)), `${Date.now()}.json`);

console.log(
  `ContextMeter bench — sources=[${sources.join(", ")}] n=${casesPerSource} api=${values["api-url"]}\n`
);

const result = await runBench({
  apiUrl: values["api-url"]!,
  sources,
  casesPerSource,
  ragbenchSubsets,
  onCaseScored: (score, i, total) => {
    process.stdout.write(`\r  scored ${i}/${total} cases (${score.source})...`);
  },
});

console.log("\n");
for (const report of result.bySource) {
  printReport(report);
}
console.log("");
printReport(result.overall);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(result, null, 2), "utf-8");
console.log(`\nFull per-case results written to ${outPath}`);

function printReport(r: (typeof result.bySource)[number]): void {
  console.log(`── ${r.source} (${r.cases} cases) ──`);
  console.log(`  KEEP/REMOVE precision: ${(r.precision * 100).toFixed(1)}%`);
  console.log(`  KEEP/REMOVE recall:    ${(r.recall * 100).toFixed(1)}%`);
  console.log(`  KEEP/REMOVE F1:        ${(r.f1 * 100).toFixed(1)}%`);
  console.log(`  Mean token reduction:  ${r.meanTokenReductionPct.toFixed(1)}%`);
  console.log(
    `  Conflict recall:       ${r.conflictRecall === null ? "n/a (no labeled conflict pairs for this source)" : `${(r.conflictRecall * 100).toFixed(1)}%`}`
  );
}
