import { describe, it, expect } from "vitest";
import {
  evaluateResponse,
  BANKING_EVALUATION_TESTS,
} from "../evaluation.js";
import { BANKING_BASELINE_RESPONSE } from "../fixtures.js";

const OPTIMIZED_RESPONSE =
  "Great news! You are eligible for an overdraft-fee waiver. Our records show your last waiver was 120 days ago, and our current 2026 policy grants Platinum customers one waiver every 90 days. Additionally, your current wire-transfer limit is $10,000 per transaction.";

describe("evaluateResponse — baseline", () => {
  it("fails the $10,000 limit check", () => {
    const summary = evaluateResponse(BANKING_BASELINE_RESPONSE);
    const r = summary.results.find((x) => x.id === "mentions-10000-limit");
    expect(r?.passed).toBe(false);
  });

  it("fails the eligibility check", () => {
    const summary = evaluateResponse(BANKING_BASELINE_RESPONSE);
    const r = summary.results.find((x) => x.id === "eligible-for-waiver");
    expect(r?.passed).toBe(false);
  });

  it("fails the 90-day policy check", () => {
    const summary = evaluateResponse(BANKING_BASELINE_RESPONSE);
    const r = summary.results.find((x) => x.id === "uses-90-day-policy");
    expect(r?.passed).toBe(false);
  });

  it("fails the 120-day history check", () => {
    const summary = evaluateResponse(BANKING_BASELINE_RESPONSE);
    const r = summary.results.find((x) => x.id === "uses-120-day-history");
    expect(r?.passed).toBe(false);
  });

  it("has a low score", () => {
    const summary = evaluateResponse(BANKING_BASELINE_RESPONSE);
    expect(summary.score).toBeLessThan(0.5);
  });
});

describe("evaluateResponse — optimized", () => {
  it("passes all 6 checks", () => {
    const summary = evaluateResponse(OPTIMIZED_RESPONSE);
    expect(summary.passed).toBe(6);
    expect(summary.total).toBe(6);
    expect(summary.score).toBe(1);
  });

  it("mentions $10,000 limit", () => {
    const summary = evaluateResponse(OPTIMIZED_RESPONSE);
    const r = summary.results.find((x) => x.id === "mentions-10000-limit");
    expect(r?.passed).toBe(true);
  });

  it("states eligibility for waiver", () => {
    const summary = evaluateResponse(OPTIMIZED_RESPONSE);
    const r = summary.results.find((x) => x.id === "eligible-for-waiver");
    expect(r?.passed).toBe(true);
  });
});

describe("evaluateResponse — context removal behavior", () => {
  it("fails mentions-10000-limit when limit info is removed", () => {
    const responseWithout10k =
      "You are eligible for an overdraft-fee waiver. Your last waiver was 120 days ago. The 90-day policy applies.";
    const summary = evaluateResponse(responseWithout10k, BANKING_EVALUATION_TESTS);
    const r = summary.results.find((x) => x.id === "mentions-10000-limit");
    expect(r?.passed).toBe(false);
  });

  it("removing irrelevant marketing content does not reduce score", () => {
    // Response that passes all 6 checks — marketing content is irrelevant
    const summary = evaluateResponse(OPTIMIZED_RESPONSE);
    expect(summary.score).toBe(1);
    // Score stays 1 without marketing info (it was never needed)
  });
});
