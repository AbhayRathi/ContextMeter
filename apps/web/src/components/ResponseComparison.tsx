import React from "react";

interface Props {
  baselineResponse: string;
  optimizedResponse?: string;
}

export function ResponseComparison({
  baselineResponse,
  optimizedResponse,
}: Props): React.ReactElement {
  return (
    <div className="response-grid">
      <div className="response-box baseline">
        <h3>⚠ Baseline (Failed Trace)</h3>
        <p className="response-text">{baselineResponse}</p>
        <p className="response-label">Stored fixture — deterministic failed response</p>
      </div>
      <div className="response-box optimized">
        <h3>✓ Optimized Replay</h3>
        {optimizedResponse ? (
          <p className="response-text">{optimizedResponse}</p>
        ) : (
          <p className="response-text" style={{ color: "#718096", fontStyle: "italic" }}>
            Run "Replay Agent" to see the optimized response.
          </p>
        )}
      </div>
    </div>
  );
}
