/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkflowState =
  | 'INITIAL'
  | 'TRACE_LOADING'
  | 'TRACE_LOADED'
  | 'ANALYZING'
  | 'ANALYZED'
  | 'OPTIMIZATION_APPLIED'
  | 'REPLAYING'
  | 'REPLAYED'
  | 'ERROR';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ContextAction = 'KEEP' | 'REMOVE' | 'COMPRESS' | 'REFRESH';

export interface ContextBlock {
  id: string;
  title: string;
  category: string;
  source: string;
  effectiveDate: string;
  priority: PriorityLevel;
  verified: boolean;
  content: string;
  estimatedTokens: number;
  supersededStatus?: string;
  recommendedAction?: ContextAction;
  recommendationReason?: string;
  riskIfRemoved?: string;
}

export interface ContextDecision {
  contextBlockId: string;
  recommendedAction: ContextAction;
  recommendationReason: string;
  riskIfRemoved: string;
}

export interface ConflictBlockInfo {
  id: string;
  source: string;
  value: string;
  isNewer: boolean;
  verified: boolean;
}

export interface ContextConflict {
  id: string;
  title: string; // e.g. "Wire-transfer limit"
  severity: 'High' | 'Medium' | 'Low';
  recommendation: string;
  blockA: ConflictBlockInfo;
  blockB: ConflictBlockInfo;
}

export interface Scenario {
  id: string;
  name: string;
  category: string;
  riskType: string;
  customerRequest: string;
  traceId: string;
  modelName: string;
  timestamp: string;
  baselineResponse: string;
  contextBlocks: ContextBlock[];
}

export interface AnalyzePayload {
  task: string;
  contextBlocks: ContextBlock[];
}

export interface AnalyzeResponse {
  decisions: ContextDecision[];
  conflicts: ContextConflict[];
  optimizedContextIds: string[];
  summary: string;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  mode: 'gemini' | 'fallback';
}

export interface ReplayPayload {
  task: string;
  selectedContextBlocks: ContextBlock[];
}

export interface EvaluationResult {
  id: string;
  label: string;
  passed: boolean;
  explanation: string;
  baselineResult: string;
  optimizedResult: string;
}

export interface ReplayResponse {
  response: string;
  estimatedInputTokens: number;
  evaluation: {
    passed: number;
    total: number;
    score: number; // 0 to 100
    results: EvaluationResult[];
  };
  mode: 'gemini' | 'fallback';
}
