const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "to", "of", "in", "on", "for", "with", "at", "by", "from", "as", "it", "its",
  "this", "that", "these", "those", "we", "you", "your", "our", "i", "my",
  "can", "will", "would", "should", "could", "do", "does", "did", "has", "have",
  "had", "not", "no", "if", "so", "than", "then", "what", "when", "where",
  "which", "who", "all", "any", "per", "under", "over", "into", "about",
]);

/** Lowercases, strips punctuation, splits on whitespace, drops stopwords and empty tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Jaccard similarity between two token lists: |intersection| / |union|, in [0, 1]. */
export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Convenience wrapper: Jaccard similarity directly between two raw strings. */
export function textSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}
