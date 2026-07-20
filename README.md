# ContextMeter

> **Hackathon Prototype** — not production-ready.

Know what your AI agent knows—and what it should forget.

ContextMeter is an observability and optimization tool for AI-agent context. It analyzes the context blocks provided to an agent, recommends which to keep, remove, compress, or refresh, and replays the task using optimized context—demonstrating that reducing context can improve accuracy while lowering estimated token usage.

## Problem Statement

AI agents receive system instructions, conversation history, memories, retrieved documents, policies, and tool outputs. Developers often cannot determine which context improved an answer, which caused an incorrect answer, or which information is stale, contradictory, or redundant.

## Prototype Workflow

1. **Load Failed Trace** — loads one of 3 synthetic scenarios, each with a known incorrect response
2. **Analyze Context** — identifies stale, duplicate, conflicting, and irrelevant blocks
3. **Apply Optimization** — filters to only the verified, relevant blocks
4. **Replay Agent** — generates a new response using optimized context
5. **Evaluate** — deterministic tests score the response

## Architecture

```
apps/
  api/         Express backend — routes, services, Gemini client
  web/         React + Vite frontend dashboard (reference implementation, superseded — see below)
  studio-web/  React + Vite frontend built in Google AI Studio — the real UI, served same-origin by apps/api in production
packages/
  shared/      Types, Zod schemas, fixtures, evaluation utilities
```

`apps/studio-web` is the frontend that actually ships. It only ever calls relative paths (`fetch('/api/...')`), so it must be served from the same origin as the API — `apps/api/src/app.ts`'s production static-serving branch does exactly that (serves `apps/studio-web/dist`), which is also why `apps/api/src/adapters/studioContract.ts` exists: it maps this backend's internal domain shapes (`packages/shared`) onto the exact wire contract `apps/studio-web/src/types.ts` expects (renamed/restructured fields, a 0–100 eval score, etc.). `apps/web` is kept around as a smaller reference implementation of the *original* (pre-adapter) wire shape — it still passes its own test suite (which mocks at the `api.ts` boundary) but will show stale/undefined fields if pointed at the live backend, since the contract moved on. `npm run dev:studio` runs the API + studio-web together with a dev proxy (`apps/studio-web/vite.config.ts`) so `/api/*` reaches the API without a production build.

### Three analysis engines

`POST /api/analyze` picks between two of these automatically based on `USE_MOCK_GEMINI`; the third is a separate, always-available endpoint:

1. **Canned fallback** (`apps/api/src/services/contextAnalyzer.ts`, `mode: "fallback"`) — used automatically when no Gemini key is configured, or if a live Gemini call fails/times out/returns malformed JSON. Every KEEP/REMOVE decision, conflict, and replay response is pre-written per scenario in `packages/shared/src/fixtures.ts` — a rule set, not a model. Guarantees the demo is never flaky.
2. **Heuristic engine** (`apps/api/src/services/heuristicAnalyzer.ts`, `POST /api/analyze/heuristic`, `mode: "heuristic"`) — pure math, no LLM and no fixture lookup. Scores each block from `relevance to task` (Jaccard word-overlap similarity, `packages/shared/src/similarity.ts`) + `priority` + `verified`, then applies penalties for **staleness** (same-category blocks with similar content but different `effectiveDate`s — the older one is flagged and a conflict is generated automatically) and **duplication** (near-identical content anywhere, lower-weighted copy is dropped). Because it's generic math rather than per-scenario answers, it works on any task + block set you hand it, not just the 3 shipped scenarios — verified to reproduce the same KEEP/REMOVE call as the canned fallback on all 16 blocks across all 3 scenarios, plus detects all 3 known conflicts.
3. **Gemini** (`apps/api/src/services/geminiClient.ts`, `mode: "gemini"`) — real LLM call to Google's Gemini API with a prompt asking it to reason about the context blocks (`apps/api/src/prompts/`). Response is schema-validated; any failure falls back to (1).

The frontend's "Analyze (Heuristic)" button calls engine 2 directly so you can show, live, that a plain similarity/recency algorithm reaches the same conclusion the verified rule set does — a useful contrast with engine 3's genuine LLM reasoning.

## Repository Structure

```
context-meter/
├── apps/
│   ├── api/src/         Express API
│   └── web/src/         React frontend
├── packages/shared/src/ Shared domain logic
├── .env.example
├── Dockerfile
└── README.md
```

## Local Setup

```bash
git clone <repo>
cd context-meter
npm install
cp .env.example .env
npm run dev
```

- API: http://localhost:8080
- Frontend: http://localhost:5173

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | _(empty)_ | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `USE_MOCK_GEMINI` | `true` | Use deterministic fallback |
| `API_PORT` | `8080` | API server port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated list of allowed CORS origins, e.g. `https://foo.app,https://bar.app` |

## Running Without Gemini

The default configuration uses deterministic fallback mode. No API key is required:

```bash
npm install
npm run dev
```

## Running With Gemini

```bash
cp .env.example .env
# Edit .env: set GEMINI_API_KEY and USE_MOCK_GEMINI=false
npm run dev
```

## Test Commands

```bash
npm test                    # run all tests
npm run test:coverage       # with coverage
npm run typecheck           # TypeScript type check
npm run build               # production build
```

## Docker Commands

```bash
docker build -t context-meter .
docker run -p 8080:8080 -e USE_MOCK_GEMINI=true context-meter
```

## Deployment

`apps/studio-web`'s frontend code always calls relative paths (`fetch('/api/...')`, no base-URL override anywhere) — it must be served from the **same origin** as the API. `apps/api/src/app.ts` already does this in production mode (serves `apps/studio-web/dist` + handles `/api/*`), so the natural deployment shape is **one process, one deployment**, not a separate frontend + API.

### Cloud Run (recommended for the same-origin build)

The existing multi-stage `Dockerfile` builds `packages/shared` → `apps/api` → `apps/studio-web` and runs one Node process serving both:

```bash
gcloud run deploy context-meter \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "USE_MOCK_GEMINI=true,NODE_ENV=production"
```

No `CORS_ORIGIN` configuration is needed for this path — the CORS middleware always allows same-origin requests regardless of the configured allowlist (see `apps/api/src/app.ts`), which is what makes this work without knowing the Cloud Run URL ahead of time.

### Vercel (API-only, separate origin — needs a proxy)

An earlier iteration of this project deployed just `apps/api` as a Vercel serverless project (`apps/api/vercel.json` + `apps/api/api/index.ts`) with the frontend hosted elsewhere and CORS configured via `CORS_ORIGIN`. **This doesn't work for `apps/studio-web` as-is** — its relative fetches would hit the frontend's own origin's `/api/*`, not Vercel's, regardless of CORS. It only works if whatever hosts the frontend also reverse-proxies `/api/*` to the Vercel deployment. If you want this split-origin shape, set `CORS_ORIGIN` to the frontend's origin(s) and set up that proxy; otherwise use Cloud Run above.

**Known caveat either way**: `express-rate-limit`'s in-memory store resets per cold start and isn't shared across concurrent instances — fine for a demo, not a real rate limit in production.

Alternative: build and push the image yourself instead of `--source .`:
```bash
docker tag context-meter gcr.io/YOUR_PROJECT/context-meter
docker push gcr.io/YOUR_PROJECT/context-meter
gcloud run deploy context-meter --image gcr.io/YOUR_PROJECT/context-meter --platform managed --region us-central1 --allow-unauthenticated
```

## API Documentation

This is the wire contract `apps/studio-web` actually speaks — i.e. what comes out of `apps/api/src/adapters/studioContract.ts`, not the raw internal shapes in `packages/shared`. `apps/studio-web/src/types.ts` is the source of truth; this section mirrors it.

### `GET /api/health`
Returns `{ "status": "ok", "service": "context-meter-api", "mode": "gemini" | "fallback" }`.

### `GET /api/scenarios`
Returns `Scenario[]` directly (not wrapped) — the studio-web frontend doesn't actually call this today (its scenario picker is hardcoded to the 3 IDs below), but it's kept correct for future use.

### `GET /api/scenarios/:scenarioId`
Returns one `Scenario`. Returns 404 (`{ "error": { "code": "SCENARIO_NOT_FOUND", "message": string } }`) for unknown IDs.

```ts
interface ContextBlock {
  id: string;
  title: string;
  category: string;           // display string, e.g. "Policy Registry", "Customer Record (CRM)"
  source: string;
  effectiveDate: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  verified: boolean;
  content: string;
  estimatedTokens: number;
  supersededStatus?: string;  // present on blocks superseded by a newer block
}

interface Scenario {
  id: string;
  name: string;
  category: string;           // e.g. "Customer Support Agent"
  riskType: string;           // e.g. "Stale and contradictory context"
  customerRequest: string;    // the question/task shown to the user
  traceId: string;
  modelName: string;
  timestamp: string;
  baselineResponse: string;   // the wrong answer the agent originally gave
  contextBlocks: ContextBlock[];
}
```

### `POST /api/analyze`
Body: `{ "task": string, "contextBlocks": ContextBlock[] }` — no `scenarioId`; the backend infers which scenario this is by matching submitted block `id`s against fixture data (`inferScenarioId` in `packages/shared/src/fixtures.ts`), since studio-web never sends one. `contextBlocks` is normally whatever `GET /api/scenarios/:id` returned, echoed back unmodified — the backend doesn't trust any field on it except `id` (canonical fixture data is looked up server-side), so it's safe to round-trip.

Returns:
```ts
{
  decisions: { contextBlockId: string; recommendedAction: "KEEP" | "REMOVE" | "COMPRESS" | "REFRESH"; recommendationReason: string; riskIfRemoved: string }[];
  conflicts: {
    id: string; title: string; severity: "High" | "Medium" | "Low"; recommendation: string;
    blockA: { id: string; source: string; value: string; isNewer: true; verified: boolean };  // the current/kept side
    blockB: { id: string; source: string; value: string; isNewer: false; verified: boolean };  // the superseded side
  }[];
  optimizedContextIds: string[];   // block IDs with action KEEP
  summary: string;
  baselineEstimatedTokens: number;
  optimizedEstimatedTokens: number;
  mode: "gemini" | "fallback";
}
```

### `POST /api/analyze/heuristic`
Body: `{ "task": string, "contextBlocks": ContextBlock[] }`. This engine is generic math (see [Three analysis engines](#three-analysis-engines)) and works on any task + block set, not just the shipped scenarios. Not called by studio-web today, and **stays on the original internal wire shape** (`blockId`/`action`/`risk`, not `contextBlockId`/`recommendedAction`/`riskIfRemoved`) — it's a separate, unadapted endpoint.

### `POST /api/replay`
Body: `{ "task": string, "selectedContextBlocks": ContextBlock[] }` — same no-`scenarioId`/round-tripped-blocks pattern as `/api/analyze`. `selectedContextBlocks` is typically `contextBlocks` filtered to whichever weren't marked `REMOVE`.

Returns:
```ts
{
  response: string;               // the agent's new answer using only the selected context
  estimatedInputTokens: number;
  evaluation: {
    passed: number;
    total: number;
    score: number;                // 0..100
    results: { id: string; label: string; passed: boolean; explanation: string; baselineResult: string; optimizedResult: string }[];
  };
  mode: "gemini" | "fallback";
}
```

**Actual studio-web flow** (`apps/studio-web/src/App.tsx`): pick one of 3 hardcoded scenario tabs → `GET /api/scenarios/:id` → `POST /api/analyze` (merges `decisions` back onto the loaded blocks for display) → apply optimization (client-side filter, drops blocks marked `REMOVE`) → `POST /api/replay` → results shown in the Contradictions/Replay Sandbox tabs. Note: `ResponseComparison` and the top metric cards are currently hardcoded per scenario in the frontend and don't reflect live `/api/replay`/`/api/analyze` numbers — a pre-existing frontend limitation, not a backend issue.

## Demo Scenarios

Three scenarios ship today — content transcribed directly from `apps/studio-web`'s own mock data (`apps/studio-web/src/services/mockData.ts`) so the real backend tells the identical story the frontend's built-in mock does:

| Scenario ID | Domain | Baseline (incorrect) | Optimized (correct) |
|---|---|---|---|
| `banking-policy-conflict` | Customer Support Agent | Archived 2024 policy → denies overdraft waiver, $5,000 wire limit | Current 2026 policy → grants waiver (Platinum, 90-day cycle), $10,000 wire limit |
| `mortgage-underwriting-conflict` | Lending & Underwriting Copilot | Legacy 2023 handbook → 43% DTI cap, pre-approval declined | Current 2026 guidelines → 50% DTI cap for Premier tier, $750,000 pre-approval approved |
| `corporate-policy-conflict` | Enterprise Knowledge Assistant | Legacy 2022 circular → business class "strictly prohibited", $150 hotel cap | Current 2026 handbook → business class authorized (>6hr international flights), $350 Tier 1 hotel allowance |

Each scenario has 6 context blocks and **2** conflicts (not 1) between its current/legacy policy pair. Fixture data (`packages/shared/src/fixtures.ts`) is the single source of truth — `apps/api/src/adapters/studioContract.ts` is what turns it into the shape above.

Adding a 4th scenario: add a new `Scenario` object to `fixtures.ts` (context blocks with `fallbackDecision` incl. `riskIfRemoved`, a `baselineResponse`, an `expectedOptimizedResponse`, `fallbackConflicts` with `title`/`blockAValue`/`blockBValue`), a matching `EvaluationTest[]` registered in `EVALUATION_TESTS_BY_SCENARIO` (`packages/shared/src/evaluation.ts`), and — since `apps/studio-web/src/App.tsx`'s scenario picker is hardcoded — a new tab entry there too.

## Known Limitations

- Token estimates use `ceil(chars/4)` approximation — not actual Gemini billing data
- Three demo scenarios (banking, mortgage underwriting, corporate travel) — synthetic, hardcoded in `packages/shared/src/fixtures.ts`
- No persistence — state resets on page refresh
- `apps/web` is a smaller reference frontend kept for the *original* wire shape; it's no longer production-served (see Architecture) and will show stale fields if pointed at the live backend
- Rate limiting is in-memory and per-instance (see Vercel deployment caveat above)
- The Gemini prompt/response schema (`apps/api/src/prompts/`) doesn't yet request `riskIfRemoved`/conflict `title`/`blockAValue`/`blockBValue` — until updated, a real Gemini response will fail schema validation and silently fall back to the canned response (safe, but means "LIVE FEED via Gemini" won't show genuine LLM output yet even with a valid key)

## Post-Hackathon Roadmap

1. **Replace frontend**: Export the workflow state shape and swap in a Google AI Studio-generated React UI
2. **Add more scenarios**: Extend `packages/shared/src/fixtures.ts` (see [Demo Scenarios](#demo-scenarios) for the pattern)
3. **Persistence**: Add Redis or Firestore for session state
4. **Real token counting**: Integrate Gemini token counting API
5. **Vector similarity**: Add semantic deduplication for context blocks

## Synthetic Data Notice

All customer data, account information, policies, API documentation, and scenarios in this project are entirely synthetic and fictional. This tool does not make real banking, lending, refund, or engineering decisions.
