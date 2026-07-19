import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("GET /api/scenarios", () => {
  it("returns a list of scenarios", async () => {
    const res = await request(app).get("/api/scenarios");
    expect(res.status).toBe(200);
    expect(res.body.scenarios).toBeInstanceOf(Array);
    expect(res.body.scenarios.length).toBeGreaterThan(0);
    expect(res.body.scenarios[0]).toHaveProperty("id");
    expect(res.body.scenarios[0]).toHaveProperty("title");
  });
});

describe("GET /api/scenarios/:scenarioId", () => {
  it("returns the banking scenario", async () => {
    const res = await request(app).get(
      "/api/scenarios/banking-policy-conflict"
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("banking-policy-conflict");
    expect(res.body.contextBlocks).toBeInstanceOf(Array);
    expect(res.body.contextBlocks.length).toBe(6);
    expect(res.body.baselineResponse).toBeTruthy();
  });

  it("returns 404 for unknown scenario", async () => {
    const res = await request(app).get("/api/scenarios/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SCENARIO_NOT_FOUND");
  });
});
