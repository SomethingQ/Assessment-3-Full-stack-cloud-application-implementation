import {
  reportGeneration,
  type ActivityType,
  type GenerationSource,
} from "@/lib/api";

interface RecordOptions {
  activityId?: string;
  wordCount?: number;
}

// Wraps a synchronous generation call so every attempt (success or failure) is
// reported to the backend observability endpoint with timing information.
// The original error is re-thrown so the caller can show a message.
export async function recordGenerationAttempt<T>(
  activityType: ActivityType,
  source: GenerationSource,
  run: () => T,
  options: RecordOptions = {},
): Promise<T> {
  const startedAt = Date.now();

  try {
    const result = run();
    void reportGeneration({
      activityType,
      status: "SUCCESS",
      source,
      activityId: options.activityId,
      wordCount: options.wordCount ?? 0,
      durationMs: Date.now() - startedAt,
    }).catch(() => {
      // Telemetry failures must never break the builder.
    });
    return result;
  } catch (error) {
    void reportGeneration({
      activityType,
      status: "FAILURE",
      source,
      activityId: options.activityId,
      wordCount: options.wordCount ?? 0,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown generation error",
    }).catch(() => {
      // Telemetry failures must never break the builder.
    });
    throw error;
  }
}
