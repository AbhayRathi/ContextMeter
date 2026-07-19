import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { BANKING_CONTEXT_BLOCKS } from "@context-meter/shared";

const app = createApp();

describe("POST /api/analyze", () => {
  const validBody = {
    task: "Can you waive my overdraft fee, and what is my current wire-transfer limit?",
    contextBlocks: BANKING_CONTEXT_BLOCKS,
  };

  it("returns 200 with fallback analysis in mock mode", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(res.body.decisions).toBeInstanceOf(Array);
    expect(res.body.conflicts).toBeInstanceOf(Array);
    expect(res.body.optimizedContextIds).toBeInstanceOf(Array);
    expect(res.body.baselineEstimatedTokens).toBeGreaterThan(0);
    expect(res.body.optimizedEstimatedTokens).toBeGreaterThan(0);
    expect(res.body.optimizedEstimatedTokens).toBeLessThan(
      res.body.baselineEstimatedTokens
    );
  });

  it("removes stale and irrelevant blocks in fallback", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    const removedIds = res.body.decisions
      .filter((d: { action: string }) => d.action === "REMOVE")
      .map((d: { blockId: string }) => d.blockId);
    expect(removedIds).toContain("policy-2024");
    expect(removedIds).toContain("duplicate-conversation");
    expect(removedIds).toContain("marketing-promo");
  });

  it("identifies policy conflict", async () => {
    const res = await request(app).post("/api/analyze").send(validBody);
    expect(res.body.conflicts.length).toBeGreaterThan(0);
    expect(res.body.conflicts[0].severity).toBe("HIGH");
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
