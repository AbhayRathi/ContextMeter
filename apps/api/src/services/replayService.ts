import type { ContextBlock, EvaluationSummary } from "@context-meter/shared";
import { evaluateResponse } from "@context-meter/shared";
import { sumBlockTokens } from "./tokenEstimator.js";

/**
 * Deterministic fallback replay response for the banking scenario.
 */
export const FALLBACK_OPTIMIZED_RESPONSE =
  "Based on your account information: You are eligible for an overdraft-fee waiver. Our current 2026 Platinum policy allows one waiver every 90 days, and your last waiver was 120 days ago — well within the eligibility window. Your current wire-transfer limit is $10,000 per transaction, as set by the current 2026 policy.";

export function fallbackReplay(blocks: ContextBlock[]): {
  response: string;
  estimatedInputTokens: number;
  evaluation: EvaluationSummary;
  mode: "fallback";
} {
  const estimatedInputTokens = sumBlockTokens(blocks);
  const evaluation = evaluateResponse(FALLBACK_OPTIMIZED_RESPONSE);

  return {
    response: FALLBACK_OPTIMIZED_RESPONSE,
    estimatedInputTokens,
    evaluation,
    mode: "fallback",
  };
}
