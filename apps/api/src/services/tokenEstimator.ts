import type { ContextBlock } from "@context-meter/shared";

/**
 * Approximation: 1 token ≈ 4 characters.
 * Not suitable for billing; use for relative comparison only.
 */
export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateBlockTokens(block: ContextBlock): number {
  return block.estimatedTokens;
}

export function sumBlockTokens(blocks: ContextBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.estimatedTokens, 0);
}
