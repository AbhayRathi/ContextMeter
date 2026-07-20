import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { MORTGAGE_SCENARIO, CORPORATE_SCENARIO } from "@context-meter/shared";
import type { ContextBlock } from "@context-meter/shared";

const app = createApp();

describe.each([
  { scenario: MORTGAGE_SCENARIO, staleId: "mortgage-2", correctId: "mortgage-1" },
  { scenario: CORPORATE_SCENARIO, staleId: "corp-2", correctId: "corp-1" },
])("fallback analyze + replay for $scenario.id (no scenarioId sent, like studio-web)", ({ scenario, staleId, correctId }) => {
  it("removes the stale block and keeps the current one", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({
        task: scenario.customerTask,
        contextBlocks: scenario.contextBlocks,
      });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    const removedIds = res.body.decisions
      .filter((d: { recommendedAction: string }) => d.recommendedAction === "REMOVE")
      .map((d: { contextBlockId: string }) => d.contextBlockId);
    expect(removedIds).toContain(staleId);
    expect(res.body.optimizedContextIds).toContain(correctId);
    expect(res.body.conflicts.length).toBe(2);
  });

  it("replays the scenario's canned optimized response and passes its own evaluation", async () => {
    const optimizedBlocks = scenario.contextBlocks.filter(
      (b: ContextBlock) => b.fallbackDecision?.action === "KEEP"
    );

    const res = await request(app)
      .post("/api/replay")
      .send({
        task: scenario.customerTask,
        selectedContextBlocks: optimizedBlocks,
      });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(res.body.response).toBe(scenario.expectedOptimizedResponse);
    expect(res.body.evaluation.score).toBe(100);
  });
});
