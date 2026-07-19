import { Router } from "express";
import { ALL_SCENARIOS } from "@context-meter/shared";
import { createError } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", (_req, res) => {
  const summaries = ALL_SCENARIOS.map((s) => ({ id: s.id, title: s.title }));
  res.json({ scenarios: summaries });
});

router.get("/:scenarioId", (req, res, next) => {
  const { scenarioId } = req.params;
  const scenario = ALL_SCENARIOS.find((s) => s.id === scenarioId);

  if (!scenario) {
    return next(
      createError(
        `Scenario '${scenarioId}' not found.`,
        404,
        "SCENARIO_NOT_FOUND"
      )
    );
  }

  res.json(scenario);
});

export default router;
