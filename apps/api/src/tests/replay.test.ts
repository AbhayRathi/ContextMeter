import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { BANKING_CONTEXT_BLOCKS } from "@context-meter/shared";

const app = createApp();

const OPTIMIZED_BLOCKS = BANKING_CONTEXT_BLOCKS.filter((b) =>
  ["policy-2026", "customer-profile", "account-history"].includes(b.id)
);

describe("POST /api/replay", () => {
  const validBody = {
    task: "Can you waive my overdraft fee, and what is my current wire-transfer limit?",
    selectedContextBlocks: OPTIMIZED_BLOCKS,
  };

  it("returns 200 with fallback response in mock mode", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("fallback");
    expect(res.body.response).toBeTruthy();
    expect(res.body.estimatedInputTokens).toBeGreaterThan(0);
    expect(res.body.evaluation).toBeDefined();
  });

  it("fallback response passes evaluation", async () => {
    const res = await request(app).post("/api/replay").send(validBody);
    expect(res.body.evaluation.score).toBeGreaterThan(0.8);
    expect(res.body.evaluation.passed).toBeGreaterThanOrEqual(5);
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
