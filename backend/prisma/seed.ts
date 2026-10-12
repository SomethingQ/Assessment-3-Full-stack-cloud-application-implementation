import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Curated demo data so a new user immediately has usable Wordle and Word Search
// activities to load, plus a little observability data for the dashboard.
// Safe to run repeatedly: it skips if any activities already exist.
async function main() {
  const existing = await prisma.activity.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} activities already exist.`);
    return;
  }

  const cvcSearch = await prisma.activity.create({
    data: {
      name: "CVC Words - Word Search",
      type: "WORD_SEARCH",
      difficulty: "EASY",
      showHints: true,
      rows: 10,
      cols: 10,
      words: {
        create: [
          { phonemes: ["k", "æ", "t"], english: "cat", position: 0 },
          { phonemes: ["d", "ɒ", "ɡ"], english: "dog", position: 1 },
          { phonemes: ["s", "ʌ", "n"], english: "sun", position: 2 },
          { phonemes: ["n", "æ", "p"], english: "nap", position: 3 },
        ],
      },
    },
  });

  const digraphSearch = await prisma.activity.create({
    data: {
      name: "Digraphs - Word Search",
      type: "WORD_SEARCH",
      difficulty: "MEDIUM",
      showHints: true,
      rows: 12,
      cols: 12,
      words: {
        create: [
          { phonemes: ["ʃ", "ɪ", "p"], english: "ship", position: 0 },
          { phonemes: ["tʃ", "æ", "t"], english: "chat", position: 1 },
          { phonemes: ["θ", "ɪ", "n"], english: "thin", position: 2 },
          { phonemes: ["dʒ", "æ", "m"], english: "jam", position: 3 },
        ],
      },
    },
  });

  const digraphWordle = await prisma.activity.create({
    data: {
      name: "Digraphs - Wordle",
      type: "WORDLE",
      difficulty: "MEDIUM",
      showHints: true,
      numGuesses: 6,
      words: {
        create: [
          { phonemes: ["tʃ", "æ", "t"], english: "chat", position: 0 },
          { phonemes: ["ʃ", "ɪ", "p"], english: "ship", position: 1 },
          { phonemes: ["θ", "ɪ", "n"], english: "thin", position: 2 },
        ],
      },
    },
  });

  const longVowelWordle = await prisma.activity.create({
    data: {
      name: "Long Vowels - Wordle",
      type: "WORDLE",
      difficulty: "EASY",
      showHints: true,
      numGuesses: 6,
      words: {
        create: [
          { phonemes: ["b", "ʉː", "t"], english: "boot", position: 0 },
          { phonemes: ["b", "æɪ", "t"], english: "bait", position: 1 },
          { phonemes: ["l", "ɔ", "ɡ"], english: "log", position: 2 },
        ],
      },
    },
  });

  await prisma.generationEvent.createMany({
    data: [
      {
        activityId: cvcSearch.id,
        activityType: "WORD_SEARCH",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 4,
        durationMs: 240,
      },
      {
        activityId: digraphSearch.id,
        activityType: "WORD_SEARCH",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 4,
        durationMs: 310,
      },
      {
        activityId: digraphSearch.id,
        activityType: "WORD_SEARCH",
        status: "FAILURE",
        source: "BUILDER",
        wordCount: 0,
        durationMs: 90,
        errorMessage: "No words fitted the grid",
      },
      {
        activityId: digraphWordle.id,
        activityType: "WORDLE",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 3,
        durationMs: 180,
      },
      {
        activityId: longVowelWordle.id,
        activityType: "WORDLE",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 3,
        durationMs: 200,
      },
      {
        activityId: longVowelWordle.id,
        activityType: "WORDLE",
        status: "SUCCESS",
        source: "BUILDER",
        wordCount: 3,
        durationMs: 150,
      },
    ],
  });

  await prisma.pageView.createMany({
    data: [
      { path: "/", durationMs: 15_000 },
      { path: "/activities", durationMs: 95_000 },
      { path: "/wordle", durationMs: 140_000 },
      { path: "/wordsearch", durationMs: 120_000 },
      { path: "/dashboard", durationMs: 80_000 },
    ],
  });

  console.log(
    "Seed complete: 4 sample activities (2 Word Search, 2 Wordle), generation events and page views created.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
