import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { ALL_SCENARIOS } from "@context-meter/shared";

const app = createApp();

describe("POST /api/analyze/heuristic", () => {
  it("returns 400 for missing task", () => {
    return request(app)
      .post("/api/analyze/heuristic")
      .send({ contextBlocks: ALL_SCENARIOS[0]!.contextBlocks })
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      });
  });

  it("returns 400 for empty contextBlocks", async () => {
    const res = await request(app)
      .post("/api/analyze/heuristic")
      .send({ task: "test", contextBlocks: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("does not require a scenarioId (works on arbitrary blocks)", async () => {
    const scenario = ALL_SCENARIOS[0]!;
    const res = await request(app)
      .post("/api/analyze/heuristic")
      .send({ task: scenario.customerTask, contextBlocks: scenario.contextBlocks });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("heuristic");
  });

  describe.each(ALL_SCENARIOS)("scenario $id", (scenario) => {
    it("KEEP/REMOVE decisions match the verified fallbackDecision for every block", async () => {
      const res = await request(app)
        .post("/api/analyze/heuristic")
        .send({ task: scenario.customerTask, contextBlocks: scenario.contextBlocks });

      expect(res.status).toBe(200);
      const byId = new Map(res.body.decisions.map((d: { blockId: string; action: string }) => [d.blockId, d.action]));
      for (const block of scenario.contextBlocks) {
        expect(byId.get(block.id), `block ${block.id}`).toBe(block.fallbackDecision?.action);
      }
    });

    it("detects at least the one known conflict via similarity + effective-date comparison", async () => {
      const res = await request(app)
        .post("/api/analyze/heuristic")
        .send({ task: scenario.customerTask, contextBlocks: scenario.contextBlocks });

      expect(res.body.conflicts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
