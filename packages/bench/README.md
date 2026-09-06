# @context-meter/bench

Measures ContextMeter's decision quality against **real, independently-labeled
datasets** — not the hand-authored fixtures in `packages/shared/src/fixtures.ts`.
Those fixtures prove the pipeline runs; they can't prove the analyzer helps,
since the same repo wrote both the scenarios and the graders. This package
scores KEEP/REMOVE decisions and conflict detection against ground truth this
repo did not author.

## Datasets

| Source | Dataset | License | What it's used for |
|---|---|---|---|
| `druid` | [copenlu/druid](https://huggingface.co/datasets/copenlu/druid) — real (claim, evidence) pairs from fact-checking, each evidence piece annotated with `relevant` and a `evidence_stance` (supports/refutes/insufficient-*) | MIT | **Conflict detection** ground truth: pairs of evidence with opposing stance on the same claim are a real, labeled conflict. This is `conflictRecall`. `relevant` is also used for KEEP/REMOVE precision/recall, but see caveat below — it's a weak signal here. |
| `ragbench` | [galileo-ai/ragbench](https://huggingface.co/datasets/galileo-ai/ragbench) — ~100k real RAG examples across 12 domains, with sentence-level relevance annotations | CC-BY-4.0 | **KEEP/REMOVE precision/recall**: `all_relevant_sentence_keys` rolled up to document level gives real per-document relevance ground truth, and the retrieved-candidate pool is genuinely mixed (unlike DRUID), so this actually discriminates a good analyzer from "keep everything." |

Rows are pulled live from HuggingFace's `datasets-server` REST API (no Python,
no `datasets` library, no parquet parsing) and cached to `.cache/` (gitignored)
so repeat runs don't re-hit the network.

**Caveat on DRUID's `relevant` field**: in this corpus ~98% of evidence rows
are labeled relevant (it's a pre-filtered retrieval corpus, not a noisy mixed
pool), so DRUID's precision/recall barely discriminates — treat it as a
secondary, low-power check and lean on `conflictRecall` as DRUID's real
signal.

## Running it

Start the API first (any port; point `--api-url` at it):

```bash
API_PORT=8091 npm run dev --workspace=apps/api
```

Then, from the repo root:

```bash
npm run bench -- --source=druid,ragbench --n=50 --api-url=http://localhost:8091
```

Flags:
- `--source` — comma-separated: `druid`, `ragbench`, or both (default: both)
- `--n` — cases to pull per source (default: 50)
- `--ragbench-subsets` — comma-separated RAGBench configs (default: `hotpotqa,finqa,covidqa`; 12 available, see the dataset card)
- `--api-url` — base URL of a running `apps/api` instance (default: `http://localhost:8080`)
- `--out` — path to write the full per-case JSON report (default: `packages/bench/reports/<timestamp>.json`)

This calls `POST /api/analyze/heuristic` (the generic engine — the only one
that works on context it wasn't fixture-tuned for) via `@context-meter/sdk`'s
`ContextMeterClient`, the same client the CLI and Express middleware use.

## What it measures (and what it doesn't yet)

Currently scored: **decision quality** (precision/recall/F1 of KEEP vs. a
real relevance label), **conflict detection** (recall against real labeled
contradictions), and **efficiency** (token reduction %).

Not yet scored: **end-to-end answer accuracy** (does replaying with the
optimized context actually produce a better answer than the baseline). Both
datasets carry a reference answer (`groundTruth.referenceLabel` —
`factcheck_verdict` for DRUID, `response` for RAGBench) for exactly this, but
grading free-text output against it needs either an LLM-judge call or the
live Gemini engine — wire that up once a `GEMINI_API_KEY` (or another judge
model) is available; `USE_MOCK_GEMINI=true` by default has no API key
configured, and the canned fallback engine only "knows" the 3 shipped demo
scenarios so it can't run on these cases at all.

## Example finding (n=8 per source, 2026-09-04)

```
── druid (8 cases) ──
  KEEP/REMOVE precision: 0.0%
  KEEP/REMOVE recall:    0.0%
  Mean token reduction:  100.0%
  Conflict recall:       33.3%
── ragbench (8 cases) ──
  KEEP/REMOVE precision: 63.0%
  KEEP/REMOVE recall:    94.4%
  Mean token reduction:  2.8%
```

The heuristic engine removed **every** DRUID block in every case (100% token
reduction, 0% recall). Root cause: its scoring formula weights `priority`
heavily (`PRIORITY_COEFF = 0.5`, see `apps/api/src/services/heuristicAnalyzer.ts`)
and defaults unset `priority` to `medium` (0.5) — fine for the fixtures, which
always set an explicit priority, but real DRUID/RAGBench blocks never carry
one. Combined with most DRUID evidence being non-`is_gold` (lowering the
verified term too), nearly every real-world block lands just under the 0.45
KEEP threshold regardless of relevance. This is exactly the kind of gap this
package exists to surface — a bigger, longer bench run should confirm the
size of the effect and prioritize a fix (e.g. don't penalize unset priority
as hard, or infer a priority signal from category/source instead of
defaulting to medium) before claiming the heuristic engine generalizes.
