import type {
  ContextBlock,
  ContextAnalysisResult,
  ContextDecision,
  ContextConflict,
} from "@context-meter/shared";
import { tokenize, jaccardSimilarity, textSimilarity } from "@context-meter/shared";
import { sumBlockTokens } from "./tokenEstimator.js";

/**
 * Pure math / similarity-based analyzer — no fixture lookups, no LLM call.
 * Works on any task + block set, which is what makes it useful as a demo:
 * unlike the canned fallback (which only "knows" the 3 shipped scenarios),
 * this reasons about whatever context blocks are handed to it.
 *
 * Two modes, picked automatically:
 *
 * - **authored** — at least one block carries an explicit `priority`. That's a
 *   deliberate caller signal ("this block is critical / this one is low"), so
 *   the score is a weighted sum of relevance + priority + verified against a
 *   fixed keep threshold. The 3 shipped fixtures are all authored this way.
 *
 * - **inferred** — no block carries a `priority` (every real-world dataset:
 *   RAG retrievals, message history, vector-DB hits never set one). A fixed
 *   additive prior then dominates the score and the analyzer either keeps or
 *   drops *everything*. So instead we rank by relevance **normalised within
 *   the case** (each block's word-overlap similarity to the task, divided by
 *   the strongest such score in the same case) and keep blocks that are at
 *   least `INFERRED_KEEP_FRACTION` as on-topic as the best block, after the
 *   same staleness / duplication penalties.
 *
 * Both modes share the staleness detector (same-category blocks, similar
 * content, different effectiveDate → older one flagged + a conflict emitted)
 * and the duplication detector.
 */
const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 1.0,
  high: 0.8,
  medium: 0.5,
  low: 0.2,
};
const DEFAULT_PRIORITY_WEIGHT = 0.5;
const VERIFIED_WEIGHT = 1.0;
const UNVERIFIED_WEIGHT = 0.3;

// Priority is the strongest signal in practice: fixture authors deliberately mark
// essential-but-low-lexical-overlap blocks (e.g. a customer profile) as critical,
// while relevance-to-task alone under-values them. Verified rarely discriminates
// once most blocks are verified, but still matters when it doesn't.
const RELEVANCE_WEIGHT = 0.25;
const PRIORITY_COEFF = 0.5;
const VERIFIED_COEFF = 0.25;

const STALENESS_SIMILARITY_THRESHOLD = 0.1;
const STALENESS_PENALTY = 0.5;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.25;
const DUPLICATE_PENALTY = 0.4;

const KEEP_THRESHOLD = 0.45;
const BORDERLINE_BAND = 0.15;

// Inferred mode: keep a block if its within-case normalised relevance (best
// block in the case = 1.0) is at least this fraction. 0.4 keeps anything
// meaningfully on-topic while dropping clear filler; tuned against packages/bench.
const INFERRED_KEEP_FRACTION = 0.4;
// If every block in the case is (nearly) equally (ir)relevant by word overlap,
// there's no signal to rank on — keep them all rather than drop them all.
const INFERRED_NO_SIGNAL_SPREAD = 0.02;

function priorityWeight(block: ContextBlock): number {
  return block.priority ? PRIORITY_WEIGHT[block.priority] ?? DEFAULT_PRIORITY_WEIGHT : DEFAULT_PRIORITY_WEIGHT;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function heuristicAnalyze(task: string, blocks: ContextBlock[]): ContextAnalysisResult {
  const taskTokens = tokenize(task);
  const mode: "authored" | "inferred" = blocks.some((b) => b.priority) ? "authored" : "inferred";

  const relevanceById = new Map<string, number>();
  for (const block of blocks) {
    relevanceById.set(
      block.id,
      jaccardSimilarity(tokenize(`${block.title} ${block.content}`), taskTokens)
    );
  }

  const maxRelevance = Math.max(0, ...relevanceById.values());
  const minRelevance = Math.min(...relevanceById.values());
  // In inferred mode with no lexical signal anywhere, fall back to keeping all.
  const inferredHasSignal =
    mode === "inferred" && maxRelevance - minRelevance > INFERRED_NO_SIGNAL_SPREAD;

  const baseScores = new Map<string, number>();
  for (const block of blocks) {
    const relevance = relevanceById.get(block.id) ?? 0;
    let score: number;
    if (mode === "authored") {
      score =
        RELEVANCE_WEIGHT * relevance +
        PRIORITY_COEFF * priorityWeight(block) +
        VERIFIED_COEFF * (block.verified ? VERIFIED_WEIGHT : UNVERIFIED_WEIGHT);
    } else {
      // Normalised within the case: strongest block scores 1.0.
      score = maxRelevance > 0 ? relevance / maxRelevance : 1;
    }
    baseScores.set(block.id, score);
  }

  const stalenessPenalty = new Map<string, number>();
  const duplicationPenalty = new Map<string, number>();
  const stalenessNote = new Map<string, string>();
  const duplicationNote = new Map<string, string>();
  const conflicts: ContextConflict[] = [];
  const staleIds = new Set<string>();

  // Staleness: same-category pairs covering the same topic, older effectiveDate loses.
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]!;
      const b = blocks[j]!;
      if (a.category !== b.category || !a.effectiveDate || !b.effectiveDate) continue;
      if (a.effectiveDate === b.effectiveDate) continue;

      const sim = textSimilarity(a.content, b.content);
      if (sim < STALENESS_SIMILARITY_THRESHOLD) continue;

      const [older, newer] = a.effectiveDate < b.effectiveDate ? [a, b] : [b, a];
      stalenessPenalty.set(older.id, Math.max(stalenessPenalty.get(older.id) ?? 0, STALENESS_PENALTY));
      stalenessNote.set(
        older.id,
        `Superseded by "${newer.title}" (effective ${newer.effectiveDate}), which covers the same topic (similarity ${round2(sim)}).`
      );
      staleIds.add(older.id);

      conflicts.push({
        id: `conflict-${older.id}-${newer.id}`,
        blockIds: [newer.id, older.id],
        title: `${newer.title} vs ${older.title}`,
        blockAValue: newer.content.slice(0, 100),
        blockBValue: older.content.slice(0, 100),
        description: `"${older.title}" (effective ${older.effectiveDate}) and "${newer.title}" (effective ${newer.effectiveDate}) are ${Math.round(sim * 100)}% similar in content but dated differently, indicating one supersedes the other.`,
        resolution: `Prefer "${newer.title}" — it has the later effective date.`,
        severity: sim >= 0.3 ? "HIGH" : "MEDIUM",
      });
    }
  }

  // Duplication: any-category near-identical content; lower-weighted copy loses.
  // Skip pairs already explained by staleness so we don't double-penalize/report.
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]!;
      const b = blocks[j]!;
      if (staleIds.has(a.id) || staleIds.has(b.id)) continue;

      const sim = textSimilarity(a.content, b.content);
      if (sim < DUPLICATE_SIMILARITY_THRESHOLD) continue;

      const [loser, keeper] =
        (baseScores.get(a.id) ?? 0) <= (baseScores.get(b.id) ?? 0) ? [a, b] : [b, a];
      duplicationPenalty.set(loser.id, Math.max(duplicationPenalty.get(loser.id) ?? 0, DUPLICATE_PENALTY));
      duplicationNote.set(
        loser.id,
        `Near-duplicate of "${keeper.title}" (similarity ${round2(sim)}); that block is kept instead.`
      );
    }
  }

  const keepThreshold = mode === "authored" ? KEEP_THRESHOLD : INFERRED_KEEP_FRACTION;

  const decisions: ContextDecision[] = blocks.map((block) => {
    const base = baseScores.get(block.id) ?? 0;
    const penalty = (stalenessPenalty.get(block.id) ?? 0) + (duplicationPenalty.get(block.id) ?? 0);
    const finalScore = Math.max(0, Math.min(1, base - penalty));

    const isStaleOrDup = penalty > 0;
    let action: "KEEP" | "REMOVE";
    if (mode === "inferred" && !inferredHasSignal && !isStaleOrDup) {
      // No way to rank — don't drop everything.
      action = "KEEP";
    } else {
      action = finalScore >= keepThreshold ? "KEEP" : "REMOVE";
    }

    const risk = Math.abs(finalScore - keepThreshold) <= BORDERLINE_BAND ? "MEDIUM" : "LOW";

    const factorNote =
      stalenessNote.get(block.id) ??
      duplicationNote.get(block.id) ??
      (mode === "authored"
        ? `Relevance to task ${round2(relevanceById.get(block.id) ?? 0)}, priority weight ${round2(priorityWeight(block))}, verified: ${block.verified}.`
        : inferredHasSignal
          ? `No caller priority set; ranking by relevance to task. Word-overlap similarity ${round2(relevanceById.get(block.id) ?? 0)}, i.e. ${round2(base)} of the strongest block in this set.`
          : `No caller priority set and every block is about equally on-topic (word-overlap ${round2(relevanceById.get(block.id) ?? 0)}); keeping all — not enough signal to safely drop any.`);

    const scoreClause =
      mode === "inferred" && !inferredHasSignal && !isStaleOrDup
        ? ""
        : ` Score ${round2(finalScore)} ${action === "KEEP" ? "≥" : "<"} keep-threshold ${keepThreshold}.`;

    return {
      blockId: block.id,
      action,
      reason: `${factorNote}${scoreClause}`,
      risk,
    };
  });

  const optimizedContextIds = decisions.filter((d) => d.action === "KEEP").map((d) => d.blockId);
  const optimizedBlocks = blocks.filter((b) => optimizedContextIds.includes(b.id));
  const baselineEstimatedTokens = sumBlockTokens(blocks);
  const optimizedEstimatedTokens = sumBlockTokens(optimizedBlocks);
  const removedCount = blocks.length - optimizedBlocks.length;
  const reduction =
    baselineEstimatedTokens > 0
      ? Math.round((1 - optimizedEstimatedTokens / baselineEstimatedTokens) * 100)
      : 0;

  const summary = `Heuristic (${mode} mode: ${mode === "authored" ? "weighted relevance + caller priority + verified" : "relevance normalised within the request"}, no LLM) analyzed ${blocks.length} context blocks. Removed ${removedCount} block${removedCount === 1 ? "" : "s"}. Detected ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} via same-category content similarity + effective-date comparison. Token usage: ${baselineEstimatedTokens} → ${optimizedEstimatedTokens} (~${reduction}% reduction).`;

  return {
    decisions,
    conflicts,
    optimizedContextIds,
    summary,
    baselineEstimatedTokens,
    optimizedEstimatedTokens,
  };
}
