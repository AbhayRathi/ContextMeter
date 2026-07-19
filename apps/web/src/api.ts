import type {
  Scenario,
  ContextAnalysisResult,
  EvaluationSummary,
  ContextBlock,
} from "@context-meter/shared";

// Normalize the base URL at initialization: strip trailing slash.
// When VITE_API_BASE_URL is not set, paths like /api/scenarios are used directly
// (relative to the current origin via Vite's dev proxy).
const rawBase =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? "";
const API_BASE = rawBase.replace(/\/$/, "");

function apiUrl(path: string): string {
  // path must start with /api/... — API_BASE is either "" or an absolute origin
  return `${API_BASE}${path}`;
}

export interface AnalyzeResponse extends ContextAnalysisResult {
  mode: "gemini" | "fallback";
}

export interface ReplayResponse {
  response: string;
  estimatedInputTokens: number;
  evaluation: EvaluationSummary;
  mode: "gemini" | "fallback";
}

export async function fetchScenario(scenarioId: string): Promise<Scenario> {
  const res = await fetch(apiUrl(`/api/scenarios/${scenarioId}`));
  if (!res.ok) throw new Error(`Failed to load scenario: ${res.status}`);
  return res.json() as Promise<Scenario>;
}

export async function analyzeContext(
  task: string,
  contextBlocks: ContextBlock[]
): Promise<AnalyzeResponse> {
  const res = await fetch(apiUrl("/api/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, contextBlocks }),
  });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status}`);
  return res.json() as Promise<AnalyzeResponse>;
}

export async function replayAgent(
  task: string,
  selectedContextBlocks: ContextBlock[]
): Promise<ReplayResponse> {
  const res = await fetch(apiUrl("/api/replay"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, selectedContextBlocks }),
  });
  if (!res.ok) throw new Error(`Replay failed: ${res.status}`);
  return res.json() as Promise<ReplayResponse>;
}
