import { createApp } from "./app.js";
import { config } from "./config.js";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[ContextMeter API] Listening on http://0.0.0.0:${config.port}`);
  console.log(`[ContextMeter API] Mode: ${config.useMockGemini ? "mock/fallback" : "gemini"}`);
});
