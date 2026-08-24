import { ContextMeterClient, runContextGate } from "@context-meter/sdk";
import { loadConfig } from "../config.js";

export interface TestCommandOptions {
  config: string;
}

/** Runs analyze -> replay -> evaluate against a config file and returns a process exit code. */
export async function runTestCommand(options: TestCommandOptions): Promise<number> {
  const { config, contextBlocks } = loadConfig(options.config);
  const client = new ContextMeterClient({ baseUrl: config.apiUrl, apiKey: config.apiKey });

  // Same runContextGate the Express middleware calls, so the CLI's regression
  // gate and a live runtime check can never silently disagree on "pass."
  const result = await runContextGate(
    client,
    { task: config.task, contextBlocks },
    { failOn: config.failOn }
  );

  console.log(
    `ContextMeter — ${contextBlocks.length} block(s), ${result.decisions.length} decision(s)`
  );
  for (const decision of result.decisions) {
    console.log(`  [${decision.action}] ${decision.blockId} — ${decision.reason}`);
  }

  if (result.conflicts.length > 0) {
    console.log(`\n${result.conflicts.length} conflict(s):`);
    for (const conflict of result.conflicts) {
      console.log(`  - ${conflict.title}: ${conflict.description}`);
    }
  }

  console.log(
    `\nEvaluation score: ${result.evaluation.score}/100 (${result.evaluation.passed}/${result.evaluation.total} passed)`
  );

  if (!result.allowed) {
    console.error("\nFAIL:");
    for (const reason of result.failReasons) {
      console.error(`  - ${reason}`);
    }
    return 1;
  }

  console.log("\nPASS");
  return 0;
}
