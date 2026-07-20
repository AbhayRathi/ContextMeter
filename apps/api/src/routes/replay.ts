import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  ReplayRequestSchema,
  evaluateResponse,
  EVALUATION_TESTS_BY_SCENARIO,
  BANKING_EVALUATION_TESTS,
  inferScenarioId,
} from "@context-meter/shared";
import { fallbackReplay } from "../services/replayService.js";
import { generateWithGemini, isGeminiAvailable } from "../services/geminiClient.js";
import { buildReplayPrompt } from "../prompts/replayPrompt.js";
import { sumBlockTokens } from "../services/tokenEstimator.js";
import { createError } from "../middleware/errorHandler.js";
import { toWireEvaluationSummary } from "../adapters/studioContract.js";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = ReplayRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError(
        "Invalid request body",
        400,
        "VALIDATION_ERROR",
        parsed.error.issues
      )
    );
  }

  const { task, selectedContextBlocks } = parsed.data;
  // studio-web never sends scenarioId; infer it from the round-tripped block IDs.
  const scenarioId = parsed.data.scenarioId ?? inferScenarioId(selectedContextBlocks);
  const tests = (scenarioId !== undefined ? EVALUATION_TESTS_BY_SCENARIO[scenarioId] : undefined) ?? BANKING_EVALUATION_TESTS;

  if (!isGeminiAvailable()) {
    const result = fallbackReplay(scenarioId, selectedContextBlocks);
    return res.json({ ...result, evaluation: toWireEvaluationSummary(result.evaluation, tests) });
  }

  try {
    const prompt = buildReplayPrompt(task, selectedContextBlocks);
    const response = await generateWithGemini(prompt);
    const estimatedInputTokens = sumBlockTokens(selectedContextBlocks);
    const evaluation = evaluateResponse(response, tests);

    return res.json({
      response,
      estimatedInputTokens,
      evaluation: toWireEvaluationSummary(evaluation, tests),
      mode: "gemini",
    });
  } catch (err) {
    console.warn("[replay] Gemini call failed, using fallback:", (err as Error).message);
    const result = fallbackReplay(scenarioId, selectedContextBlocks);
    return res.json({ ...result, evaluation: toWireEvaluationSummary(result.evaluation, tests) });
  }
});

export default router;
