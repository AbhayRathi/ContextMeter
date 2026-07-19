# ContextMeter

> **Hackathon Prototype** — not production-ready.

Know what your AI agent knows—and what it should forget.

ContextMeter is an observability and optimization tool for AI-agent context. It analyzes the context blocks provided to an agent, recommends which to keep, remove, compress, or refresh, and replays the task using optimized context—demonstrating that reducing context can improve accuracy while lowering estimated token usage.

## Problem Statement

AI agents receive system instructions, conversation history, memories, retrieved documents, policies, and tool outputs. Developers often cannot determine which context improved an answer, which caused an incorrect answer, or which information is stale, contradictory, or redundant.

## Prototype Workflow

1. **Load Failed Trace** — loads the synthetic banking scenario with a known incorrect response
2. **Analyze Context** — identifies stale, duplicate, conflicting, and irrelevant blocks
3. **Apply Optimization** — filters to only the verified, relevant blocks
4. **Replay Agent** — generates a new response using optimized context
5. **Evaluate** — deterministic tests score the response

## Architecture

```
apps/
  api/         Express backend — routes, services, Gemini client
  web/         React + Vite frontend dashboard
packages/
  shared/      Types, Zod schemas, fixtures, evaluation utilities
```

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
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

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

## Cloud Run Deployment

```bash
# Using source deployment (requires Dockerfile)
gcloud run deploy context-meter \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "USE_MOCK_GEMINI=true,NODE_ENV=production"

# Or using built image
docker tag context-meter gcr.io/YOUR_PROJECT/context-meter
docker push gcr.io/YOUR_PROJECT/context-meter
gcloud run deploy context-meter \
  --image gcr.io/YOUR_PROJECT/context-meter \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## API Documentation

### `GET /api/health`
Returns `{ "status": "ok", "service": "context-meter-api" }`.

### `GET /api/scenarios`
Returns available scenarios.

### `GET /api/scenarios/:scenarioId`
Returns full scenario details. Returns 404 for unknown IDs.

### `POST /api/analyze`
Body: `{ "task": string, "contextBlocks": ContextBlock[] }`
Returns analysis decisions, conflicts, and token estimates.

### `POST /api/replay`
Body: `{ "task": string, "selectedContextBlocks": ContextBlock[] }`
Returns optimized response with deterministic evaluation.

## Demo Scenario

The banking scenario demonstrates:
- **Baseline (incorrect)**: Uses outdated 2024 policy → wrong waiver decision, wrong limit ($5,000)
- **Optimized (correct)**: Uses current 2026 policy → correct waiver eligibility, correct limit ($10,000)

The baseline failure is stored as a fixture and is always deterministic.

## Known Limitations

- Token estimates use `ceil(chars/4)` approximation — not actual Gemini billing data
- Single demo scenario (banking)
- No persistence — state resets on page refresh
- Frontend is minimal and intended to be replaced with Google AI Studio-generated UI

## Post-Hackathon Roadmap

1. **Replace frontend**: Export the workflow state shape and swap in a Google AI Studio-generated React UI
2. **Add more scenarios**: Extend `packages/shared/src/fixtures.ts`
3. **Persistence**: Add Redis or Firestore for session state
4. **Real token counting**: Integrate Gemini token counting API
5. **Vector similarity**: Add semantic deduplication for context blocks

## Synthetic Data Notice

All customer data, account information, and banking scenarios in this project are entirely synthetic and fictional. This tool does not make real banking or lending decisions.
