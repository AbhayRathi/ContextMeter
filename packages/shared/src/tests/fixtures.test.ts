import { describe, it, expect } from "vitest";
import {
  BANKING_CONTEXT_BLOCKS,
  BANKING_BASELINE_RESPONSE,
  BANKING_SCENARIO,
  ALL_SCENARIOS,
} from "../fixtures.js";
import { ContextBlockSchema, ScenarioSchema } from "../schemas.js";
import { estimateTokens, sumTokens } from "../evaluation.js";

describe("fixtures", () => {
  it("validates all banking context blocks against schema", () => {
    for (const block of BANKING_CONTEXT_BLOCKS) {
      const result = ContextBlockSchema.safeParse(block);
      expect(result.success, `Block ${block.id} should be valid`).toBe(true);
    }
  });

  it("has exactly 6 context blocks", () => {
    expect(BANKING_CONTEXT_BLOCKS).toHaveLength(6);
  });

  it("validates the banking scenario", () => {
    const result = ScenarioSchema.safeParse(BANKING_SCENARIO);
    expect(result.success).toBe(true);
  });

  it("has non-empty baseline response", () => {
    expect(BANKING_BASELINE_RESPONSE.length).toBeGreaterThan(10);
  });

  it("all scenarios have unique IDs", () => {
    const ids = ALL_SCENARIOS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("context blocks have unique IDs", () => {
    const ids = BANKING_CONTEXT_BLOCKS.map((b) => b.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("tokenEstimator", () => {
  it("estimates tokens correctly", () => {
    expect(estimateTokens("hello")).toBe(2); // ceil(5/4)=2
    expect(estimateTokens("abcd")).toBe(1); // ceil(4/4)=1
    expect(estimateTokens("abcde")).toBe(2); // ceil(5/4)=2
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("sums tokens from blocks", () => {
    const blocks = [{ estimatedTokens: 10 }, { estimatedTokens: 20 }];
    expect(sumTokens(blocks)).toBe(30);
  });
});
