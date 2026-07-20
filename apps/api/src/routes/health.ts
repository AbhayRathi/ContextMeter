import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "context-meter-api",
    mode: config.useMockGemini ? "fallback" : "gemini",
  });
});

export default router;
