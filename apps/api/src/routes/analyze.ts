import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { AnalyzeRequestSchema, inferScenarioId } from "@context-meter/shared";
import { fallbackAnalyze } from "../services/contextAnalyzer.js";
import { generateWithGemini, isGeminiAvailable } from "../services/geminiClient.js";
import { buildAnalyzePrompt } from "../prompts/analyzePrompt.js";
import { ContextAnalysisResultSchema } from "@context-meter/shared";
import { createError } from "../middleware/errorHandler.js";
import { toWireDecision, toWireConflict } from "../adapters/studioContract.js";
import type { ContextBlock, ContextAnalysisResult } from "@context-meter/shared";

const router = Router();

function toWireResponse(
  result: ContextAnalysisResult,
  blocks: ContextBlock[],
  mode: "gemini" | "fallback"
) {
  const blocksById = new Map(blocks.map((b) => [b.id, b]));
  return {
    decisions: result.decisions.map(toWireDecision),
    conflicts: result.conflicts.map((c) => toWireConflict(c, blocksById)),
    optimizedContextIds: result.optimizedContextIds,
    summary: result.summary,
    baselineEstimatedTokens: result.baselineEstimatedTokens,
    optimizedEstimatedTokens: result.optimizedEstimatedTokens,
    mode,
  };
}

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
  // studio-web never sends scenarioId; infer it from the round-tripped block IDs.
  const scenarioId = parsed.data.scenarioId ?? inferScenarioId(contextBlocks);

  if (!isGeminiAvailable()) {
    const result = fallbackAnalyze(scenarioId, contextBlocks);
    return res.json(toWireResponse(result, contextBlocks, "fallback"));
  }

  try {
    const prompt = buildAnalyzePrompt(task, contextBlocks);
    const raw = await generateWithGemini(prompt);

    // Gemini may wrap JSON in a markdown code fence (```json ... ```).
    // Extract the inner content if a fence is present, otherwise use the raw text.
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = (fenceMatch?.[1] ?? raw).trim();

    const jsonParsed: unknown = JSON.parse(jsonStr);
    const validated = ContextAnalysisResultSchema.safeParse(jsonParsed);

    if (!validated.success) {
      console.warn("[analyze] Gemini response failed schema validation, using fallback");
      const result = fallbackAnalyze(scenarioId, contextBlocks);
      return res.json(toWireResponse(result, contextBlocks, "fallback"));
    }

    return res.json(toWireResponse(validated.data, contextBlocks, "gemini"));
  } catch (err) {
    console.warn("[analyze] Gemini call failed, using fallback:", (err as Error).message);
    const result = fallbackAnalyze(scenarioId, contextBlocks);
    return res.json(toWireResponse(result, contextBlocks, "fallback"));
  }
});

export default router;
