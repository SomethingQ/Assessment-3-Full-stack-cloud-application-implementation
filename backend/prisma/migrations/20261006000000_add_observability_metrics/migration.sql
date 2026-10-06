-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "GenerationSource" AS ENUM ('BUILDER', 'SAVED');

-- CreateTable
CREATE TABLE "generation_events" (
    "id" TEXT NOT NULL,
    "activityId" TEXT,
    "activityType" "ActivityType" NOT NULL,
    "status" "GenerationStatus" NOT NULL,
    "source" "GenerationSource" NOT NULL DEFAULT 'BUILDER',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sessionId" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_events_createdAt_idx" ON "generation_events"("createdAt");

-- CreateIndex
CREATE INDEX "generation_events_activityType_idx" ON "generation_events"("activityType");

-- CreateIndex
CREATE INDEX "generation_events_status_idx" ON "generation_events"("status");

-- CreateIndex
CREATE INDEX "generation_events_activityId_idx" ON "generation_events"("activityId");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- AddForeignKey
ALTER TABLE "generation_events" ADD CONSTRAINT "generation_events_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
