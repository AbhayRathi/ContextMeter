import { GoogleGenAI } from "@google/genai";

/**
 * Thin Gemini wrapper for the bench's own replay + judge calls. Deliberately
 * separate from apps/api's geminiClient: those calls are the *product*; these
 * are the *measurement rig*. The analyze call being measured still goes through
 * the live API. Reads GEMINI_API_KEY / GEMINI_MODEL straight from the env
 * (the bench process is started with --env-file or an exported key).
 */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 6;
const MAX_RETRY_WAIT_MS = 70_000;

function statusOf(err: unknown): number | undefined {
  const e = err as { status?: number; message?: string };
  if (typeof e?.status === "number") return e.status;
  const m = e?.message?.match(/"code":\s*(\d{3})/);
  return m ? Number(m[1]) : undefined;
}

/** Gemini 429s carry an authoritative "retryDelay":"51s" — honour it when present. */
function retryDelayMsOf(err: unknown): number | undefined {
  const msg = (err as { message?: string })?.message;
  const m = msg?.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
  return m ? Math.min(Math.ceil(Number(m[1]) * 1000) + 1000, MAX_RETRY_WAIT_MS) : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class BenchLLM {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private _calls = 0;

  constructor(apiKey = process.env["GEMINI_API_KEY"], model = process.env["GEMINI_MODEL"]) {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Run the bench with --env-file-if-exists=../../.env or export the key."
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = model || "gemini-flash-latest";
  }

  /** Total Gemini calls made — for cost accounting in the report. */
  get callCount(): number {
    return this._calls;
  }

  async generate(prompt: string): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        this._calls++;
        const res = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
        });
        const text = res.text;
        if (!text) throw new Error("Gemini returned an empty response");
        return text;
      } catch (err) {
        lastErr = err;
        const status = statusOf(err);
        if ((status !== undefined && !RETRYABLE.has(status)) || attempt === MAX_ATTEMPTS) throw err;
        const wait = retryDelayMsOf(err) ?? 500 * 2 ** (attempt - 1) * (0.5 + Math.random());
        await sleep(wait);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}
