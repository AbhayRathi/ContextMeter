import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { AnalyzeRequestSchema } from "@context-meter/shared";
import { fallbackAnalyze } from "../services/contextAnalyzer.js";
import { generateWithGemini, isGeminiAvailable } from "../services/geminiClient.js";
import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";
import { ContextAnalysisResultSchema } from "@context-meter/shared";
import { createError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = AnalyzeRequestSchema.safeParse(req.body);
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

  const { task, contextBlocks } = parsed.data;

  if (!isGeminiAvailable()) {
    const result = fallbackAnalyze(contextBlocks);
    return res.json({ ...result, mode: "fallback" });
  }

  try {
    const prompt = buildAnalyzePrompt(task, contextBlocks);
    const raw = await generateWithGemini(prompt);

    // Gemini may wrap JSON in a markdown code fence (```json ... ```).
    // Attempt to extract the inner JSON; fall back to the raw text if no fence is found.
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const jsonStr = jsonMatch[1]?.trim() ?? raw.trim();

    const jsonParsed: unknown = JSON.parse(jsonStr);
    const validated = ContextAnalysisResultSchema.safeParse(jsonParsed);

    if (!validated.success) {
      console.warn("[analyze] Gemini response failed schema validation, using fallback");
      const result = fallbackAnalyze(contextBlocks);
      return res.json({ ...result, mode: "fallback" });
    }

    return res.json({ ...validated.data, mode: "gemini" });
  } catch (err) {
    console.warn("[analyze] Gemini call failed, using fallback:", (err as Error).message);
    const result = fallbackAnalyze(contextBlocks);
    return res.json({ ...result, mode: "fallback" });
  }
});

export default router;
