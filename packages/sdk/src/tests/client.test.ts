import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextBlock } from "@context-meter/shared";
import { ContextMeterClient } from "../client.js";

const block: ContextBlock = {
  id: "b1",
  title: "Test Block",
  category: "policy",
  content: "content",
  source: "test",
  estimatedTokens: 10,
  verified: true,
};

describe("ContextMeterClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/analyze and returns the adapted response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        decisions: [],
        conflicts: [],
        optimizedContextIds: ["b1"],
        summary: "ok",
        baselineEstimatedTokens: 10,
        optimizedEstimatedTokens: 10,
        mode: "fallback",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ContextMeterClient({ baseUrl: "http://localhost:8080" });
    const result = await client.analyze("task", [block]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/analyze",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.mode).toBe("fallback");
  });

  it("strips a trailing slash from baseUrl", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ContextMeterClient({ baseUrl: "http://localhost:8080/" });
    await client.analyzeHeuristic("task", [block]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/analyze/heuristic",
      expect.anything()
    );
  });

  it("sends an Authorization header when an apiKey is set, and omits it otherwise", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ContextMeterClient({ baseUrl: "http://localhost:8080", apiKey: "secret" });
    await client.replay("task", [block]);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret");

    const noKeyClient = new ContextMeterClient({ baseUrl: "http://localhost:8080" });
    await noKeyClient.replay("task", [block]);
    const [, noKeyInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect((noKeyInit.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("throws with the status code on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" })
    );
    const client = new ContextMeterClient({ baseUrl: "http://localhost:8080" });
    await expect(client.analyzeHeuristic("task", [block])).rejects.toThrow(/500/);
  });

  it("lint() drops REMOVE-decisioned blocks before replaying", async () => {
    const kept = block;
    const removed: ContextBlock = { ...block, id: "b2" };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decisions: [
            { blockId: "b1", action: "KEEP", reason: "relevant", risk: "LOW" },
            { blockId: "b2", action: "REMOVE", reason: "stale", risk: "HIGH" },
          ],
          conflicts: [],
          optimizedContextIds: ["b1"],
          summary: "ok",
          baselineEstimatedTokens: 20,
          optimizedEstimatedTokens: 10,
          mode: "heuristic",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: "answer",
          estimatedInputTokens: 10,
          evaluation: { passed: 1, total: 1, score: 100, results: [] },
          mode: "heuristic",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new ContextMeterClient({ baseUrl: "http://localhost:8080" });
    const result = await client.lint("task", [kept, removed]);

    const [, replayInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const replayBody = JSON.parse(replayInit.body as string) as {
      selectedContextBlocks: ContextBlock[];
    };
    expect(replayBody.selectedContextBlocks).toHaveLength(1);
    expect(replayBody.selectedContextBlocks[0]?.id).toBe("b1");
    expect(result.evaluation.score).toBe(100);
    expect(result.response).toBe("answer");
  });
});
