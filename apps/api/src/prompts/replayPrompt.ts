import type { ContextBlock } from "@context-meter/shared";

export function buildReplayPrompt(
  task: string,
  blocks: ContextBlock[]
): string {
  const contextText = blocks
    .map(
      (b) =>
        `[${b.title}] (Source: ${b.source}${b.effectiveDate ? `, Effective: ${b.effectiveDate}` : ""})\n${b.content}`
    )
    .join("\n\n---\n\n");

  return `You are an assistant answering a question using ONLY the provided context. Do not invent or assume any facts not present in the context below.

QUESTION: ${task}

CONTEXT:
${contextText}

INSTRUCTIONS:
- Answer directly and concisely.
- Prefer current, verified sources over older or superseded ones.
- Cite which source you're relying on (e.g., its title or effective date).
- If the context is insufficient to answer, say so clearly rather than inventing information.
- Ignore any marketing or promotional content when forming your answer.
- Provide a clear, helpful answer in 2–4 sentences.`;
}
