# @context-meter/cli

Context regression testing for AI agents — CI for what your agent knows.

Runs a context set (docs, memory, retrieved chunks) through ContextMeter's
heuristic analyze → replay → evaluate pipeline against a running `apps/api`
instance, and exits non-zero if it finds a conflict or the eval score drops
below a threshold you set. Point it at your own context, not just the 3 demo
scenarios — the heuristic engine is generic similarity/recency math, not a
fixture lookup.

## Usage

```bash
npx contextmeter test --config ./contextmeter.config.json
```

Bare `npx contextmeter` also works — `test` is the default command.

## Config

`contextmeter.config.json`:

```json
{
  "apiUrl": "http://localhost:8080",
  "task": "What is our current wire-transfer limit?",
  "contextBlocksFile": "./context-blocks.json",
  "failOn": {
    "conflict": true,
    "minScore": 80
  }
}
```

- `apiUrl` — a running `apps/api` instance. Defaults to `http://localhost:8080`.
- `apiKey` — optional. Sent as `Authorization: Bearer <apiKey>`; a no-op until
  the API has real auth, but safe to set now.
- `contextBlocksFile` — path (relative to the config file) to a JSON array of
  `ContextBlock` objects (see `@context-meter/shared`).
- `failOn.conflict` — fail the run if any conflict is detected.
- `failOn.minScore` — fail the run if the replay evaluation score (0–100)
  drops below this number.

## In CI

```yaml
- run: npx contextmeter test --config ./contextmeter.config.json
```

No dedicated GitHub Action needed — this is just another `run:` step.
