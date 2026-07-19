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

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
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
  app.use("/api/replay", replayRouter);

  // Production static serving
  if (config.nodeEnv === "production") {
    const webDistPath = path.join(__dirname, "..", "..", "web", "dist");
    app.use(express.static(webDistPath));
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
