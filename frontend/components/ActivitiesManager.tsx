"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ApiRequestError,
  createActivity,
  createWord,
  deleteActivity,
  deleteWord,
  fetchActivities,
  updateActivity,
  updateWord,
  type ApiActivity,
  type ApiWord,
  type ActivityType,
  type Difficulty,
} from "@/lib/api";

function parsePhonemes(raw: string): string[] {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

interface DraftWord {
  phonemes: string;
  english: string;
}

function emptyDraftWord(): DraftWord {
  return { phonemes: "", english: "" };
}

export default function ActivitiesManager() {
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<ActivityType>("WORD_SEARCH");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [showHints, setShowHints] = useState(true);
  const [numGuesses, setNumGuesses] = useState("6");
  const [rows, setRows] = useState("10");
  const [cols, setCols] = useState("10");
  const [draftWords, setDraftWords] = useState<DraftWord[]>([emptyDraftWord()]);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      const data = await fetchActivities();
      setActivities(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadActivities();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [loadActivities]);

  function updateDraftWord(index: number, patch: Partial<DraftWord>) {
    setDraftWords((prev) =>
      prev.map((word, i) => (i === index ? { ...word, ...patch } : word)),
    );
  }

  function addDraftWordRow() {
    setDraftWords((prev) => [...prev, emptyDraftWord()]);
  }

  function removeDraftWordRow(index: number) {
    setDraftWords((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreateActivity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError("");

    const words = draftWords
      .map((word) => ({
        phonemes: parsePhonemes(word.phonemes),
        english: word.english.trim() || undefined,
      }))
      .filter((word) => word.phonemes.length > 0);

    if (!name.trim()) {
      setCreateError("Name is required");
      return;
    }
    if (words.length === 0) {
      setCreateError("Add at least one word with phonemes");
      return;
    }

    setIsCreating(true);
    try {
      await createActivity({
        name: name.trim(),
        type,
        difficulty,
        showHints,
        numGuesses: type === "WORDLE" ? Number(numGuesses) || 6 : undefined,
        rows: type === "WORD_SEARCH" ? Number(rows) || 10 : undefined,
        cols: type === "WORD_SEARCH" ? Number(cols) || 10 : undefined,
        words,
      });
      setName("");
      setDraftWords([emptyDraftWord()]);
      await loadActivities();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center space-y-6 px-6 py-20">
      <section className="w-full rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Saved Activities
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Create, edit and delete phoneme-based word lists and activity
          settings. Saved activities can then be loaded from the Wordle and
          Word Search builders to generate downloadable HTML activities from
          stored data.
        </p>
        <hr className="mt-6 w-full border-slate-600 dark:border-slate-300" />
      </section>

      <section className="w-full rounded-2xl py-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Create New Activity
        </h2>
        <form onSubmit={handleCreateActivity} className="flex flex-col space-y-4 text-start">
          <label htmlFor="create-activity-name">Activity Name</label>
          <input
            id="create-activity-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CVC Words - Set A"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />

          <label htmlFor="create-activity-type">Activity Type</label>
          <select
            id="create-activity-type"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          >
            <option value="WORD_SEARCH">Word Search</option>
            <option value="WORDLE">Wordle</option>
          </select>

          <label htmlFor="create-activity-difficulty">Difficulty</label>
          <select
            id="create-activity-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <label htmlFor="create-activity-hints">Hints</label>
          <select
            id="create-activity-hints"
            value={showHints ? "yes" : "no"}
            onChange={(e) => setShowHints(e.target.value === "yes")}
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          {type === "WORDLE" ? (
            <>
              <label htmlFor="create-activity-guesses">Attempts</label>
              <input
                id="create-activity-guesses"
                type="number"
                value={numGuesses}
                onChange={(e) => setNumGuesses(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              />
            </>
          ) : (
            <>
              <label htmlFor="create-activity-rows">Rows</label>
              <input
                id="create-activity-rows"
                type="number"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              />
              <label htmlFor="create-activity-cols">Columns</label>
              <input
                id="create-activity-cols"
                type="number"
                value={cols}
                onChange={(e) => setCols(e.target.value)}
                className="ml-2 rounded border border-gray-300 px-2 py-1"
              />
            </>
          )}

          <div className="space-y-3">
            <span className="block">Words (phonemes separated by spaces)</span>
            {draftWords.map((word, index) => (
              <div key={index} className="ml-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  aria-label={`Word ${index + 1} phonemes`}
                  value={word.phonemes}
                  onChange={(e) => updateDraftWord(index, { phonemes: e.target.value })}
                  placeholder="k æ t"
                  className="rounded border border-gray-300 px-2 py-1"
                />
                <input
                  aria-label={`Word ${index + 1} English (optional)`}
                  value={word.english}
                  onChange={(e) => updateDraftWord(index, { english: e.target.value })}
                  placeholder="English word (optional)"
                  className="rounded border border-gray-300 px-2 py-1"
                />
                {draftWords.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDraftWordRow(index)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDraftWordRow}
              className="ml-2 text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-400"
            >
              + Add another word
            </button>
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <button
            type="submit"
            disabled={isCreating}
            className="mt-2 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isCreating ? "Saving..." : "Save Activity"}
          </button>
        </form>
      </section>

      <section className="w-full rounded-2xl py-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Existing Activities
        </h2>
        {isLoading && <p className="text-slate-600 dark:text-slate-300">Loading...</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!isLoading && !loadError && activities.length === 0 && (
          <p className="text-slate-600 dark:text-slate-300">No saved activities yet.</p>
        )}
        <div className="space-y-6">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onChanged={loadActivities} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ActivityCard({
  activity,
  onChanged,
}: {
  activity: ApiActivity;
  onChanged: () => void | Promise<void>;
}) {
  const [name, setName] = useState(activity.name);
  const [difficulty, setDifficulty] = useState<Difficulty>(activity.difficulty);
  const [showHints, setShowHints] = useState(activity.showHints);
  const [numGuesses, setNumGuesses] = useState(String(activity.numGuesses ?? 6));
  const [rows, setRows] = useState(String(activity.rows ?? 10));
  const [cols, setCols] = useState(String(activity.cols ?? 10));
  const [settingsError, setSettingsError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newWord, setNewWord] = useState<DraftWord>(emptyDraftWord());
  const [wordError, setWordError] = useState("");
  const [isAddingWord, setIsAddingWord] = useState(false);

  async function handleSaveSettings() {
    setSettingsError("");
    setIsSavingSettings(true);
    try {
      await updateActivity(activity.id, {
        name: name.trim() || activity.name,
        difficulty,
        showHints,
        numGuesses: activity.type === "WORDLE" ? Number(numGuesses) || 6 : undefined,
        rows: activity.type === "WORD_SEARCH" ? Number(rows) || 10 : undefined,
        cols: activity.type === "WORD_SEARCH" ? Number(cols) || 10 : undefined,
      });
      await onChanged();
    } catch (err) {
      setSettingsError(errorMessage(err));
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleDeleteActivity() {
    if (!window.confirm(`Delete "${activity.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteActivity(activity.id);
      await onChanged();
    } catch (err) {
      setSettingsError(errorMessage(err));
      setIsDeleting(false);
    }
  }

  async function handleAddWord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWordError("");
    const phonemes = parsePhonemes(newWord.phonemes);
    if (phonemes.length === 0) {
      setWordError("Enter at least one phoneme");
      return;
    }
    setIsAddingWord(true);
    try {
      await createWord(activity.id, {
        phonemes,
        english: newWord.english.trim() || undefined,
      });
      setNewWord(emptyDraftWord());
      await onChanged();
    } catch (err) {
      setWordError(errorMessage(err));
    } finally {
      setIsAddingWord(false);
    }
  }

  return (
    <div
      data-testid="activity-card"
      data-activity-name={activity.name}
      className="rounded-xl border border-slate-300 p-4 dark:border-slate-700"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
            {activity.type === "WORDLE" ? "Wordle" : "Word Search"}
          </span>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
            {activity.words.length} word{activity.words.length === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDeleteActivity}
          disabled={isDeleting}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Activity"}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-start sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor={`card-name-${activity.id}`} className="text-sm">
            Name
          </label>
          <input
            id={`card-name-${activity.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`card-difficulty-${activity.id}`} className="text-sm">
            Difficulty
          </label>
          <select
            id={`card-difficulty-${activity.id}`}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`card-hints-${activity.id}`} className="text-sm">
            Hints
          </label>
          <select
            id={`card-hints-${activity.id}`}
            value={showHints ? "yes" : "no"}
            onChange={(e) => setShowHints(e.target.value === "yes")}
            className="rounded border border-gray-300 px-2 py-1"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {activity.type === "WORDLE" ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={`card-guesses-${activity.id}`} className="text-sm">
              Attempts
            </label>
            <input
              id={`card-guesses-${activity.id}`}
              type="number"
              value={numGuesses}
              onChange={(e) => setNumGuesses(e.target.value)}
              className="w-24 rounded border border-gray-300 px-2 py-1"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor={`card-rows-${activity.id}`} className="text-sm">
                Rows
              </label>
              <input
                id={`card-rows-${activity.id}`}
                type="number"
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`card-cols-${activity.id}`} className="text-sm">
                Columns
              </label>
              <input
                id={`card-cols-${activity.id}`}
                type="number"
                value={cols}
                onChange={(e) => setCols(e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1"
              />
            </div>
          </>
        )}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSavingSettings}
          className="rounded-lg bg-indigo-700 px-3 py-1.5 text-sm text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isSavingSettings ? "Saving..." : "Save Settings"}
        </button>
      </div>
      {settingsError && <p className="mt-2 text-sm text-red-600">{settingsError}</p>}

      <div className="mt-4 space-y-2">
        {activity.words.map((word) => (
          <WordRow key={word.id} word={word} onChanged={onChanged} />
        ))}
      </div>

      <form onSubmit={handleAddWord} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          aria-label={`New word phonemes for ${activity.name}`}
          value={newWord.phonemes}
          onChange={(e) => setNewWord((prev) => ({ ...prev, phonemes: e.target.value }))}
          placeholder="k æ t"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <input
          aria-label={`New word English (optional) for ${activity.name}`}
          value={newWord.english}
          onChange={(e) => setNewWord((prev) => ({ ...prev, english: e.target.value }))}
          placeholder="English word (optional)"
          className="rounded border border-gray-300 px-2 py-1"
        />
        <button
          type="submit"
          disabled={isAddingWord}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600 disabled:opacity-50"
        >
          {isAddingWord ? "Adding..." : "+ Add Word"}
        </button>
      </form>
      {wordError && <p className="mt-2 text-sm text-red-600">{wordError}</p>}
    </div>
  );
}

function WordRow({
  word,
  onChanged,
}: {
  word: ApiWord;
  onChanged: () => void | Promise<void>;
}) {
  const [phonemes, setPhonemes] = useState(word.phonemes.join(" "));
  const [english, setEnglish] = useState(word.english ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    setError("");
    const parsed = parsePhonemes(phonemes);
    if (parsed.length === 0) {
      setError("Enter at least one phoneme");
      return;
    }
    setIsSaving(true);
    try {
      await updateWord(word.id, { phonemes: parsed, english: english.trim() || undefined });
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteWord(word.id);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err));
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-slate-200 p-2 sm:flex-row sm:items-center dark:border-slate-700">
      <input
        aria-label="Word phonemes"
        value={phonemes}
        onChange={(e) => setPhonemes(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1"
      />
      <input
        aria-label="Word English (optional)"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
        placeholder="English word"
        className="rounded border border-gray-300 px-2 py-1"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-indigo-700 px-2 py-1 text-xs text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-500 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
