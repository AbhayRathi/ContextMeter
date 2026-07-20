import type { ContextBlock, EvaluationSummary } from "@context-meter/shared";
import {
  ALL_SCENARIOS,
  EVALUATION_TESTS_BY_SCENARIO,
  BANKING_EVALUATION_TESTS,
  evaluateResponse,
} from "@context-meter/shared";
import { sumBlockTokens } from "./tokenEstimator.js";

/**
 * Deterministic fallback replay, used when no Gemini key is configured.
 * Reads the scenario's canned `expectedOptimizedResponse` from fixture data
 * and evaluates it against that scenario's evaluation tests.
 */
export function fallbackReplay(
  scenarioId: string | undefined,
  blocks: ContextBlock[]
): {
  response: string;
  estimatedInputTokens: number;
  evaluation: EvaluationSummary;
  mode: "fallback";
} {
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);
  const response = scenario?.expectedOptimizedResponse ?? "";
  const tests = (scenarioId !== undefined ? EVALUATION_TESTS_BY_SCENARIO[scenarioId] : undefined) ?? BANKING_EVALUATION_TESTS;

  const estimatedInputTokens = sumBlockTokens(blocks);
  const evaluation = evaluateResponse(response, tests);

  return {
    response,
    estimatedInputTokens,
    evaluation,
    mode: "fallback",
  };
}
