"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  ApiRequestError,
  fetchActivities,
  fetchActivity,
  type ApiActivity,
} from "@/lib/api";
import { downloadHTML } from "@/lib/helpers/exportFile";
import { generateWordSearchHTML } from "@/lib/helpers/wordSearchBuilder";

interface WordSearchFormValues {
  wordList: { phonemes: string[] }[];
  rows: string;
  cols: string;
  showHints: boolean;
}

export default function WordSearchBuilder() {
  const [html, setHtml] = useState("");

  const [savedActivities, setSavedActivities] = useState<ApiActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [savedError, setSavedError] = useState("");
  const [isGeneratingFromSaved, setIsGeneratingFromSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActivities("WORD_SEARCH")
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

  async function handleGenerateFromSaved(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedActivityId) return;

    setSavedError("");
    setIsGeneratingFromSaved(true);
    try {
      const full = await fetchActivity(selectedActivityId);
      if (full.words.length === 0) {
        throw new Error("This activity has no saved words yet");
      }

      const generated = generateWordSearchHTML({
        words: full.words.map((w) => ({ phonemes: w.phonemes, english: w.english ?? undefined })),
        rows: full.rows ?? 10,
        cols: full.cols ?? 10,
        showHints: full.showHints,
      });
      setHtml(generated);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : "Failed to generate from saved activity");
    } finally {
      setIsGeneratingFromSaved(false);
    }
  }

  function handleGenerateWordSearch({
    wordList,
    rows,
    cols,
    showHints,
  }: WordSearchFormValues) {
    const generated = generateWordSearchHTML({
      words: wordList,
      rows: Number(rows) || 10,
      cols: Number(cols) || 10,
      showHints,
    });
    setHtml(generated);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phonemeWord = String(formData.get("phonemeWord") ?? "");

    handleGenerateWordSearch({
      wordList: phonemeWord
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ phonemes: line.split(/\s+/) })),
      showHints: formData.get("showHints") === "first-letter",
      rows: String(formData.get("rows") ?? ""),
      cols: String(formData.get("columns") ?? ""),
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center space-y-6 px-6 py-20">
      <section className="w-full rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Word Search Game generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          You can generate a Word Search game by entering phoneme words, the
          number of rows and columns, and whether to show hints. After
          generating the preview, you can download the HTML file for the game.
        </p>
        <hr className="mt-6 w-full border-slate-600 dark:border-slate-300" />
      </section>
      <section className="w-full rounded-2xl py-6 backdrop-blur">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 text-start">
          <label>Phoneme Words</label>
          <textarea
            name="phonemeWord"
            placeholder="Enter phoneme words, one per line"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label>Rows</label>
          <input
            name="rows"
            type="number"
            placeholder="Enter number of rows"
            className="ml-2 rounded border border-gray-300 px-2 py-1"
          />
          <label>Columns</label>
          <input
            name="columns"
            type="number"
            placeholder="Enter number of columns"
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
              onClick={() =>
                downloadHTML("phoneme-word-search-21992617.html", html)
              }
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
          Load a word list saved on the{" "}
          <a href="/activities" className="text-indigo-700 underline dark:text-indigo-400">
            Activities
          </a>{" "}
          page and generate a Word Search from stored data.
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
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value="">Select an activity</option>
              {savedActivities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.words.length} words)
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!selectedActivityId || isGeneratingFromSaved}
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
          title="Word Search Preview"
          className="w-full flex-1 rounded border border-gray-300"
        />
      </section>
    </div>
  );
}
