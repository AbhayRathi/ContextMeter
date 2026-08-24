import { describe, expect, it, vi } from "vitest";
import type { ContextBlock } from "@context-meter/shared";
import { runContextGate } from "../runtime.js";
import type { ContextMeterClient } from "../client.js";
import type { LintResult } from "../wireTypes.js";

const block: ContextBlock = {
  id: "b1",
  title: "Test Block",
  category: "policy",
  content: "content",
  source: "test",
  estimatedTokens: 10,
  verified: true,
};

function makeClient(lintResult: LintResult): ContextMeterClient {
  return { lint: vi.fn().mockResolvedValue(lintResult) } as unknown as ContextMeterClient;
}

function makeLintResult(overrides: Partial<LintResult> = {}): LintResult {
  return {
    decisions: [],
    conflicts: [],
    summary: "ok",
    optimizedEstimatedTokens: 10,
    response: "answer",
    estimatedInputTokens: 10,
    evaluation: { passed: 1, total: 1, score: 100, results: [] },
    ...overrides,
  };
}

describe("runContextGate", () => {
  it("allows by default when no policy is set, even with conflicts and a low score", async () => {
    const client = makeClient(
      makeLintResult({
        conflicts: [{ id: "c1" } as never],
        evaluation: { passed: 0, total: 1, score: 10, results: [] },
      })
    );
    const result = await runContextGate(client, { task: "t", contextBlocks: [block] });

    expect(result.allowed).toBe(true);
    expect(result.failReasons).toEqual([]);
  });

  it("fails when a conflict is found and failOn.conflict is set", async () => {
    const client = makeClient(makeLintResult({ conflicts: [{ id: "c1" } as never] }));
    const result = await runContextGate(
      client,
      { task: "t", contextBlocks: [block] },
      { failOn: { conflict: true } }
    );

    expect(result.allowed).toBe(false);
    expect(result.failReasons).toHaveLength(1);
    expect(result.failReasons[0]).toMatch(/conflict/);
  });

  it("passes when no conflict is found even if failOn.conflict is set", async () => {
    const client = makeClient(makeLintResult({ conflicts: [] }));
    const result = await runContextGate(
      client,
      { task: "t", contextBlocks: [block] },
      { failOn: { conflict: true } }
    );

    expect(result.allowed).toBe(true);
  });

  it("fails when the score is below failOn.minScore", async () => {
    const client = makeClient(
      makeLintResult({ evaluation: { passed: 0, total: 1, score: 40, results: [] } })
    );
    const result = await runContextGate(
      client,
      { task: "t", contextBlocks: [block] },
      { failOn: { minScore: 80 } }
    );

    expect(result.allowed).toBe(false);
    expect(result.failReasons[0]).toMatch(/score/);
  });

  it("reports both reasons when both failOn conditions trigger", async () => {
    const client = makeClient(
      makeLintResult({
        conflicts: [{ id: "c1" } as never],
        evaluation: { passed: 0, total: 1, score: 40, results: [] },
      })
    );
    const result = await runContextGate(
      client,
      { task: "t", contextBlocks: [block] },
      { failOn: { conflict: true, minScore: 80 } }
    );

    expect(result.allowed).toBe(false);
    expect(result.failReasons).toHaveLength(2);
  });

  it("passes the full lint result through unchanged", async () => {
    const client = makeClient(makeLintResult({ summary: "custom summary" }));
    const result = await runContextGate(client, { task: "t", contextBlocks: [block] });

    expect(result.summary).toBe("custom summary");
    expect(result.response).toBe("answer");
  });
});
