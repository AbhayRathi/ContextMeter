import type { ContextBlock } from "@context-meter/shared";
import type {
  AdaptedAnalyzeResponse,
  HeuristicAnalyzeResponse,
  LintResult,
  ReplayResponse,
} from "./wireTypes.js";

export interface ContextMeterClientOptions {
  /** Base URL of a running apps/api instance, e.g. "http://localhost:8080". */
  baseUrl: string;
  /**
   * Sent as `Authorization: Bearer <apiKey>` when set. apps/api has no auth
   * middleware yet, so this is currently a no-op on the server side — it's
   * wired up now so callers don't need to change once real API keys land.
   */
  apiKey?: string;
}

export class ContextMeterClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options: ContextMeterClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
  }

  /** POST /api/analyze — the gemini/fallback engine, scoped to the 3 shipped demo scenarios. */
  async analyze(task: string, contextBlocks: ContextBlock[]): Promise<AdaptedAnalyzeResponse> {
    return this.post<AdaptedAnalyzeResponse>("/api/analyze", { task, contextBlocks });
  }

  /** POST /api/analyze/heuristic — generic similarity/recency scoring, works on any context set. */
  async analyzeHeuristic(
    task: string,
    contextBlocks: ContextBlock[]
  ): Promise<HeuristicAnalyzeResponse> {
    return this.post<HeuristicAnalyzeResponse>("/api/analyze/heuristic", { task, contextBlocks });
  }

  /** POST /api/replay */
  async replay(task: string, selectedContextBlocks: ContextBlock[]): Promise<ReplayResponse> {
    return this.post<ReplayResponse>("/api/replay", { task, selectedContextBlocks });
  }

  /**
   * Convenience call for the CLI/middleware/MCP surfaces: runs the heuristic
   * analyzer, drops every block it marked REMOVE, then replays with what's
   * left. One round-trip through the engine instead of three separate calls.
   */
  async lint(task: string, contextBlocks: ContextBlock[]): Promise<LintResult> {
    const analysis = await this.analyzeHeuristic(task, contextBlocks);
    const removedIds = new Set(
      analysis.decisions.filter((d) => d.action === "REMOVE").map((d) => d.blockId)
    );
    const selectedContextBlocks = contextBlocks.filter((b) => !removedIds.has(b.id));
    const replay = await this.replay(task, selectedContextBlocks);

    return {
      decisions: analysis.decisions,
      conflicts: analysis.conflicts,
      summary: analysis.summary,
      optimizedEstimatedTokens: analysis.optimizedEstimatedTokens,
      response: replay.response,
      estimatedInputTokens: replay.estimatedInputTokens,
      evaluation: replay.evaluation,
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`ContextMeter request to ${path} failed: ${res.status} ${text}`);
    }

    return (await res.json()) as T;
  }
}
