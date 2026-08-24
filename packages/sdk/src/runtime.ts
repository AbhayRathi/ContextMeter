import type { ContextBlock } from "@context-meter/shared";
import type { ContextMeterClient } from "./client.js";
import type { LintResult } from "./wireTypes.js";

export interface ContextGateInput {
  task: string;
  contextBlocks: ContextBlock[];
}

export interface ContextGatePolicy {
  failOn?: {
    /** Fail if any conflict was detected between context blocks. */
    conflict?: boolean;
    /** Fail if the replay evaluation score (0-100) drops below this. */
    minScore?: number;
  };
}

export interface ContextGateResult extends LintResult {
  /** false when a configured failOn condition was triggered. */
  allowed: boolean;
  /** Human-readable reasons `allowed` is false. Empty when allowed. */
  failReasons: string[];
}

/**
 * The one policy decision shared by every ContextMeter surface (CLI, Express
 * middleware, and any future adapter): run the engine, then decide allowed
 * vs. blocked from the same failOn rules. Framework-agnostic on purpose —
 * nothing here knows about HTTP, Express, or a CLI process, so every caller
 * is provably applying the same definition of "pass."
 */
export async function runContextGate(
  client: ContextMeterClient,
  input: ContextGateInput,
  policy: ContextGatePolicy = {}
): Promise<ContextGateResult> {
  const result = await client.lint(input.task, input.contextBlocks);
  const failReasons: string[] = [];

  if (policy.failOn?.conflict && result.conflicts.length > 0) {
    failReasons.push(`${result.conflicts.length} context conflict(s) detected`);
  }
  if (
    policy.failOn?.minScore !== undefined &&
    result.evaluation.score < policy.failOn.minScore
  ) {
    failReasons.push(
      `evaluation score ${result.evaluation.score} is below minScore ${policy.failOn.minScore}`
    );
  }

  return { ...result, allowed: failReasons.length === 0, failReasons };
}
