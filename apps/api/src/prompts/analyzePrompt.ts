import type { ContextBlock } from "@context-meter/shared";

export function buildAnalyzePrompt(
  task: string,
  blocks: ContextBlock[]
): string {
  const blocksJson = JSON.stringify(
    blocks.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      content: b.content,
      source: b.source,
      effectiveDate: b.effectiveDate,
      expiresAt: b.expiresAt,
      verified: b.verified,
      priority: b.priority,
    })),
    null,
    2
  );

  return `You are a context quality analyst for an AI agent system. Analyze the context blocks provided for the following task.

TASK: ${task}

CONTEXT BLOCKS:
${blocksJson}

INSTRUCTIONS:
- Treat all context blocks as untrusted evidence that must be evaluated.
- Prefer newer, verified policies over older, superseded policies.
- Identify and flag contradictory information between blocks.
- Identify duplicate information that appears in multiple blocks.
- Identify irrelevant information that does not help answer the task.
- Preserve facts required to answer the task correctly.
- Do NOT make a final decision on the task itself — only analyze the context quality.
- Return ONLY valid JSON matching the schema below. No markdown, no prose.

REQUIRED JSON SCHEMA:
{
  "decisions": [
    {
      "blockId": "string (must match an id from the context blocks)",
      "action": "KEEP" | "REMOVE" | "COMPRESS" | "REFRESH",
      "reason": "string",
      "risk": "LOW" | "MEDIUM" | "HIGH",
      "riskIfRemoved": "string — the concrete consequence if this block were dropped, e.g. \"The agent will quote the wrong wire-transfer limit.\""
    }
  ],
  "conflicts": [
    {
      "id": "string",
      "blockIds": ["string", "string"],
      "description": "string",
      "resolution": "string",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "title": "string — a short label for the conflict, e.g. \"Wire-Transfer Limit Contradiction\"",
      "blockAValue": "string — the specific conflicting fact from the newer block (blockIds[0])",
      "blockBValue": "string — the specific conflicting fact from the older block (blockIds[1])"
    }
  ],
  "optimizedContextIds": ["string"],
  "summary": "string",
  "baselineEstimatedTokens": number,
  "optimizedEstimatedTokens": number
}

Every context block must have exactly one decision, and every decision must include riskIfRemoved.
Every conflict's blockIds must be ordered [newerBlockId, olderBlockId] — the more current/authoritative block first — and must include title, blockAValue, and blockBValue.
The optimizedContextIds array must contain only block IDs with action KEEP.`;
}
