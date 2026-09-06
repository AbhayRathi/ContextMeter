import { estimateTokens } from "@context-meter/shared";
import type { ContextBlock } from "@context-meter/shared";
import { fetchHfRows } from "../hf.js";
import type { BenchCase } from "../types.js";

/**
 * DRUID (copenlu/druid on HuggingFace, MIT license): real (claim, evidence)
 * pairs collected for fact-checking. Each evidence piece is independently
 * double-annotated for `relevant` (should a fact-checker use this at all) and
 * `evidence_stance` (supports / refutes / insufficient-*) toward the claim.
 * https://huggingface.co/datasets/copenlu/druid
 *
 * We group evidence rows by claim_id to build one BenchCase per claim, using
 * `relevant` as (weak — see caveat below) ground truth for KEEP/REMOVE, and
 * opposing-stance pairs as ground truth for conflict detection — this is the
 * dataset's real value for us, since it's the one signal genuinely analogous
 * to ContextMeter's "stale/contradictory policy" use case.
 *
 * Caveat: in this corpus ~98% of evidence rows are labeled `relevant: true`
 * (it's pre-filtered retrieval, not a noisy mixed pool), so relevantBlockIds
 * precision/recall here is barely discriminating — a trivial "keep
 * everything" baseline scores well too. Report conflictRecall as DRUID's
 * primary signal; treat its precision/recall as a secondary, low-power check.
 */
const DATASET = "copenlu/druid";
const CONFIG = "DRUID";
const SPLIT = "train";
const MIN_EVIDENCE_PER_CLAIM = 3;
const MAX_EVIDENCE_PER_CLAIM = 12; // defensive cap: pair-generation is O(n^2) per claim

const SUPPORT_STANCES = new Set(["supports", "insufficient-supports"]);
const OPPOSE_STANCES = new Set(["refutes", "insufficient-refutes", "insufficient-contradictory"]);

export interface DruidRow {
  id: string;
  claim_id: string;
  claim: string;
  claimant: string;
  claim_date: string;
  evidence_source: string;
  evidence: string;
  evidence_date: string;
  factcheck_verdict: string;
  is_gold: boolean;
  relevant: boolean;
  evidence_stance: string;
}

export async function loadDruidCases(limit: number, rawRowLimit = 1500): Promise<BenchCase[]> {
  const rows = await fetchHfRows<DruidRow>(DATASET, CONFIG, SPLIT, rawRowLimit);
  return buildDruidCases(rows, limit);
}

/** Pure grouping/mapping logic, split out from the fetch so it's unit-testable without network. */
export function buildDruidCases(rows: DruidRow[], limit: number): BenchCase[] {
  const byClaimId = new Map<string, DruidRow[]>();
  for (const row of rows) {
    const group = byClaimId.get(row.claim_id);
    if (group) group.push(row);
    else byClaimId.set(row.claim_id, [row]);
  }

  const cases: BenchCase[] = [];
  for (const [claimId, group] of byClaimId) {
    if (group.length < MIN_EVIDENCE_PER_CLAIM) continue;
    const evidence = group.slice(0, MAX_EVIDENCE_PER_CLAIM);

    const contextBlocks: ContextBlock[] = evidence.map((row) => ({
      id: row.id,
      title: `Evidence: ${row.evidence_source.slice(0, 60)}`,
      category: "retrieval",
      content: row.evidence,
      source: row.evidence_source,
      effectiveDate: row.evidence_date || undefined,
      estimatedTokens: estimateTokens(row.evidence),
      verified: row.is_gold,
    }));

    const relevantBlockIds = evidence.filter((r) => r.relevant).map((r) => r.id);

    const conflictBlockIdPairs: [string, string][] = [];
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const a = evidence[i]!;
        const b = evidence[j]!;
        const aSupports = SUPPORT_STANCES.has(a.evidence_stance);
        const bSupports = SUPPORT_STANCES.has(b.evidence_stance);
        const aOpposes = OPPOSE_STANCES.has(a.evidence_stance);
        const bOpposes = OPPOSE_STANCES.has(b.evidence_stance);
        if ((aSupports && bOpposes) || (aOpposes && bSupports)) {
          conflictBlockIdPairs.push([a.id, b.id]);
        }
      }
    }

    cases.push({
      id: claimId,
      source: "druid",
      datasetTag: CONFIG,
      task: `Fact-check this claim made by ${evidence[0]!.claimant || "the claimant"} on ${evidence[0]!.claim_date}: "${evidence[0]!.claim}"`,
      contextBlocks,
      groundTruth: {
        relevantBlockIds,
        conflictBlockIdPairs,
        referenceLabel: evidence[0]!.factcheck_verdict,
      },
    });

    if (cases.length >= limit) break;
  }

  return cases;
}
