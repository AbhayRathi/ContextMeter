export const config = {
  port: parseInt(process.env["API_PORT"] ?? process.env["PORT"] ?? "8080", 10),
  // Comma-separated list of allowed origins, e.g. "https://foo.app,https://bar.app".
  corsOrigins: (process.env["CORS_ORIGIN"] ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env["GEMINI_API_KEY"] ?? "",
  geminiModel: process.env["GEMINI_MODEL"] ?? "gemini-2.0-flash",
  useMockGemini: (process.env["USE_MOCK_GEMINI"] ?? "true") === "true",
  nodeEnv: process.env["NODE_ENV"] ?? "development",
} as const;
