import { estimateTokens } from "@context-meter/shared";
import type { ContextBlock } from "@context-meter/shared";
import { fetchHfRows } from "../hf.js";
import type { BenchCase } from "../types.js";

/**
 * RAGBench (galileo-ai/ragbench on HuggingFace, CC-BY-4.0 license; renamed
 * from rungalileo/ragbench): ~100k real RAG examples across 12 source
 * datasets/domains, each with the retrieved documents and human/model
 * relevance annotations at sentence granularity.
 * https://huggingface.co/datasets/galileo-ai/ragbench
 *
 * `all_relevant_sentence_keys` labels which sentences (formatted "{docIndex}{letter}",
 * e.g. "2a") were actually needed to produce the reference response — we roll
 * that up to document granularity (a document is relevant if any of its
 * sentences is) to get real, independently-authored ground truth for
 * KEEP/REMOVE decisions. Unlike DRUID, relevance here is genuinely mixed
 * (documents are retrieved candidates, not pre-filtered), so precision/recall
 * on this source actually discriminates a good analyzer from "keep everything."
 */
const DATASET = "galileo-ai/ragbench";
const SPLIT = "test";
export const DEFAULT_RAGBENCH_SUBSETS = ["hotpotqa", "finqa", "covidqa"];

export interface RagbenchRow {
  id: string;
  question: string;
  documents: string[];
  response: string;
  dataset_name: string;
  all_relevant_sentence_keys: string[];
}

export async function loadRagbenchCases(
  limit: number,
  subsets: string[] = DEFAULT_RAGBENCH_SUBSETS
): Promise<BenchCase[]> {
  const perSubset = Math.ceil(limit / subsets.length);
  const cases: BenchCase[] = [];

  for (const subset of subsets) {
    const rows = await fetchHfRows<RagbenchRow>(DATASET, subset, SPLIT, perSubset);
    for (const row of rows) {
      if (row.documents.length === 0) continue;
      cases.push(toBenchCase(row, subset));
      if (cases.length >= limit) return cases;
    }
  }

  return cases;
}

/** Pure row -> BenchCase mapping, split out so it's unit-testable without network. */
export function toBenchCase(row: RagbenchRow, subset: string): BenchCase {
  const docIds = row.documents.map((_, i) => `${row.id}-doc${i}`);

  const contextBlocks: ContextBlock[] = row.documents.map((content, i) => ({
    id: docIds[i]!,
    title: `Document ${i + 1}`,
    category: "retrieval",
    content,
    source: `RAGBench/${subset}`,
    estimatedTokens: estimateTokens(content),
    verified: true,
  }));

  const relevantDocIndices = new Set(
    row.all_relevant_sentence_keys
      .map((key) => parseInt(/^(\d+)/.exec(key)?.[1] ?? "", 10))
      .filter((n) => Number.isInteger(n))
  );
  const relevantBlockIds = [...relevantDocIndices]
    .filter((i) => i >= 0 && i < docIds.length)
    .map((i) => docIds[i]!);

  return {
    id: row.id,
    source: "ragbench",
    datasetTag: subset,
    task: row.question,
    contextBlocks,
    groundTruth: {
      relevantBlockIds,
      referenceLabel: row.response,
    },
  };
}
