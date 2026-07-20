import type {
  ContextBlock,
  ContextAnalysisResult,
  ContextDecision,
} from "@context-meter/shared";
import { ALL_SCENARIOS } from "@context-meter/shared";
import { sumBlockTokens } from "./tokenEstimator.js";

const DEFAULT_DECISION: Omit<ContextDecision, "blockId"> = {
  action: "KEEP",
  reason: "No specific analysis available; retaining by default.",
  risk: "MEDIUM",
};

/**
 * Deterministic fallback analyzer, used when no Gemini key is configured.
 * Reads each block's canned `fallbackDecision` and the scenario's canned
 * `fallbackConflicts` from the fixture data, so it works for any scenario
 * without hardcoding block IDs.
 *
 * Looks up canonical fixture blocks by scenarioId + block id rather than
 * trusting `fallbackDecision` on the *submitted* blocks — the studio-web
 * frontend round-trips whatever it got from GET /api/scenarios/:id, and the
 * wire adapter strips fixture-internal fields (and display-transforms
 * category/priority) before that response ever reaches the client.
 */
export function fallbackAnalyze(
  scenarioId: string | undefined,
  blocks: ContextBlock[]
): ContextAnalysisResult {
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);
  const canonicalById = new Map((scenario?.contextBlocks ?? []).map((b) => [b.id, b]));

  const decisions: ContextDecision[] = blocks.map((block) => ({
    blockId: block.id,
    ...(canonicalById.get(block.id)?.fallbackDecision ?? DEFAULT_DECISION),
  }));

  const conflicts = scenario?.fallbackConflicts ?? [];

  const optimizedContextIds = decisions
    .filter((d) => d.action === "KEEP")
    .map((d) => d.blockId);

  const optimizedBlocks = blocks.filter((b) =>
    optimizedContextIds.includes(b.id)
  );

  const baselineEstimatedTokens = sumBlockTokens(blocks);
  const optimizedEstimatedTokens = sumBlockTokens(optimizedBlocks);
  const removedCount = blocks.length - optimizedBlocks.length;
  const reduction =
    baselineEstimatedTokens > 0
      ? Math.round((1 - optimizedEstimatedTokens / baselineEstimatedTokens) * 100)
      : 0;

  const summary = `Analyzed ${blocks.length} context blocks. Removed ${removedCount} block${removedCount === 1 ? "" : "s"}. Identified ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"}. Optimized context reduces token usage from ${baselineEstimatedTokens} to ${optimizedEstimatedTokens} tokens (~${reduction}% reduction).`;

  return {
    decisions,
    conflicts,
    optimizedContextIds,
    summary,
    baselineEstimatedTokens,
    optimizedEstimatedTokens,
  };
}
