import { z } from "zod";

// A single phoneme unit may be more than one character (e.g. the IPA
// digraph "tʃ"), so words are stored/validated as an ordered array of
// non-empty strings rather than being split into individual characters.
export const wordInputSchema = z.object({
  phonemes: z
    .array(z.string().trim().min(1, "Phoneme units cannot be empty"))
    .min(1, "At least one phoneme is required"),
  english: z
    .string()
    .trim()
    .max(120, "English word must be 120 characters or fewer")
    .optional(),
  position: z.number().int().min(0).optional(),
});

export const wordUpdateSchema = wordInputSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const activityTypeSchema = z.enum(["WORDLE", "WORD_SEARCH"]);
const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

const baseActivitySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  type: activityTypeSchema,
  difficulty: difficultySchema.optional().default("MEDIUM"),
  showHints: z.boolean().optional().default(true),
  numGuesses: z.number().int().min(1, "Must allow at least 1 guess").max(20).optional(),
  rows: z.number().int().min(3, "Grid must be at least 3 rows").max(30).optional(),
  cols: z.number().int().min(3, "Grid must be at least 3 columns").max(30).optional(),
});

export const activityCreateSchema = baseActivitySchema
  .extend({ words: z.array(wordInputSchema).optional().default([]) })
  .transform((data) => ({
    ...data,
    numGuesses: data.type === "WORDLE" ? data.numGuesses ?? 6 : null,
    rows: data.type === "WORD_SEARCH" ? data.rows ?? 10 : null,
    cols: data.type === "WORD_SEARCH" ? data.cols ?? 10 : null,
  }));

export const activityUpdateSchema = baseActivitySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const activityQuerySchema = z.object({
  type: activityTypeSchema.optional(),
});

export type WordInput = z.infer<typeof wordInputSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
