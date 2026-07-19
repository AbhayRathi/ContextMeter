import React from "react";
import type { ContextConflict, ContextBlock } from "@context-meter/shared";

interface Props {
  conflicts: ContextConflict[];
  allBlocks: ContextBlock[];
}

function severityClass(severity: string): string {
  if (severity === "HIGH") return "severity-high";
  if (severity === "MEDIUM") return "severity-medium";
  return "severity-low";
}

export function ConflictPanel({ conflicts, allBlocks }: Props): React.ReactElement {
  if (conflicts.length === 0) {
    return <p style={{ color: "#718096", fontStyle: "italic" }}>No conflicts detected.</p>;
  }

  return (
    <div className="conflict-list">
      {conflicts.map((c) => {
        const titles = c.blockIds.map(
          (id) => allBlocks.find((b) => b.id === id)?.title ?? id
        );
        return (
          <div key={c.id} className="conflict-item">
            <div className="conflict-header">
              <strong>{titles.join(" ↔ ")}</strong>
              <span className={`badge ${severityClass(c.severity)}`}>{c.severity}</span>
            </div>
            <p className="conflict-desc">{c.description}</p>
            <p className="conflict-resolution">Resolution: {c.resolution}</p>
          </div>
        );
      })}
    </div>
  );
}
