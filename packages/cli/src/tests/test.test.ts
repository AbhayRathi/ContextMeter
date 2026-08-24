import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTestCommand } from "../commands/test.js";

describe("runTestCommand", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "contextmeter-cli-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  function writeFixture(failOn: Record<string, unknown> = {}): string {
    writeFileSync(
      join(dir, "blocks.json"),
      JSON.stringify([
        {
          id: "b1",
          title: "Block",
          category: "policy",
          content: "content",
          source: "test",
          estimatedTokens: 10,
          verified: true,
        },
      ])
    );
    const configPath = join(dir, "contextmeter.config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        apiUrl: "http://localhost:8080",
        task: "task",
        contextBlocksFile: "./blocks.json",
        failOn,
      })
    );
    return configPath;
  }

  function mockFetch(score: number, conflicts: unknown[] = []) {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decisions: [{ blockId: "b1", action: "KEEP", reason: "ok", risk: "LOW" }],
          conflicts,
          optimizedContextIds: ["b1"],
          summary: "ok",
          baselineEstimatedTokens: 10,
          optimizedEstimatedTokens: 10,
          mode: "heuristic",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: "answer",
          estimatedInputTokens: 10,
          evaluation: { passed: 1, total: 1, score, results: [] },
          mode: "heuristic",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
  }

  it("exits 0 when there are no conflicts and no minScore is set", async () => {
    mockFetch(90);
    const code = await runTestCommand({ config: writeFixture() });
    expect(code).toBe(0);
  });

  it("exits 1 when failOn.conflict is set and a conflict is found", async () => {
    mockFetch(90, [
      {
        id: "c1",
        title: "Conflict",
        description: "d",
        resolution: "r",
        severity: "HIGH",
        blockIds: ["b1"],
        blockAValue: "a",
        blockBValue: "b",
      },
    ]);
    const code = await runTestCommand({ config: writeFixture({ conflict: true }) });
    expect(code).toBe(1);
  });

  it("passes when a conflict is found but failOn.conflict is not set", async () => {
    mockFetch(90, [
      {
        id: "c1",
        title: "Conflict",
        description: "d",
        resolution: "r",
        severity: "HIGH",
        blockIds: ["b1"],
        blockAValue: "a",
        blockBValue: "b",
      },
    ]);
    const code = await runTestCommand({ config: writeFixture() });
    expect(code).toBe(0);
  });

  it("exits 1 when the score is below failOn.minScore", async () => {
    mockFetch(40);
    const code = await runTestCommand({ config: writeFixture({ minScore: 80 }) });
    expect(code).toBe(1);
  });

  it("exits 0 when the score meets failOn.minScore", async () => {
    mockFetch(85);
    const code = await runTestCommand({ config: writeFixture({ minScore: 80 }) });
    expect(code).toBe(0);
  });
});
