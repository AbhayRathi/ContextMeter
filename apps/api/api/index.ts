import { createApp } from "../src/app.js";

// Vercel Node.js serverless entrypoint: Express apps are callable as
// (req, res) => void, which matches the handler signature Vercel expects,
// so no adapter (e.g. serverless-http) is needed. `src/server.ts` (with
// app.listen) remains the entrypoint for local dev and the Docker image.
export default createApp();
