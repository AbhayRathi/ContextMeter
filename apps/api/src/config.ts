export const config = {
  port: parseInt(process.env["API_PORT"] ?? process.env["PORT"] ?? "8080", 10),
  // Comma-separated list of allowed origins, e.g. "https://foo.app,https://bar.app".
  corsOrigins: (process.env["CORS_ORIGIN"] ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env["GEMINI_API_KEY"] ?? "",
  // Alias, not a pinned version: Google retires dated model IDs (gemini-2.0-flash
  // was pulled in 2026), which silently drops every /api/analyze and /api/replay
  // call to the fallback engine. Pin a specific version here only alongside the
  // response-caching work that the deterministic-replay roadmap item needs.
  geminiModel: process.env["GEMINI_MODEL"] ?? "gemini-flash-latest",
  useMockGemini: (process.env["USE_MOCK_GEMINI"] ?? "true") === "true",
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  // Requests per minute per IP on /api. Raise for local batch work (the bench
  // harness fires hundreds of analyze calls back-to-back); keep modest in prod.
  rateLimitMax: parseInt(process.env["RATE_LIMIT_MAX"] ?? "60", 10),
} as const;
