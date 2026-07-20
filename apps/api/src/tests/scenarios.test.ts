import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("GET /api/scenarios", () => {
  it("returns a list of scenarios in the wire shape", async () => {
    const res = await request(app).get("/api/scenarios");
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(3);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("customerRequest");
  });
});

describe("GET /api/scenarios/:scenarioId", () => {
  it("returns the banking scenario in the wire shape", async () => {
    const res = await request(app).get("/api/scenarios/banking-policy-conflict");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("banking-policy-conflict");
    expect(res.body.name).toBe("Banking Policy Conflict");
    expect(res.body.contextBlocks).toBeInstanceOf(Array);
    expect(res.body.contextBlocks.length).toBe(6);
    expect(res.body.baselineResponse).toBeTruthy();
    expect(res.body.category).toBeTruthy();
    expect(res.body.traceId).toBeTruthy();

    const block = res.body.contextBlocks[0];
    expect(block).toHaveProperty("effectiveDate");
    expect(["Critical", "High", "Medium", "Low"]).toContain(block.priority);
  });

  it("returns 404 for unknown scenario", async () => {
    const res = await request(app).get("/api/scenarios/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SCENARIO_NOT_FOUND");
  });
});
