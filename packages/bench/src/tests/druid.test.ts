import { describe, expect, it } from "vitest";
import { buildDruidCases } from "../sources/druid.js";
import type { DruidRow } from "../sources/druid.js";

function row(overrides: Partial<DruidRow>): DruidRow {
  return {
    id: "ev-1",
    claim_id: "claim-1",
    claim: "Example claim",
    claimant: "Someone",
    claim_date: "2024-01-01",
    evidence_source: "https://example.com/a",
    evidence: "Evidence text",
    evidence_date: "2024-01-01",
    factcheck_verdict: "False",
    is_gold: true,
    relevant: true,
    evidence_stance: "supports",
    ...overrides,
  };
}

describe("buildDruidCases", () => {
  it("drops claims with fewer than 3 evidence rows", () => {
    const rows = [row({ id: "a" }), row({ id: "b" })];
    expect(buildDruidCases(rows, 10)).toHaveLength(0);
  });

  it("maps relevant=false evidence out of relevantBlockIds", () => {
    const rows = [
      row({ id: "a", relevant: true }),
      row({ id: "b", relevant: false }),
      row({ id: "c", relevant: true }),
    ];
    const [c] = buildDruidCases(rows, 10);
    expect(c!.groundTruth.relevantBlockIds.sort()).toEqual(["a", "c"]);
    expect(c!.contextBlocks).toHaveLength(3);
  });

  it("flags a conflict pair only when stances oppose", () => {
    const rows = [
      row({ id: "a", evidence_stance: "supports" }),
      row({ id: "b", evidence_stance: "refutes" }),
      row({ id: "c", evidence_stance: "insufficient-neutral" }),
    ];
    const [c] = buildDruidCases(rows, 10);
    expect(c!.groundTruth.conflictBlockIdPairs).toEqual([["a", "b"]]);
  });

  it("caps case count at the given limit", () => {
    const claimA = [row({ id: "a1", claim_id: "a" }), row({ id: "a2", claim_id: "a" }), row({ id: "a3", claim_id: "a" })];
    const claimB = [row({ id: "b1", claim_id: "b" }), row({ id: "b2", claim_id: "b" }), row({ id: "b3", claim_id: "b" })];
    expect(buildDruidCases([...claimA, ...claimB], 1)).toHaveLength(1);
  });
});
