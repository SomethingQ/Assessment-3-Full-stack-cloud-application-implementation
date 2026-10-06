import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import {
  getDashboardMetrics,
  getReportMetrics,
  getTimeseries,
} from "../services/metricsService";
import { timeseriesQuerySchema } from "../validation";

const router = Router();

// GET /api/metrics/dashboard
router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    res.json(await getDashboardMetrics());
  }),
);

// GET /api/metrics/timeseries?days=14
router.get(
  "/timeseries",
  asyncHandler(async (req, res) => {
    const { days } = timeseriesQuerySchema.parse(req.query);
    res.json(await getTimeseries(days));
  }),
);

// GET /api/metrics/report
router.get(
  "/report",
  asyncHandler(async (_req, res) => {
    res.json(await getReportMetrics());
  }),
);

export default router;
