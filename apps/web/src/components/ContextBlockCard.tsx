import React from "react";
import type { ContextBlock, ContextDecision } from "@context-meter/shared";

interface Props {
  block: ContextBlock;
  decision?: ContextDecision;
}

const actionClass: Record<string, string> = {
  KEEP: "action-keep",
  REMOVE: "action-remove",
  COMPRESS: "action-compress",
  REFRESH: "action-refresh",
};

const badgeClass: Record<string, string> = {
  KEEP: "badge-keep",
  REMOVE: "badge-remove",
  COMPRESS: "badge-compress",
  REFRESH: "badge-refresh",
};

export function ContextBlockCard({ block, decision }: Props): React.ReactElement {
  const action = decision?.action;
  const cardClass = `context-block-card ${action ? actionClass[action] ?? "" : ""}`.trim();
  const badge = action ? badgeClass[action] ?? "badge-unknown" : "badge-unknown";

  return (
    <div className={cardClass}>
      <div className="block-header">
        <span className="block-title">{block.title}</span>
        {action && <span className={`badge ${badge}`}>{action}</span>}
      </div>
      <div className="block-meta">
        Category: {block.category} · Source: {block.source}
        {block.effectiveDate && ` · Effective: ${block.effectiveDate}`}
        {` · ~${block.estimatedTokens} tokens`}
        {` · ${block.verified ? "✓ Verified" : "⚠ Unverified"}`}
      </div>
      {decision?.reason && (
        <div className="block-reason">{decision.reason}</div>
      )}
    </div>
  );
}
