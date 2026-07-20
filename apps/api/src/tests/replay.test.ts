import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { BANKING_CONTEXT_BLOCKS } from "@context-meter/shared";

const app = createApp();

const OPTIMIZED_BLOCKS = BANKING_CONTEXT_BLOCKS.filter((b) =>
  ["block-1", "block-3", "block-4"].includes(b.id)
);

describe("POST /api/replay", () => {
  // Mirrors exactly what studio-web sends: no scenarioId at all.
  const validBody = {
    task: "Am I eligible for an overdraft-fee waiver, and what is my current wire-transfer limit?",
    selectedContextBlocks: OPTIMIZED_BLOCKS,
  };

  it("returns 200 with fallback response, inferring the scenario from block IDs", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(res.body.response).toBeTruthy();
    expect(res.body.estimatedInputTokens).toBeGreaterThan(0);
    expect(res.body.evaluation).toBeDefined();
  });

  it("fallback response passes evaluation on a 0-100 score scale", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    expect(res.body.evaluation.score).toBe(100);
    expect(res.body.evaluation.passed).toBe(6);
    expect(res.body.evaluation.total).toBe(6);
  });

  it("evaluation results include baselineResult/optimizedResult for the studio-web panel", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    const result = res.body.evaluation.results[0];
    expect(result.baselineResult).toBeTruthy();
    expect(result.optimizedResult).toBeTruthy();
    expect(result.optimizedResult).toMatch(/^PASSED/);
  });

  it("returns 400 for invalid body", async () => {
    const res = await request(app).post("/api/replay").send({ task: "test" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("validates response schema", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    expect(res.body).toHaveProperty("response");
    expect(res.body).toHaveProperty("estimatedInputTokens");
    expect(res.body).toHaveProperty("evaluation");
    expect(res.body.evaluation).toHaveProperty("passed");
    expect(res.body.evaluation).toHaveProperty("total");
    expect(res.body.evaluation).toHaveProperty("score");
    expect(res.body.evaluation).toHaveProperty("results");
    expect(res.body).toHaveProperty("mode");
  });
});
