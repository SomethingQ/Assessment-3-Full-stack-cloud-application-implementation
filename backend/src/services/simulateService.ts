import type { ActivityType, Difficulty } from "@prisma/client";

import { prisma } from "../db";

// Small phoneme + English pools used to fabricate realistic-looking builder
// input records for the reporting demo. These are simulated records only -
// nothing here changes how real activities are generated.
const PHONEME_WORDS: { phonemes: string[]; english: string }[] = [
  { phonemes: ["k", "æ", "t"], english: "cat" },
  { phonemes: ["d", "ɒ", "ɡ"], english: "dog" },
  { phonemes: ["ʃ", "ɪ", "p"], english: "ship" },
  { phonemes: ["tʃ", "æ", "t"], english: "chat" },
  { phonemes: ["b", "ʊ", "k"], english: "book" },
  { phonemes: ["m", "uː", "n"], english: "moon" },
  { phonemes: ["f", "ɪ", "ʃ"], english: "fish" },
  { phonemes: ["n", "æ", "p"], english: "nap" },
  { phonemes: ["ɹ", "æ", "t"], english: "rat" },
  { phonemes: ["s", "ʌ", "n"], english: "sun" },
  { phonemes: ["j", "ɛ", "s"], english: "yes" },
  { phonemes: ["w", "ɪ", "n"], english: "win" },
  { phonemes: ["dʒ", "æ", "m"], english: "jam" },
  { phonemes: ["θ", "ɪ", "n"], english: "thin" },
  { phonemes: ["l", "ɔ", "ɡ"], english: "log" },
];

const ACTIVITY_TYPES: ActivityType[] = ["WORDLE", "WORD_SEARCH"];
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const PATHS = ["/", "/wordle", "/wordsearch", "/activities", "/dashboard", "/about"];

export interface SimulateResult {
  activitiesCreated: number;
  generationsCreated: number;
  pageViewsCreated: number;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Creates a batch of simulated activities, generation events and page views.
// Counts default to a small demo-sized batch when the caller does not specify.
export async function runSimulation(input: {
  activities?: number;
  generations?: number;
  pageViews?: number;
}): Promise<SimulateResult> {
  const activityCount = input.activities ?? 5;
  const generationCount = input.generations ?? 30;
  const pageViewCount = input.pageViews ?? 40;

  const createdActivityIds: string[] = [];

  for (let i = 0; i < activityCount; i += 1) {
    const type = pick(ACTIVITY_TYPES);
    const difficulty = pick(DIFFICULTIES);
    const wordTotal = randomInt(3, 8);
    const wordPool = [...PHONEME_WORDS].sort(() => Math.random() - 0.5).slice(0, wordTotal);

    const activity = await prisma.activity.create({
      data: {
        name: `Simulated ${type === "WORDLE" ? "Wordle" : "Word Search"} #${Date.now()}-${i + 1}`,
        type,
        difficulty,
        showHints: Math.random() > 0.3,
        numGuesses: type === "WORDLE" ? randomInt(4, 8) : null,
        rows: type === "WORD_SEARCH" ? randomInt(8, 14) : null,
        cols: type === "WORD_SEARCH" ? randomInt(8, 14) : null,
        words: {
          create: wordPool.map((word, index) => ({
            phonemes: word.phonemes,
            english: word.english,
            position: index,
          })),
        },
      },
    });

    createdActivityIds.push(activity.id);
  }

  if (generationCount > 0) {
    const now = Date.now();
    await prisma.generationEvent.createMany({
      data: Array.from({ length: generationCount }, (_, i) => {
        const activityType = pick(ACTIVITY_TYPES);
        const failed = Math.random() < 0.15;
        return {
          activityId: createdActivityIds.length > 0 ? pick(createdActivityIds) : undefined,
          activityType,
          status: (failed ? "FAILURE" : "SUCCESS") as "SUCCESS" | "FAILURE",
          source: (Math.random() < 0.5 ? "BUILDER" : "SAVED") as "BUILDER" | "SAVED",
          wordCount: failed ? 0 : randomInt(2, 10),
          durationMs: failed ? randomInt(20, 120) : randomInt(120, 900),
          errorMessage: failed ? "Simulated generation failure (empty word list)" : undefined,
          // Spread the events across the last 14 days for the time series.
          createdAt: new Date(now - randomInt(0, 13) * 24 * 60 * 60 * 1000 - i * 1000),
        };
      }),
    });
  }

  if (pageViewCount > 0) {
    const now = Date.now();
    await prisma.pageView.createMany({
      data: Array.from({ length: pageViewCount }, (_, i) => ({
        path: pick(PATHS),
        sessionId: `sim-session-${randomInt(1, 40)}`,
        durationMs: randomInt(5_000, 240_000),
        createdAt: new Date(now - randomInt(0, 13) * 24 * 60 * 60 * 1000 - i * 1000),
      })),
    });
  }

  return {
    activitiesCreated: activityCount,
    generationsCreated: generationCount,
    pageViewsCreated: pageViewCount,
  };
}
