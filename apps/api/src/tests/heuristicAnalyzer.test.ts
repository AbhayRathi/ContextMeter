import { describe, it, expect } from "vitest";
import type { ContextBlock } from "@context-meter/shared";
import { heuristicAnalyze } from "../services/heuristicAnalyzer.js";

function block(over: Partial<ContextBlock> & { id: string; content: string }): ContextBlock {
  return {
    title: over.id,
    category: "retrieval",
    source: "test",
    estimatedTokens: Math.ceil(over.content.length / 4),
    verified: true,
    ...over,
  };
}

describe("heuristicAnalyze — inferred mode (no caller priority)", () => {
  it("keeps on-topic blocks and drops filler by within-case relevance", () => {
    const task = "What is the wire transfer limit for platinum customers in 2026?";
    const blocks = [
      block({ id: "on-topic", content: "The wire transfer limit for platinum customers in 2026 is $10,000." }),
      block({ id: "filler-1", content: "Our branches are open Monday to Friday, nine to five, except public holidays." }),
      block({ id: "filler-2", content: "The company was founded in 1974 and is headquartered in Ohio." }),
    ];

    const result = heuristicAnalyze(task, blocks);
    const byId = new Map(result.decisions.map((d) => [d.blockId, d.action]));

    expect(byId.get("on-topic")).toBe("KEEP");
    expect(byId.get("filler-1")).toBe("REMOVE");
    expect(byId.get("filler-2")).toBe("REMOVE");
    expect(result.summary).toContain("inferred mode");
    expect(result.optimizedEstimatedTokens).toBeLessThan(result.baselineEstimatedTokens);
  });

  it("keeps all blocks when none carry a priority and none share vocabulary with the task (no signal to rank on)", () => {
    // Task words appear in none of the blocks -> relevance ~0 and near-equal for all.
    const task = "Zorblax quibbleship frunctual merriwidge?";
    const blocks = [
      block({ id: "e1", content: "The mitochondria is the powerhouse of the cell and produces ATP through respiration." }),
      block({ id: "e2", content: "Photosynthesis converts carbon dioxide and water into glucose using sunlight energy." }),
      block({ id: "e3", content: "Osmosis is the movement of solvent molecules across a semipermeable membrane." }),
    ];

    const result = heuristicAnalyze(task, blocks);
    expect(result.decisions.every((d) => d.action === "KEEP")).toBe(true);
    expect(result.decisions[0]!.reason).toContain("not enough signal");
  });

  it("still drops a stale block in inferred mode via the staleness penalty", () => {
    const task = "What is the current wire transfer limit?";
    const blocks = [
      block({
        id: "current",
        category: "policy",
        effectiveDate: "2026-01-01",
        content: "The standard wire transfer limit is $10,000 per day as of 2026.",
      }),
      block({
        id: "stale",
        category: "policy",
        effectiveDate: "2024-01-01",
        content: "The standard wire transfer limit is $5,000 per day as of 2024.",
      }),
    ];

    const result = heuristicAnalyze(task, blocks);
    const byId = new Map(result.decisions.map((d) => [d.blockId, d.action]));
    expect(byId.get("current")).toBe("KEEP");
    expect(byId.get("stale")).toBe("REMOVE");
    expect(result.conflicts.length).toBeGreaterThanOrEqual(1);
  });
});

describe("heuristicAnalyze — authored mode (explicit priority present)", () => {
  it("uses the weighted formula when any block sets a priority", () => {
    const task = "Does the customer qualify for a fee waiver?";
    const blocks = [
      block({
        id: "profile",
        category: "customer_profile",
        priority: "critical",
        content: "Customer tier: Platinum. Account in good standing.",
      }),
      block({
        id: "noise",
        priority: "low",
        content: "Marketing blurb about a summer savings promotion unrelated to fees.",
      }),
    ];

    const result = heuristicAnalyze(task, blocks);
    const byId = new Map(result.decisions.map((d) => [d.blockId, d.action]));
    expect(byId.get("profile")).toBe("KEEP");
    expect(byId.get("noise")).toBe("REMOVE");
    expect(result.summary).toContain("authored mode");
  });
});
