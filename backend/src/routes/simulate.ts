import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { runSimulation } from "../services/simulateService";
import { simulateSchema } from "../validation";

const router = Router();

// POST /api/simulate
// Generates simulated input records (activities, generation events and page
// views) so the dashboard and reporting views can be demonstrated without
// manually entering data.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = simulateSchema.parse(req.body);
    const result = await runSimulation(parsed);
    res.status(201).json(result);
  }),
);

export default router;
