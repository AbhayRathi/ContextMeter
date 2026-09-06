import { describe, expect, it } from "vitest";
import { toBenchCase } from "../sources/ragbench.js";
import type { RagbenchRow } from "../sources/ragbench.js";

describe("toBenchCase", () => {
  it("rolls sentence-level relevance keys up to document-level ground truth", () => {
    const row: RagbenchRow = {
      id: "row-1",
      question: "What team did he play for?",
      documents: ["doc about something else", "doc mentioning the team", "another irrelevant doc"],
      response: "The answer.",
      dataset_name: "hotpotqa",
      all_relevant_sentence_keys: ["1a", "1b"],
    };

    const c = toBenchCase(row, "hotpotqa");

    expect(c.contextBlocks).toHaveLength(3);
    expect(c.groundTruth.relevantBlockIds).toEqual(["row-1-doc1"]);
    expect(c.task).toBe(row.question);
    expect(c.groundTruth.referenceLabel).toBe(row.response);
    expect(c.datasetTag).toBe("hotpotqa");
  });

  it("produces no relevant blocks when there are no relevant sentence keys", () => {
    const row: RagbenchRow = {
      id: "row-2",
      question: "Q",
      documents: ["a", "b"],
      response: "R",
      dataset_name: "finqa",
      all_relevant_sentence_keys: [],
    };
    const c = toBenchCase(row, "finqa");
    expect(c.groundTruth.relevantBlockIds).toEqual([]);
  });
});
