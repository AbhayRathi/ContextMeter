import { z } from "zod";

export const ContextCategorySchema = z.enum([
  "policy",
  "customer_profile",
  "account_history",
  "conversation",
  "retrieval",
  "marketing",
  "tool_output",
  "other",
]);

export const ContextBlockSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: ContextCategorySchema,
  content: z.string(),
  source: z.string(),
  effectiveDate: z.string().optional(),
  expiresAt: z.string().optional(),
  estimatedTokens: z.number().int().nonnegative(),
  verified: z.boolean(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export const ContextActionSchema = z.enum(["KEEP", "REMOVE", "COMPRESS", "REFRESH"]);

export const ContextDecisionSchema = z.object({
  blockId: z.string(),
  action: ContextActionSchema,
  reason: z.string(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const ContextConflictSchema = z.object({
  id: z.string(),
  blockIds: z.array(z.string()),
  description: z.string(),
  resolution: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const ContextAnalysisResultSchema = z.object({
  decisions: z.array(ContextDecisionSchema),
  conflicts: z.array(ContextConflictSchema),
  optimizedContextIds: z.array(z.string()),
  summary: z.string(),
  baselineEstimatedTokens: z.number().int().nonnegative(),
  optimizedEstimatedTokens: z.number().int().nonnegative(),
});

export const AnalyzeRequestSchema = z.object({
  task: z.string().min(1).max(2000),
  contextBlocks: z.array(ContextBlockSchema).min(1).max(50),
});

export const ReplayRequestSchema = z.object({
  task: z.string().min(1).max(2000),
  selectedContextBlocks: z.array(ContextBlockSchema).min(1).max(50),
});

export const EvaluationResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  passed: z.boolean(),
  explanation: z.string(),
});

export const EvaluationSummarySchema = z.object({
  passed: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  score: z.number().min(0).max(1),
  results: z.array(EvaluationResultSchema),
});

export const AnalyzeResponseSchema = ContextAnalysisResultSchema.extend({
  mode: z.enum(["gemini", "fallback"]),
});

export const ReplayResponseSchema = z.object({
  response: z.string(),
  estimatedInputTokens: z.number().int().nonnegative(),
  evaluation: EvaluationSummarySchema,
  mode: z.enum(["gemini", "fallback"]),
});

export const ScenarioSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  customerTask: z.string(),
  contextBlocks: z.array(ContextBlockSchema),
  baselineResponse: z.string(),
  expectedOptimizedFacts: z.array(z.string()),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});
