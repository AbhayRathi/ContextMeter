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
# decision quality only (no API key needed, fast):
npm run bench -- --source=druid,ragbench --n=120 --api-url=http://localhost:8091

# + answer-accuracy grading (needs GEMINI_API_KEY; ~4 Gemini calls per case):
npm run bench -- --source=druid,ragbench --n=40 --accuracy --api-url=http://localhost:8091
```

Flags:
- `--source` — comma-separated: `druid`, `ragbench`, or both (default: both)
- `--n` — cases to pull per source (default: 50)
- `--ragbench-subsets` — comma-separated RAGBench configs (default: all 12; see the dataset card)
- `--accuracy` — also run answer-accuracy grading (see below). Requires `GEMINI_API_KEY` in the env — run via `npx tsx --env-file-if-exists=../../.env …` or export the key.
- `--concurrency` — cases graded in parallel in accuracy mode (default 2; a **free-tier** Gemini key allows only ~5 requests/min/model, so keep it at 1–2 and expect ~1 case/min. Raise once billing is enabled.)
- `--api-url` — base URL of a running `apps/api` instance (default: `http://localhost:8080`)
- `--out` — path to write the full per-case JSON report (default: `packages/bench/reports/<timestamp>.json`)

The decision-quality pass calls `POST /api/analyze/heuristic` (the generic
engine) via `@context-meter/sdk`'s `ContextMeterClient`, the same client the
CLI and Express middleware use.

## What it measures

**1. Decision quality** — precision/recall/F1 of the engine's KEEP calls
against each dataset's real relevance labels, plus mean token reduction.

**2. Conflict detection** — recall against DRUID's labeled opposing-stance
evidence pairs. (Heuristic engine only detects *recency* conflicts, so this
number is a floor, not a ceiling — see Results.)

**3. Answer accuracy** (`--accuracy`) — the core "does removing context
actually help?" measurement. Per case:
  1. replay the task with **all** context blocks → `answerFull`
  2. replay with only the blocks the engine kept → `answerOptimized`
  3. LLM-judge both against the dataset gold (`groundTruth.referenceLabel` —
     `factcheck_verdict` for DRUID, `response` for RAGBench), 0–100

Reported: mean score full vs. optimized, the **delta**, the share of cases
where the optimized answer was *no worse* than the full-context answer, and
the share where it was *strictly better*. `delta ≥ 0` means the pruning was
free (same answer quality, fewer tokens); `delta > 0` means the removed
blocks were actively hurting.

The replay + judge calls use the bench's own thin Gemini wrapper
(`src/llm.ts`), deliberately separate from `apps/api`'s client — those calls
are the product, these are the measurement rig. The *analyze* call being
measured still goes through the live API.

## Results

### Latest — n=120 per source, all 12 RAGBench domains (2026-09-07)

```
── druid (120 cases) ──
  KEEP/REMOVE precision: 100.0%
  KEEP/REMOVE recall:    68.5%
  KEEP/REMOVE F1:        81.3%
  Mean token reduction:  36.7%
  Conflict recall:       54.0%
── ragbench (120 cases) ──
  KEEP/REMOVE precision: 59.5%
  KEEP/REMOVE recall:    74.2%
  KEEP/REMOVE F1:        66.0%
  Mean token reduction:  35.4%
── all (240 cases) ──
  KEEP/REMOVE precision: 78.2%
  KEEP/REMOVE recall:    70.7%
  KEEP/REMOVE F1:        74.3%
  Mean token reduction:  36.0%
```

Read this as: the heuristic engine is a **coarse pre-filter**, not a scalpel.
It keeps ~71% of the blocks that were actually needed while cutting ~36% of
tokens; on RAGBench ~40% of what it keeps wasn't strictly needed (precision
59.5%). Good enough to shrink a bloated context cheaply and deterministically;
not good enough to be the only thing deciding what an agent sees. The LLM
engine (`/api/analyze`) is meant for the cases that need real reasoning.

**Conflict recall is 54%** and only measured on DRUID. The heuristic detects
*recency* conflicts (same category, similar content, different `effectiveDate`)
— it does **not** detect *contradiction* conflicts where two sources disagree
on a fact without a date signal, which is most of what DRUID's opposing-stance
pairs are. Closing that gap needs the LLM engine.

### Answer accuracy — pending a paid Gemini key

`--accuracy` is implemented and validated end-to-end (replay full-context +
optimized-context, LLM-judge both against the dataset gold, aggregate the
delta). But a **free-tier** Gemini key is capped at **20 requests/day per
model** — both `gemini-3.8-flash` and `gemini-2.5-flash` daily quotas are
exhausted after a handful of cases. A meaningful run needs billing enabled on
the Google AI Studio project; then:

```bash
npm run bench -- --source=druid,ragbench --n=40 --accuracy --api-url=http://localhost:8091
```

Note: DRUID's gold is a bare fact-check verdict ("False", "Half True"), which
the 0–100 judge grades harshly against a 2-sentence answer — expect DRUID
absolute accuracy scores to look low regardless of context quality; the
*delta* (full vs. optimized) is the signal, and RAGBench (gold = a full
reference answer) is the cleaner accuracy measure.

### First run — n=8 per source (2026-09-04), before the inferred-mode fix

```
── druid (8 cases) ──   precision 0.0%   recall 0.0%    token reduction 100.0%
── ragbench (8 cases) ── precision 63.0%  recall 94.4%   token reduction 2.8%
```

The engine removed **every** DRUID block and kept **every** RAGBench block —
it wasn't discriminating at all. Cause: with no caller-supplied `priority`
(which no real dataset provides), the scoring formula's fixed additive prior
dominated, so a block's fate was decided by whether `verified` happened to be
true, not by relevance. Fixed in `apps/api/src/services/heuristicAnalyzer.ts`
by adding **inferred mode** — when no block carries a `priority`, rank by
relevance normalised within the request instead of an absolute threshold. The
numbers above are post-fix.
