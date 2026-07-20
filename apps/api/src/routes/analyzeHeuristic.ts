import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { HeuristicAnalyzeRequestSchema } from "@context-meter/shared";
import { heuristicAnalyze } from "../services/heuristicAnalyzer.js";
import { createError } from "../middleware/errorHandler.js";

const router = Router();

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  const parsed = HeuristicAnalyzeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(
      createError("Invalid request body", 400, "VALIDATION_ERROR", parsed.error.issues)
    );
  }

  const { task, contextBlocks } = parsed.data;
  const result = heuristicAnalyze(task, contextBlocks);
  return res.json({ ...result, mode: "heuristic" });
});

export default router;
