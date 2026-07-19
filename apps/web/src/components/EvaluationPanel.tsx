import React from "react";
import type { EvaluationSummary } from "@context-meter/shared";

interface Props {
  evaluation: EvaluationSummary;
}

export function EvaluationPanel({ evaluation }: Props): React.ReactElement {
  const scorePercent = Math.round(evaluation.score * 100);

  return (
    <div>
      <div className="metrics-grid" style={{ marginBottom: 16 }}>
        <div className="metric-card">
          <div className="label">Score</div>
          <div className="value">{scorePercent}%</div>
        </div>
        <div className="metric-card">
          <div className="label">Passed</div>
          <div className="value">{evaluation.passed}/{evaluation.total}</div>
        </div>
      </div>
      <div className="eval-results">
        {evaluation.results.map((r) => (
          <div key={r.id} className="eval-item">
            <span className="eval-icon">{r.passed ? "✅" : "❌"}</span>
            <div className="eval-content">
              <div className={`eval-label ${r.passed ? "passed" : "failed"}`}>{r.label}</div>
              <div className="eval-explanation">{r.explanation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
