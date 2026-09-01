import { Router } from "express";
import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { asyncHandler } from "../utils/asyncHandler";
import {
  activityCreateSchema,
  activityQuerySchema,
  activityUpdateSchema,
  wordInputSchema,
} from "../validation";

const router = Router();

const wordsOrderBy = { orderBy: { position: "asc" as const } };

// GET /api/activities?type=WORDLE|WORD_SEARCH
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = activityQuerySchema.parse(req.query);

    const activities = await prisma.activity.findMany({
      where: query.type ? { type: query.type } : undefined,
      include: { words: wordsOrderBy },
      orderBy: { updatedAt: "desc" },
    });

    res.json(activities);
  }),
);

// GET /api/activities/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: { words: wordsOrderBy },
    });

    if (!activity) {
      throw new ApiError(404, "Activity not found");
    }

    res.json(activity);
  }),
);

// POST /api/activities
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = activityCreateSchema.parse(req.body);
    const { words, ...activityData } = parsed;

    const activity = await prisma.activity.create({
      data: {
        ...activityData,
        words: {
          create: words.map((word, index) => ({
            phonemes: word.phonemes,
            english: word.english,
            position: word.position ?? index,
          })),
        },
      },
      include: { words: wordsOrderBy },
    });

    res.status(201).json(activity);
  }),
);

// PUT /api/activities/:id
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = activityUpdateSchema.parse(req.body);

    const existing = await prisma.activity.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new ApiError(404, "Activity not found");
    }

    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: parsed,
      include: { words: wordsOrderBy },
    });

    res.json(activity);
  }),
);

// DELETE /api/activities/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.activity.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new ApiError(404, "Activity not found");
    }

    await prisma.activity.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// POST /api/activities/:id/words - add a word to an existing activity.
router.post(
  "/:id/words",
  asyncHandler(async (req, res) => {
    const parsed = wordInputSchema.parse(req.body);

    const activity = await prisma.activity.findUnique({ where: { id: req.params.id } });
    if (!activity) {
      throw new ApiError(404, "Activity not found");
    }

    const wordCount = await prisma.word.count({ where: { activityId: req.params.id } });

    const word = await prisma.word.create({
      data: {
        activityId: req.params.id,
        phonemes: parsed.phonemes,
        english: parsed.english,
        position: parsed.position ?? wordCount,
      },
    });

    res.status(201).json(word);
  }),
);

export default router;
