import React, { useState, useCallback, useEffect } from "react";
import type {
  Scenario,
  ContextBlock,
  ContextDecision,
  EvaluationSummary,
} from "@context-meter/shared";
import { MetricCard } from "./components/MetricCard.js";
import { ContextBlockCard } from "./components/ContextBlockCard.js";
import { ResponseComparison } from "./components/ResponseComparison.js";
import { EvaluationPanel } from "./components/EvaluationPanel.js";
import { ConflictPanel } from "./components/ConflictPanel.js";
import {
  fetchScenarios,
  fetchScenario,
  analyzeContext,
  analyzeContextHeuristic,
  replayAgent,
} from "./api.js";
import type { AnalyzeResponse, ReplayResponse, ScenarioSummary } from "./api.js";

type AppState =
  | "INITIAL"
  | "TRACE_LOADED"
  | "ANALYZED"
  | "OPTIMIZATION_APPLIED"
  | "REPLAYED";

export default function App(): React.ReactElement {
  const [state, setState] = useState<AppState>("INITIAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scenarioList, setScenarioList] = useState<ScenarioSummary[]>([]);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [optimizedBlocks, setOptimizedBlocks] = useState<ContextBlock[]>([]);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarioList)
      .catch((e) => setError(`Failed to load scenario list: ${(e as Error).message}`));
  }, []);

  const handleLoadTrace = useCallback(async (scenarioId: string) => {
    setLoading(true);
    clearError();
    try {
      const data = await fetchScenario(scenarioId);
      setScenario(data);
      setState("TRACE_LOADED");
    } catch (e) {
      setError(`Failed to load scenario: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!scenario) return;
    setLoading(true);
    clearError();
    try {
      const data = await analyzeContext(
        scenario.id,
        scenario.customerTask,
        scenario.contextBlocks
      );
      setAnalysis(data);
      setState("ANALYZED");
    } catch (e) {
      setError(`Analysis failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const handleAnalyzeHeuristic = useCallback(async () => {
    if (!scenario) return;
    setLoading(true);
    clearError();
    try {
      const data = await analyzeContextHeuristic(scenario.customerTask, scenario.contextBlocks);
      setAnalysis(data);
      setState("ANALYZED");
    } catch (e) {
      setError(`Heuristic analysis failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const handleApplyOptimization = useCallback(() => {
    if (!scenario || !analysis) return;
    const optimized = scenario.contextBlocks.filter((b) =>
      analysis.optimizedContextIds.includes(b.id)
    );
    setOptimizedBlocks(optimized);
    setState("OPTIMIZATION_APPLIED");
  }, [scenario, analysis]);

  const handleReplay = useCallback(async () => {
    if (!scenario || optimizedBlocks.length === 0) return;
    setLoading(true);
    clearError();
    try {
      const data = await replayAgent(scenario.id, scenario.customerTask, optimizedBlocks);
      setReplay(data);
      setState("REPLAYED");
    } catch (e) {
      setError(`Replay failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [scenario, optimizedBlocks]);

  const handleReset = useCallback(() => {
    setState("INITIAL");
    setScenario(null);
    setAnalysis(null);
    setOptimizedBlocks([]);
    setReplay(null);
    clearError();
  }, []);

  const decisionMap = new Map<string, ContextDecision>(
    (analysis?.decisions ?? []).map((d) => [d.blockId, d])
  );

  const baselineTokens = scenario
    ? scenario.contextBlocks.reduce((s, b) => s + b.estimatedTokens, 0)
    : 0;

  const optimizedTokens = optimizedBlocks.reduce(
    (s, b) => s + b.estimatedTokens,
    0
  );

  const tokenSaving =
    baselineTokens > 0 && optimizedTokens > 0
      ? `−${Math.round((1 - optimizedTokens / baselineTokens) * 100)}%`
      : undefined;

  const evalSummary: EvaluationSummary | null = replay?.evaluation ?? null;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>ContextMeter</h1>
        <p>Know what your AI agent knows—and what it should forget.</p>
        <span className="synthetic-notice">
          ⚠ Synthetic demo data only · Not a real financial, support, or engineering tool
        </span>
      </header>

      {/* Scenario picker */}
      {state === "INITIAL" && (
        <div className="section">
          <h2>Choose a Scenario</h2>
          <div className="controls">
            {scenarioList.map((s) => (
              <button
                key={s.id}
                className="btn btn-primary"
                onClick={() => handleLoadTrace(s.id)}
                disabled={loading}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <button
          className="btn btn-warning"
          onClick={handleAnalyze}
          disabled={loading || state !== "TRACE_LOADED"}
        >
          Analyze Context
        </button>
        <button
          className="btn btn-ghost"
          onClick={handleAnalyzeHeuristic}
          disabled={loading || state !== "TRACE_LOADED"}
          title="Similarity + recency scoring — no LLM, no canned answers"
        >
          Analyze (Heuristic)
        </button>
        <button
          className="btn btn-success"
          onClick={handleApplyOptimization}
          disabled={loading || state !== "ANALYZED"}
        >
          Apply Optimization
        </button>
        <button
          className="btn btn-primary"
          onClick={handleReplay}
          disabled={loading || state !== "OPTIMIZATION_APPLIED"}
        >
          Replay Agent
        </button>
        <button
          className="btn btn-ghost"
          onClick={handleReset}
          disabled={loading || state === "INITIAL"}
        >
          Reset
        </button>
      </div>

      {/* Status */}
      {loading && (
        <div className="status-bar status-loading">⏳ Loading...</div>
      )}
      {error && (
        <div className="status-bar status-error">⚠ {error}</div>
      )}

      {/* Metrics */}
      {scenario && (
        <div className="metrics-grid">
          <MetricCard
            label="Baseline Tokens (est.)"
            value={baselineTokens}
          />
          <MetricCard
            label="Optimized Tokens (est.)"
            value={state === "OPTIMIZATION_APPLIED" || state === "REPLAYED" ? optimizedTokens : "—"}
            subValue={tokenSaving}
          />
          <MetricCard
            label="Baseline Blocks"
            value={scenario.contextBlocks.length}
          />
          <MetricCard
            label="Optimized Blocks"
            value={state === "OPTIMIZATION_APPLIED" || state === "REPLAYED" ? optimizedBlocks.length : "—"}
          />
          <MetricCard
            label="Contradictions"
            value={analysis ? analysis.conflicts.length : "—"}
          />
          <MetricCard
            label="Eval Score"
            value={evalSummary ? `${Math.round(evalSummary.score * 100)}%` : "—"}
          />
        </div>
      )}

      {/* Context Blocks */}
      {scenario && (
        <div className="section">
          <h2>
            Context Blocks ({scenario.contextBlocks.length})
            {analysis && (
              <span className="badge badge-mode" style={{ marginLeft: 8 }}>
                mode: {analysis.mode}
              </span>
            )}
          </h2>
          <div className="context-blocks">
            {scenario.contextBlocks.map((block) => (
              <ContextBlockCard
                key={block.id}
                block={block}
                decision={decisionMap.get(block.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {analysis && analysis.conflicts.length > 0 && (
        <div className="section">
          <h2>Conflicts ({analysis.conflicts.length})</h2>
          <ConflictPanel
            conflicts={analysis.conflicts}
            allBlocks={scenario?.contextBlocks ?? []}
          />
        </div>
      )}

      {/* Response Comparison */}
      {scenario && (
        <div className="section">
          <h2>Response Comparison</h2>
          <ResponseComparison
            baselineResponse={scenario.baselineResponse}
            optimizedResponse={replay?.response}
          />
        </div>
      )}

      {/* Evaluation */}
      {evalSummary && (
        <div className="section">
          <h2>Evaluation Results</h2>
          <EvaluationPanel evaluation={evalSummary} />
        </div>
      )}
    </div>
  );
}
