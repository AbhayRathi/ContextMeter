import { createApp } from "../apps/api/src/app.js";

// Root-level catch-all Vercel function: this file's [...path] name means
// Vercel routes every /api/* request here while preserving the full
// original req.url, so the Express app's own /api/health, /api/scenarios,
// etc. routes match unchanged. Requests to anything outside /api/* never
// reach this function at all — Vercel's static layer (apps/studio-web/dist,
// per the root vercel.json) serves those directly, which is what makes this
// a true same-origin deployment without CORS/proxy config.
//
// Express apps are callable as (req, res) => void, matching the handler
// signature Vercel's Node runtime expects directly — no adapter needed.
export default createApp();
