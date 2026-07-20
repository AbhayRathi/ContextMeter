import { Router } from "express";
import { ALL_SCENARIOS } from "@context-meter/shared";
import { createError } from "../middleware/errorHandler.js";
import { toWireScenario } from "../adapters/studioContract.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(ALL_SCENARIOS.map(toWireScenario));
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

  res.json(toWireScenario(scenario));
});

export default router;
