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

export async function generateWithGemini(
  prompt: string,
  timeoutMs = 15000
): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client is not available");
  }

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
  } finally {
    clearTimeout(timer);
  }
}
