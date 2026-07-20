import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { BANKING_CONTEXT_BLOCKS } from "@context-meter/shared";

const app = createApp();

describe("POST /api/analyze", () => {
  // Mirrors exactly what studio-web sends: no scenarioId at all.
  const validBody = {
    task: "Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?",
    contextBlocks: BANKING_CONTEXT_BLOCKS,
  };

  it("returns 200 with fallback analysis in mock mode, inferring the scenario from block IDs", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(res.body.decisions).toBeInstanceOf(Array);
    expect(res.body.conflicts).toBeInstanceOf(Array);
    expect(res.body.optimizedContextIds).toBeInstanceOf(Array);
    expect(res.body.baselineEstimatedTokens).toBeGreaterThan(0);
    expect(res.body.optimizedEstimatedTokens).toBeGreaterThan(0);
    expect(res.body.optimizedEstimatedTokens).toBeLessThan(res.body.baselineEstimatedTokens);
  });

  it("removes stale and irrelevant blocks, using the studio-web decision field names", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    const removedIds = res.body.decisions
      .filter((d: { recommendedAction: string }) => d.recommendedAction === "REMOVE")
      .map((d: { contextBlockId: string }) => d.contextBlockId);
    expect(removedIds).toContain("block-2");
    expect(removedIds).toContain("block-5");
    expect(removedIds).toContain("block-6");

    const kept = res.body.decisions.find((d: { contextBlockId: string }) => d.contextBlockId === "block-1");
    expect(kept.recommendedAction).toBe("KEEP");
    expect(kept.riskIfRemoved).toBeTruthy();
  });

  it("identifies conflicts in the blockA/blockB studio-web shape", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    expect(res.body.conflicts.length).toBe(2);
    const conflict = res.body.conflicts[0];
    expect(conflict.severity).toBe("High");
    expect(conflict.blockA.isNewer).toBe(true);
    expect(conflict.blockB.isNewer).toBe(false);
    expect(conflict.blockA.value).toBeTruthy();
    expect(conflict.blockB.value).toBeTruthy();
  });

  it("still accepts an explicit scenarioId (backward compatible)", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({ ...validBody, scenarioId: "banking-policy-conflict" });
    expect(res.status).toBe(200);
    expect(res.body.conflicts.length).toBe(2);
  });

  it("returns 400 for missing task", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({ contextBlocks: BANKING_CONTEXT_BLOCKS });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty contextBlocks", async () => {
    const res = await request(app)
      .post("/api/analyze")
      .send({ task: "test", contextBlocks: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("validates response schema", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    expect(res.body).toHaveProperty("decisions");
    expect(res.body).toHaveProperty("conflicts");
    expect(res.body).toHaveProperty("optimizedContextIds");
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("baselineEstimatedTokens");
    expect(res.body).toHaveProperty("optimizedEstimatedTokens");
    expect(res.body).toHaveProperty("mode");
  });
});
