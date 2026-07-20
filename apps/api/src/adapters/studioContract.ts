import type {
  ContextBlock,
  ContextConflict,
  ContextDecision,
  EvaluationSummary,
  Scenario,
} from "@context-meter/shared";
import type { EvaluationTest } from "@context-meter/shared";

/**
 * Maps this backend's internal domain shapes to the exact wire contract the
 * studio-web frontend expects (contextmeter-frontend-unpacked/src/types.ts).
 * Keeping this mapping in one place means fixtures.ts stays the single
 * source of truth for scenario content, independent of frontend field names.
 */

type WirePriority = "Critical" | "High" | "Medium" | "Low";

export interface WireContextBlock {
  id: string;
  title: string;
  category: string;
  source: string;
  effectiveDate: string;
  priority: WirePriority;
  verified: boolean;
  content: string;
  estimatedTokens: number;
  supersededStatus?: string;
  recommendedAction?: ContextDecision["action"];
  recommendationReason?: string;
  riskIfRemoved?: string;
}

export interface WireScenario {
  id: string;
  name: string;
  category: string;
  riskType: string;
  customerRequest: string;
  traceId: string;
  modelName: string;
  timestamp: string;
  baselineResponse: string;
  contextBlocks: WireContextBlock[];
}

export interface WireContextDecision {
  contextBlockId: string;
  recommendedAction: ContextDecision["action"];
  recommendationReason: string;
  riskIfRemoved: string;
}

export interface WireConflictBlockInfo {
  id: string;
  source: string;
  value: string;
  isNewer: boolean;
  verified: boolean;
}

export interface WireContextConflict {
  id: string;
  title: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
  blockA: WireConflictBlockInfo;
  blockB: WireConflictBlockInfo;
}

export interface WireEvaluationResult {
  id: string;
  label: string;
  passed: boolean;
  explanation: string;
  baselineResult: string;
  optimizedResult: string;
}

export interface WireEvaluationSummary {
  passed: number;
  total: number;
  score: number;
  results: WireEvaluationResult[];
}

function priorityDisplay(priority: ContextBlock["priority"]): WirePriority {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "low":
      return "Low";
    case "medium":
    default:
      return "Medium";
  }
}

function categoryDisplay(block: ContextBlock): string {
  switch (block.category) {
    case "policy":
      return block.supersededStatus ? "Legacy Knowledge Base" : "Policy Registry";
    case "customer_profile":
      return "Customer Record (CRM)";
    case "account_history":
      return "Account History";
    case "conversation":
      return "Session Log";
    case "marketing":
      return "Marketing Registry";
    case "retrieval":
      return "Knowledge Base";
    case "tool_output":
      return "Tool Output";
    case "other":
    default:
      return "Other";
  }
}

function severityDisplay(severity: ContextConflict["severity"]): "High" | "Medium" | "Low" {
  return (severity.charAt(0) + severity.slice(1).toLowerCase()) as "High" | "Medium" | "Low";
}

export function toWireContextBlock(block: ContextBlock): WireContextBlock {
  return {
    id: block.id,
    title: block.title,
    category: categoryDisplay(block),
    source: block.source,
    effectiveDate: block.effectiveDate ?? "",
    priority: priorityDisplay(block.priority),
    verified: block.verified,
    content: block.content,
    estimatedTokens: block.estimatedTokens,
    supersededStatus: block.supersededStatus,
  };
}

export function toWireScenario(scenario: Scenario): WireScenario {
  return {
    id: scenario.id,
    name: scenario.title,
    category: scenario.category,
    riskType: scenario.riskType,
    customerRequest: scenario.customerTask,
    traceId: scenario.traceId,
    modelName: scenario.modelName,
    timestamp: scenario.timestamp,
    baselineResponse: scenario.baselineResponse,
    contextBlocks: scenario.contextBlocks.map(toWireContextBlock),
  };
}

export function toWireDecision(decision: ContextDecision): WireContextDecision {
  return {
    contextBlockId: decision.blockId,
    recommendedAction: decision.action,
    recommendationReason: decision.reason,
    riskIfRemoved: decision.riskIfRemoved ?? decision.reason,
  };
}

export function toWireConflict(
  conflict: ContextConflict,
  blocksById: Map<string, ContextBlock>
): WireContextConflict {
  const [newerId, olderId] = conflict.blockIds;
  const newerBlock = newerId ? blocksById.get(newerId) : undefined;
  const olderBlock = olderId ? blocksById.get(olderId) : undefined;

  return {
    id: conflict.id,
    title: conflict.title,
    severity: severityDisplay(conflict.severity),
    recommendation: conflict.resolution,
    blockA: {
      id: newerId ?? "",
      source: newerBlock?.source ?? "",
      value: conflict.blockAValue,
      isNewer: true,
      verified: newerBlock?.verified ?? true,
    },
    blockB: {
      id: olderId ?? "",
      source: olderBlock?.source ?? "",
      value: conflict.blockBValue,
      isNewer: false,
      verified: olderBlock?.verified ?? true,
    },
  };
}

export function toWireEvaluationSummary(
  summary: EvaluationSummary,
  tests: EvaluationTest[]
): WireEvaluationSummary {
  const testsById = new Map(tests.map((t) => [t.id, t]));

  return {
    passed: summary.passed,
    total: summary.total,
    score: Math.round(summary.score * 100),
    results: summary.results.map((r) => {
      const test = testsById.get(r.id);
      return {
        id: r.id,
        label: r.label,
        passed: r.passed,
        explanation: r.explanation,
        baselineResult: test?.baselineResult ?? "FAILED",
        optimizedResult: test?.resultLabel ? test.resultLabel(r.passed) : r.passed ? "PASSED" : "FAILED",
      };
    }),
  };
}
