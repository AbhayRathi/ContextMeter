import type {
  ContextBlock,
  ContextAnalysisResult,
  ContextDecision,
  ContextConflict,
} from "@context-meter/shared";
import { sumBlockTokens } from "./tokenEstimator.js";

/**
 * Deterministic fallback analyzer for the banking scenario.
 * Returns analysis that removes stale, duplicate, and irrelevant blocks.
 */
export function fallbackAnalyze(
  blocks: ContextBlock[]
): ContextAnalysisResult {
  const decisions: ContextDecision[] = [];
  const conflicts: ContextConflict[] = [];

  for (const block of blocks) {
    switch (block.id) {
      case "policy-2026":
        decisions.push({
          blockId: block.id,
          action: "KEEP",
          reason:
            "Current verified policy from 2026. Essential for answering waiver eligibility and wire-transfer limit questions.",
          risk: "LOW",
        });
        break;
      case "policy-2024":
        decisions.push({
          blockId: block.id,
          action: "REMOVE",
          reason:
            "Superseded by the 2026 policy. Retaining this block would cause the agent to provide incorrect answers about waiver eligibility and wire-transfer limits.",
          risk: "LOW",
        });
        break;
      case "customer-profile":
        decisions.push({
          blockId: block.id,
          action: "KEEP",
          reason:
            "Critical customer context: Platinum tier and good standing are required to evaluate waiver eligibility.",
          risk: "LOW",
        });
        break;
      case "account-history":
        decisions.push({
          blockId: block.id,
          action: "KEEP",
          reason:
            "Critical: the 120-day waiver history is required to confirm eligibility under the 90-day rule.",
          risk: "LOW",
        });
        break;
      case "duplicate-conversation":
        decisions.push({
          blockId: block.id,
          action: "REMOVE",
          reason:
            "Duplicate of information already present in customer profile and account history. Adds tokens without adding value.",
          risk: "LOW",
        });
        break;
      case "marketing-promo":
        decisions.push({
          blockId: block.id,
          action: "REMOVE",
          reason:
            "Irrelevant marketing content. Unrelated to the customer's question about overdraft waivers and wire-transfer limits.",
          risk: "LOW",
        });
        break;
      default:
        decisions.push({
          blockId: block.id,
          action: "KEEP",
          reason: "No specific analysis available; retaining by default.",
          risk: "MEDIUM",
        });
    }
  }

  // Conflict: policy-2024 vs policy-2026
  const has2024 = blocks.some((b) => b.id === "policy-2024");
  const has2026 = blocks.some((b) => b.id === "policy-2026");

  if (has2024 && has2026) {
    conflicts.push({
      id: "conflict-policy-date",
      blockIds: ["policy-2024", "policy-2026"],
      description:
        "The 2024 policy states no overdraft waivers are permitted and sets a $5,000 wire limit. The 2026 policy permits one waiver per 90 days for Platinum customers and sets a $10,000 wire limit. These policies directly contradict each other.",
      resolution:
        "Remove the 2024 policy block. The 2026 policy explicitly supersedes prior policies and is the verified current document.",
      severity: "HIGH",
    });
  }

  const optimizedContextIds = decisions
    .filter((d) => d.action === "KEEP")
    .map((d) => d.blockId);

  const optimizedBlocks = blocks.filter((b) =>
    optimizedContextIds.includes(b.id)
  );

  const baselineEstimatedTokens = sumBlockTokens(blocks);
  const optimizedEstimatedTokens = sumBlockTokens(optimizedBlocks);

  const summary = `Analyzed ${blocks.length} context blocks. Removed ${blocks.length - optimizedBlocks.length} blocks (1 stale policy, 1 duplicate, 1 irrelevant marketing). Identified 1 critical policy conflict. Optimized context reduces token usage from ${baselineEstimatedTokens} to ${optimizedEstimatedTokens} tokens (~${Math.round((1 - optimizedEstimatedTokens / baselineEstimatedTokens) * 100)}% reduction).`;

  return {
    decisions,
    conflicts,
    optimizedContextIds,
    summary,
    baselineEstimatedTokens,
    optimizedEstimatedTokens,
  };
}
