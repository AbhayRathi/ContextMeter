import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { ReplayRequestSchema, evaluateResponse } from "@context-meter/shared";
import { fallbackReplay } from "../services/replayService.js";
import { generateWithGemini, isGeminiAvailable } from "../services/geminiClient.js";
import { buildReplayPrompt } from "../prompts/replayPrompt.js";
import { sumBlockTokens } from "../services/tokenEstimator.js";
import { createError } from "../middleware/errorHandler.js";

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

  if (!isGeminiAvailable()) {
    const result = fallbackReplay(selectedContextBlocks);
    return res.json(result);
  }

  try {
    const prompt = buildReplayPrompt(task, selectedContextBlocks);
    const response = await generateWithGemini(prompt);
    const estimatedInputTokens = sumBlockTokens(selectedContextBlocks);
    const evaluation = evaluateResponse(response);

    return res.json({
      response,
      estimatedInputTokens,
      evaluation,
      mode: "gemini",
    });
  } catch (err) {
    console.warn("[replay] Gemini call failed, using fallback:", (err as Error).message);
    const result = fallbackReplay(selectedContextBlocks);
    return res.json(result);
  }
});

export default router;
