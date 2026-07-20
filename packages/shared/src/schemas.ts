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

export const ContextActionSchema = z.enum(["KEEP", "REMOVE", "COMPRESS", "REFRESH"]);

export const FallbackDecisionSchema = z.object({
  action: ContextActionSchema,
  reason: z.string(),
  riskIfRemoved: z.string(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const ContextBlockSchema = z.object({
  id: z.string(),
  title: z.string(),
  // Accepts either the internal category enum or a studio-web display string
  // (e.g. "Policy Registry") — round-tripped blocks carry whichever the
  // frontend last received, and the request handler doesn't trust this field
  // for logic anyway (it looks up canonical fixture data by scenarioId + id).
  category: z.string(),
  content: z.string(),
  source: z.string(),
  effectiveDate: z.string().optional(),
  expiresAt: z.string().optional(),
  estimatedTokens: z.number().int().nonnegative(),
  verified: z.boolean(),
  priority: z.string().optional(),
  supersededStatus: z.string().optional(),
  fallbackDecision: FallbackDecisionSchema.optional(),
});

export const ContextDecisionSchema = z.object({
  blockId: z.string(),
  action: ContextActionSchema,
  reason: z.string(),
  risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  riskIfRemoved: z.string().optional(),
});

export const ContextConflictSchema = z.object({
  id: z.string(),
  blockIds: z.array(z.string()),
  description: z.string(),
  resolution: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  title: z.string(),
  blockAValue: z.string(),
  blockBValue: z.string(),
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
  // Optional: the studio-web frontend doesn't send this at all, so the
  // fallback engine infers the scenario from the submitted block IDs instead.
  scenarioId: z.string().optional(),
  task: z.string().min(1).max(2000),
  contextBlocks: z.array(ContextBlockSchema).min(1).max(50),
});

export const ReplayRequestSchema = z.object({
  scenarioId: z.string().optional(),
  task: z.string().min(1).max(2000),
  selectedContextBlocks: z.array(ContextBlockSchema).min(1).max(50),
});

// Unlike AnalyzeRequestSchema, no scenarioId — the heuristic engine is generic
// math (similarity + recency scoring) that works on any task + block set,
// not a fixture lookup, so it isn't tied to one of the shipped demo scenarios.
export const HeuristicAnalyzeRequestSchema = z.object({
  task: z.string().min(1).max(2000),
  contextBlocks: z.array(ContextBlockSchema).min(1).max(50),
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
  mode: z.enum(["gemini", "fallback", "heuristic"]),
});

export const ReplayResponseSchema = z.object({
  response: z.string(),
  estimatedInputTokens: z.number().int().nonnegative(),
  evaluation: EvaluationSummarySchema,
  mode: z.enum(["gemini", "fallback", "heuristic"]),
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
  fallbackConflicts: z.array(ContextConflictSchema),
  expectedOptimizedResponse: z.string(),
  category: z.string(),
  riskType: z.string(),
  traceId: z.string(),
  modelName: z.string(),
  timestamp: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});
