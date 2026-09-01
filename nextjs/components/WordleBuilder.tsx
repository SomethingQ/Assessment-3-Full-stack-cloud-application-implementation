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

interface WordleFormValues {
  phonemeWord: string;
  englishWord: string;
  numGuesses: string;
  showHints: boolean;
}

export default function WordleBuilder() {
  const [html, setHtml] = useState("");

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

      const generated = generateWordleHTML({
        targetPhonemes: word.phonemes,
        targetEnglish: word.english ?? "",
        numGuesses: full.numGuesses ?? 6,
        showHints: full.showHints,
      });
      setHtml(generated);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : "Failed to generate from saved activity");
    } finally {
      setIsGeneratingFromSaved(false);
    }
  }

  function handleGenerateWordle({
    phonemeWord,
    englishWord,
    numGuesses,
    showHints,
  }: WordleFormValues) {
    const generated = generateWordleHTML({
      targetPhonemes: phonemeWord.trim() ? phonemeWord.trim().split(/\s+/) : [],
      targetEnglish: englishWord,
      numGuesses: Number(numGuesses) || 6,
      showHints,
    });
    setHtml(generated);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleGenerateWordle({
      phonemeWord: String(formData.get("phonemeWord") ?? ""),
      englishWord: String(formData.get("englishWord") ?? ""),
      numGuesses: String(formData.get("numGuesses") ?? ""),
      showHints: formData.get("showHints") === "first-letter",
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center space-y-6 px-6 py-20">
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
          <label>Phoneme Word</label>
          <textarea
            name="phonemeWord"
            placeholder="Enter a phoneme word"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label>English Word</label>
          <textarea
            name="englishWord"
            placeholder="Enter a word"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label>Attempts</label>
          <input
            name="numGuesses"
            type="number"
            placeholder="Enter number of attempts"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label>Hints</label>
          <select
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
            <label>Saved Activity</label>
            <select
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
            <label>Word</label>
            <select
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
    </div>
  );
}
