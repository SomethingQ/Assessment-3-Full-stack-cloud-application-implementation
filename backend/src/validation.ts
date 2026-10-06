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

// Number of days of history to aggregate for reporting time series.
export const timeseriesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional().default(14),
});

// Client-side generation attempts reported by the Wordle / Word Search
// builders. These feed the success/failure counters on the dashboard.
export const generationEventSchema = z.object({
  activityType: activityTypeSchema,
  status: z.enum(["SUCCESS", "FAILURE"]),
  source: z.enum(["BUILDER", "SAVED"]).optional().default("BUILDER"),
  activityId: z.string().trim().min(1).optional(),
  wordCount: z.number().int().min(0).max(5000).optional().default(0),
  durationMs: z.number().int().min(0).max(600000).optional().default(0),
  errorMessage: z.string().trim().max(500).optional(),
});

// Time-on-page beacons sent when a visitor leaves a page.
export const pageViewSchema = z.object({
  path: z.string().trim().min(1).max(200),
  sessionId: z.string().trim().max(120).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional().default(0),
});

// Bulk simulated records used to populate the dashboard for reporting demos.
export const simulateSchema = z.object({
  activities: z.number().int().min(0).max(200).optional().default(0),
  generations: z.number().int().min(0).max(5000).optional().default(0),
  pageViews: z.number().int().min(0).max(5000).optional().default(0),
});

export type WordInput = z.infer<typeof wordInputSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
export type GenerationEventInput = z.infer<typeof generationEventSchema>;
export type PageViewInput = z.infer<typeof pageViewSchema>;
export type SimulateInput = z.infer<typeof simulateSchema>;
