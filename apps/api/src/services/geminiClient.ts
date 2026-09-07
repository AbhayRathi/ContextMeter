import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (config.useMockGemini || !config.geminiApiKey) {
    return null;
  }

  if (!_client) {
    _client = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }

  return _client;
}

export function isGeminiAvailable(): boolean {
  return !config.useMockGemini && Boolean(config.geminiApiKey);
}

/** Google returns these when the model is briefly overloaded — worth retrying, unlike a 400/404. */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const BASE_BACKOFF_MS = 500;

function statusCodeOf(err: unknown): number | undefined {
  // @google/genai surfaces the HTTP status either as err.status or embedded in the JSON message.
  const anyErr = err as { status?: number; message?: string };
  if (typeof anyErr?.status === "number") return anyErr.status;
  const match = anyErr?.message?.match(/"code":\s*(\d{3})/);
  return match ? Number(match[1]) : undefined;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateWithGemini(
  prompt: string,
  timeoutMs = 15000
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not available");
  }

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await client.models.generateContent({
        model: config.geminiModel,
        contents: prompt,
      });
      const text = result.text;
      if (!text) {
        throw new Error("Gemini returned an empty response");
      }
      return text;
    } catch (err) {
      lastErr = err;
      const status = statusCodeOf(err);
      const isRetryable = status === undefined || RETRYABLE_STATUS.has(status);
      if (!isRetryable || attempt === MAX_ATTEMPTS) {
        throw err;
      }
      // Exponential backoff with jitter: ~0.5s, ~1s, ~2s before attempts 2-4.
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1) * (0.5 + Math.random());
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
