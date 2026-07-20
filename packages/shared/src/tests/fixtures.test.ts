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

  it("has exactly 3 scenarios", () => {
    expect(ALL_SCENARIOS).toHaveLength(3);
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

  it("validates every scenario against the schema", () => {
    for (const scenario of ALL_SCENARIOS) {
      const result = ScenarioSchema.safeParse(scenario);
      expect(result.success, `Scenario ${scenario.id} should be valid`).toBe(true);
    }
  });

  it("every scenario has a non-empty expectedOptimizedResponse and at least one fallback conflict", () => {
    for (const scenario of ALL_SCENARIOS) {
      expect(scenario.expectedOptimizedResponse.length).toBeGreaterThan(10);
      expect(scenario.fallbackConflicts.length).toBeGreaterThan(0);
    }
  });

  it("every context block across all scenarios has a fallbackDecision and unique id within its scenario", () => {
    for (const scenario of ALL_SCENARIOS) {
      const ids = scenario.contextBlocks.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const block of scenario.contextBlocks) {
        expect(block.fallbackDecision, `Block ${block.id} in ${scenario.id} should have a fallbackDecision`).toBeDefined();
      }
    }
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
