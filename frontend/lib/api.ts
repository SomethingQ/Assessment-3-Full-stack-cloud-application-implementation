// Typed client for the Phoneme Activity Builder backend API.
//
// NEXT_PUBLIC_API_URL must be reachable from the browser (these calls run
// in client components), so in Docker Compose it should point at the
// published host port for the backend service, not the internal service
// hostname.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ActivityType = "WORDLE" | "WORD_SEARCH";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface ApiWord {
  id: string;
  activityId: string;
  phonemes: string[];
  english: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivity {
  id: string;
  name: string;
  type: ActivityType;
  difficulty: Difficulty;
  showHints: boolean;
  numGuesses: number | null;
  rows: number | null;
  cols: number | null;
  words: ApiWord[];
  createdAt: string;
  updatedAt: string;
}

export interface WordInput {
  phonemes: string[];
  english?: string;
  position?: number;
}

export interface ActivityInput {
  name: string;
  type: ActivityType;
  difficulty?: Difficulty;
  showHints?: boolean;
  numGuesses?: number;
  rows?: number;
  cols?: number;
  words?: WordInput[];
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
  } catch {
    throw new ApiRequestError(0, "Could not reach the API server. Is the backend running?");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      res.statusText ||
      "Request failed";
    throw new ApiRequestError(res.status, message, body?.details);
  }

  return body as T;
}

export function fetchActivities(type?: ActivityType): Promise<ApiActivity[]> {
  const query = type ? `?type=${type}` : "";
  return request<ApiActivity[]>(`/api/activities${query}`);
}

export function fetchActivity(id: string): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities/${id}`);
}

export function createActivity(input: ActivityInput): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateActivity(
  id: string,
  input: Partial<ActivityInput>,
): Promise<ApiActivity> {
  return request<ApiActivity>(`/api/activities/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteActivity(id: string): Promise<void> {
  return request<void>(`/api/activities/${id}`, { method: "DELETE" });
}

export function createWord(activityId: string, input: WordInput): Promise<ApiWord> {
  return request<ApiWord>(`/api/activities/${activityId}/words`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWord(wordId: string, input: Partial<WordInput>): Promise<ApiWord> {
  return request<ApiWord>(`/api/words/${wordId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteWord(wordId: string): Promise<void> {
  return request<void>(`/api/words/${wordId}`, { method: "DELETE" });
}

export function checkHealth(): Promise<{ status: string }> {
  return request<{ status: string }>(`/health`);
}
