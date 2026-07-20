import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import scenariosRouter from "./routes/scenarios.js";
import analyzeRouter from "./routes/analyze.js";
import analyzeHeuristicRouter from "./routes/analyzeHeuristic.js";
import replayRouter from "./routes/replay.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
});

export function createApp(): express.Application {
  const app = express();

  // Security. Drop upgrade-insecure-requests: Cloud Run/Vercel/etc. terminate TLS
  // in front of the app, so this process itself is always plain HTTP — with the
  // default CSP, browsers force every asset request to HTTPS and the same-origin
  // studio-web build fails to load whenever TLS isn't handled by this process
  // directly (e.g. `docker run` locally per the README, or this app behind a
  // plain-HTTP reverse proxy).
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: { upgradeInsecureRequests: null },
      },
    })
  );
  // Scoped to /api only — Vite's `crossorigin` attribute on module <script>/<link>
  // tags makes browsers send an Origin header even for same-origin asset loads,
  // and a global cors() would reject those against the allowlist with a JSON
  // error instead of serving the file. Static assets never need CORS at all.
  app.use(
    "/api",
    cors((req, callback) => {
      const origin = req.headers.origin;
      // Browsers send an Origin header on same-origin POSTs too, not just
      // cross-origin ones. In the same-origin deployment (studio-web served by
      // this same process), that Origin's host always equals req.headers.host —
      // that case must always be allowed, since the deployed domain (e.g. a
      // Cloud Run *.run.app URL) isn't known ahead of time to hardcode into
      // CORS_ORIGIN. The allowlist is for genuinely separate origins only.
      let isSameOrigin = false;
      try {
        isSameOrigin = !!origin && new URL(origin).host === req.headers.host;
      } catch {
        isSameOrigin = false;
      }

      if (!origin || isSameOrigin || config.corsOrigins.includes(origin)) {
        return callback(null, { origin: true, methods: ["GET", "POST"] });
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    })
  );

  // Logging
  if (config.nodeEnv !== "test") {
    app.use(morgan("combined"));
  }

  // Body parsing
  app.use(express.json({ limit: "1mb" }));

  // Rate limiting on all API routes
  app.use("/api", apiLimiter);

  // API routes
  app.use("/api/health", healthRouter);
  app.use("/api/scenarios", scenariosRouter);
  app.use("/api/analyze", analyzeRouter);
  app.use("/api/analyze/heuristic", analyzeHeuristicRouter);
  app.use("/api/replay", replayRouter);

  // Production static serving — same-origin so the studio-web frontend's
  // relative fetch('/api/...') calls resolve without CORS/proxy config.
  if (config.nodeEnv === "production") {
    const webDistPath = path.join(__dirname, "..", "..", "studio-web", "dist");
    app.use(express.static(webDistPath));
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
