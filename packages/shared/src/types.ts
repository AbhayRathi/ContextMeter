export type ContextCategory =
  | "policy"
  | "customer_profile"
  | "account_history"
  | "conversation"
  | "retrieval"
  | "marketing"
  | "tool_output"
  | "other";

export interface ContextBlock {
  id: string;
  title: string;
  category: ContextCategory;
  content: string;
  source: string;
  effectiveDate?: string;
  expiresAt?: string;
  estimatedTokens: number;
  verified: boolean;
  priority?: "critical" | "high" | "medium" | "low";
}

export type ContextAction = "KEEP" | "REMOVE" | "COMPRESS" | "REFRESH";

export interface ContextDecision {
  blockId: string;
  action: ContextAction;
  reason: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
}

export interface ContextConflict {
  id: string;
  blockIds: string[];
  description: string;
  resolution: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface ContextAnalysisResult {
  decisions: ContextDecision[];
  conflicts: ContextConflict[];
  optimizedContextIds: string[];
  summary: string;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
}

export interface EvaluationResult {
  id: string;
  label: string;
  passed: boolean;
  explanation: string;
}

export interface EvaluationSummary {
  passed: number;
  total: number;
  score: number;
  results: EvaluationResult[];
}

export interface Scenario {
  id: string;
  title: string;
  customerTask: string;
  contextBlocks: ContextBlock[];
  baselineResponse: string;
  expectedOptimizedFacts: string[];
}
