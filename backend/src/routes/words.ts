import { Router } from "express";
import { prisma } from "../db";
import { ApiError } from "../middleware/errorHandler";
import { asyncHandler } from "../utils/asyncHandler";
import { wordUpdateSchema } from "../validation";

const router = Router();

// PUT /api/words/:wordId
router.put(
  "/words/:wordId",
  asyncHandler(async (req, res) => {
    const parsed = wordUpdateSchema.parse(req.body);

    const existing = await prisma.word.findUnique({ where: { id: req.params.wordId } });
    if (!existing) {
      throw new ApiError(404, "Word not found");
    }

    const word = await prisma.word.update({
      where: { id: req.params.wordId },
      data: parsed,
    });

    res.json(word);
  }),
);

// DELETE /api/words/:wordId
router.delete(
  "/words/:wordId",
  asyncHandler(async (req, res) => {
    const existing = await prisma.word.findUnique({ where: { id: req.params.wordId } });
    if (!existing) {
      throw new ApiError(404, "Word not found");
    }

    await prisma.word.delete({ where: { id: req.params.wordId } });
    res.status(204).send();
  }),
);

export default router;
