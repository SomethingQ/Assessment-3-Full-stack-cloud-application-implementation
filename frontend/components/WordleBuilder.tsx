"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  ApiRequestError,
  fetchActivities,
  fetchActivity,
  type ApiActivity,
} from "@/lib/api";
import { downloadHTML } from "@/lib/helpers/exportFile";
import { generateWordleHTML } from "@/lib/helpers/wordleBuilder";
import { recordGenerationAttempt } from "@/lib/instrumentation";

interface WordleFormValues {
  phonemeWord: string;
  englishWord: string;
  numGuesses: string;
  showHints: boolean;
}

export default function WordleBuilder() {
  const [html, setHtml] = useState("");
  const [generateError, setGenerateError] = useState("");

  const [savedActivities, setSavedActivities] = useState<ApiActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [selectedWordId, setSelectedWordId] = useState("");
  const [savedError, setSavedError] = useState("");
  const [isGeneratingFromSaved, setIsGeneratingFromSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActivities("WORDLE")
      .then((data) => {
        if (!cancelled) setSavedActivities(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setSavedError(err instanceof ApiRequestError ? err.message : "Failed to load saved activities");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedActivity = savedActivities.find((a) => a.id === selectedActivityId);

  async function handleGenerateFromSaved(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedActivity || !selectedWordId) return;

    setSavedError("");
    setIsGeneratingFromSaved(true);
    try {
      const full = await fetchActivity(selectedActivity.id);
      const word = full.words.find((w) => w.id === selectedWordId);
      if (!word) throw new Error("Selected word could not be found");

      const generated = await recordGenerationAttempt(
        "WORDLE",
        "SAVED",
        () =>
          generateWordleHTML({
            targetPhonemes: word.phonemes,
            targetEnglish: word.english ?? "",
            numGuesses: full.numGuesses ?? 6,
            showHints: full.showHints,
          }),
        { activityId: full.id, wordCount: word.phonemes.length },
      );
      setHtml(generated);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : "Failed to generate from saved activity");
    } finally {
      setIsGeneratingFromSaved(false);
    }
  }

  async function handleGenerateWordle({
    phonemeWord,
    englishWord,
    numGuesses,
    showHints,
  }: WordleFormValues) {
    setGenerateError("");
    const targetPhonemes = phonemeWord.trim() ? phonemeWord.trim().split(/\s+/) : [];
    try {
      const generated = await recordGenerationAttempt(
        "WORDLE",
        "BUILDER",
        () =>
          generateWordleHTML({
            targetPhonemes,
            targetEnglish: englishWord,
            numGuesses: Number(numGuesses) || 6,
            showHints,
          }),
        { wordCount: targetPhonemes.length },
      );
      setHtml(generated);
    } catch (err) {
      setHtml("");
      setGenerateError(err instanceof Error ? err.message : "Failed to generate Wordle");
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void handleGenerateWordle({
      phonemeWord: String(formData.get("phonemeWord") ?? ""),
      englishWord: String(formData.get("englishWord") ?? ""),
      numGuesses: String(formData.get("numGuesses") ?? ""),
      showHints: formData.get("showHints") === "first-letter",
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center space-y-6 px-6 py-20">
      <section className="w-full rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Wordle Game generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          You can generate a Wordle game by entering a phoneme word, an English
          word, the number of attempts, and whether to show hints. After
          generating the preview, you can download the HTML file for the game.
        </p>
        <hr className="mt-6 w-full border-slate-600 dark:border-slate-300" />
      </section>
      <section className="w-full rounded-2xl py-6 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 text-start">
          <label htmlFor="wordle-phoneme-word">Phoneme Word</label>
          <textarea
            id="wordle-phoneme-word"
            name="phonemeWord"
            placeholder="Enter a phoneme word"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label htmlFor="wordle-english-word">English Word</label>
          <textarea
            id="wordle-english-word"
            name="englishWord"
            placeholder="Enter a word"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label htmlFor="wordle-num-guesses">Attempts</label>
          <input
            id="wordle-num-guesses"
            name="numGuesses"
            type="number"
            placeholder="Enter number of attempts"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label htmlFor="wordle-show-hints">Hints</label>
          <select
            id="wordle-show-hints"
            name="showHints"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          >
            <option value="none">No</option>
            <option value="first-letter">Yes</option>
          </select>
          <button
            type="submit"
            className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Generate Preview
          </button>
          {generateError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {generateError}
            </p>
          )}
          {html && (
            <button
              type="button"
              onClick={() => downloadHTML("phoneme-wordle-21992617.html", html)}
            >
              Download HTML File
            </button>
          )}
        </form>
      </section>
      <section className="w-full rounded-2xl py-6 backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Generate from Saved Word List
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Load a word saved on the{" "}
          <a href="/activities" className="text-indigo-700 underline dark:text-indigo-400">
            Activities
          </a>{" "}
          page and generate a Wordle from stored data.
        </p>
        {savedError && <p className="mt-2 text-sm text-red-600">{savedError}</p>}
        <form
          onSubmit={handleGenerateFromSaved}
          className="mt-4 flex flex-col gap-4 text-start sm:flex-row sm:items-end"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="wordle-saved-activity">Saved Activity</label>
            <select
              id="wordle-saved-activity"
              value={selectedActivityId}
              onChange={(e) => {
                setSelectedActivityId(e.target.value);
                setSelectedWordId("");
              }}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="">Select an activity</option>
              {savedActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="wordle-saved-word">Word</label>
            <select
              id="wordle-saved-word"
              value={selectedWordId}
              onChange={(e) => setSelectedWordId(e.target.value)}
              disabled={!selectedActivity}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="">Select a word</option>
              {selectedActivity?.words.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.phonemes.join(" ")}
                  {w.english ? ` (${w.english})` : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedWordId || isGeneratingFromSaved}
            className="rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isGeneratingFromSaved ? "Generating..." : "Generate from Saved"}
          </button>
        </form>
      </section>
      <section className="flex min-h-[700px] w-full flex-col rounded-2xl py-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Preview
        </h2>
        <iframe
          srcDoc={html}
          title="Wordle Preview"
          className="w-full flex-1 rounded border border-gray-300"
        />
      </section>
    </main>
  );
}
