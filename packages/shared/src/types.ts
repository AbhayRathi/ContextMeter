// Widened-but-suggested: keeps autocomplete for known internal categories while
// still accepting arbitrary strings — needed because the studio-web wire adapter
// turns these into display strings (e.g. "Policy Registry") that get round-tripped
// straight back into POST /api/analyze and /api/replay on the next request.
export type ContextCategory =
  | "policy"
  | "customer_profile"
  | "account_history"
  | "conversation"
  | "retrieval"
  | "marketing"
  | "tool_output"
  | "other"
  | (string & {});

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
  /** Widened-but-suggested for the same round-trip reason as ContextCategory. */
  priority?: "critical" | "high" | "medium" | "low" | (string & {});
  /** Static flavor text shown on blocks superseded by a newer block, e.g. "Superseded by X (2026)". */
  supersededStatus?: string;
  /**
   * Canned decision used by the deterministic fallback analyzer (no Gemini key)
   * so fallback mode is scenario-agnostic instead of hardcoded per block ID.
   */
  fallbackDecision?: {
    action: ContextAction;
    reason: string;
    /** Free-text consequence of removing this block, e.g. "The agent will hallucinate limits." */
    riskIfRemoved: string;
    risk: "LOW" | "MEDIUM" | "HIGH";
  };
}

export type ContextAction = "KEEP" | "REMOVE" | "COMPRESS" | "REFRESH";

export interface ContextDecision {
  blockId: string;
  action: ContextAction;
  reason: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  /** Free-text consequence of removing this block. Populated in fallback/heuristic mode; may be absent from Gemini responses. */
  riskIfRemoved?: string;
}

export interface ContextConflict {
  id: string;
  /** Ordered [newerBlockId, olderBlockId] — position matters for wire adapters, not just this field. */
  blockIds: string[];
  description: string;
  resolution: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  /** Short label, e.g. "Wire-Transfer Limit Contradiction". */
  title: string;
  /** The specific conflicting fact from the newer block (blockIds[0]), e.g. "Wire-transfer limit is $10,000". */
  blockAValue: string;
  /** The specific conflicting fact from the older block (blockIds[1]), e.g. "Wire-transfer limit is $5,000". */
  blockBValue: string;
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
  /** Conflicts reported by the deterministic fallback analyzer for this scenario. */
  fallbackConflicts: ContextConflict[];
  /** Canned "correct" response used by the deterministic fallback replay (no Gemini key). */
  expectedOptimizedResponse: string;
  /** Display metadata for the studio-web frontend's ScenarioHeader. */
  category: string;
  riskType: string;
  traceId: string;
  modelName: string;
  timestamp: string;
}
