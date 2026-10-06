import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic demo data so the dashboard and reporting views have content
// immediately after `npm run prisma:seed`. Safe to run repeatedly: it only
// adds rows, it never deletes existing records.
async function main() {
  const existing = await prisma.activity.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} activities already exist.`);
    return;
  }

  const cat = await prisma.activity.create({
    data: {
      name: "CVC Words - Set A",
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

  const digraphs = await prisma.activity.create({
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

  // An intentionally empty activity so the dashboard shows an empty-word-list
  // warning during the observability demonstration.
  await prisma.activity.create({
    data: {
      name: "Draft Activity (no words)",
      type: "WORDLE",
      difficulty: "HARD",
      numGuesses: 5,
    },
  });

  await prisma.generationEvent.createMany({
    data: [
      {
        activityId: cat.id,
        activityType: "WORD_SEARCH",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 4,
        durationMs: 240,
      },
      {
        activityId: cat.id,
        activityType: "WORD_SEARCH",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 4,
        durationMs: 310,
      },
      {
        activityId: digraphs.id,
        activityType: "WORDLE",
        status: "SUCCESS",
        source: "SAVED",
        wordCount: 3,
        durationMs: 180,
      },
      {
        activityId: digraphs.id,
        activityType: "WORDLE",
        status: "FAILURE",
        source: "BUILDER",
        wordCount: 0,
        durationMs: 90,
        errorMessage: "Empty word list",
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

  console.log("Seed complete: demo activities, generation events and page views created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
