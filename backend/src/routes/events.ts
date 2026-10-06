import { Router } from "express";

import { prisma } from "../db";
import { asyncHandler } from "../utils/asyncHandler";
import { generationEventSchema, pageViewSchema } from "../validation";

const router = Router();

// POST /api/events/generation
// Records a single client-side generation attempt. The builders call this
// once per generate action so the dashboard can report success/failure
// counts, average generation time and activity type usage.
router.post(
  "/events/generation",
  asyncHandler(async (req, res) => {
    const parsed = generationEventSchema.parse(req.body);

    const event = await prisma.generationEvent.create({
      data: {
        activityId: parsed.activityId,
        activityType: parsed.activityType,
        status: parsed.status,
        source: parsed.source,
        wordCount: parsed.wordCount,
        durationMs: parsed.durationMs,
        errorMessage: parsed.errorMessage,
      },
    });

    res.status(201).json(event);
  }),
);

// POST /api/events/pageview
// Records time on page. Used to derive the average time on page metric.
router.post(
  "/events/pageview",
  asyncHandler(async (req, res) => {
    const parsed = pageViewSchema.parse(req.body);

    const view = await prisma.pageView.create({
      data: {
        path: parsed.path,
        sessionId: parsed.sessionId,
        durationMs: parsed.durationMs,
      },
    });

    res.status(201).json(view);
  }),
);

export default router;
