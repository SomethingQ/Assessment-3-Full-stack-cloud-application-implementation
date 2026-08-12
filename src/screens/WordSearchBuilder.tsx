import { useState, type FormEvent } from "react";

import { generateWordSearchHTML } from "../helpers/wordSearchBuilder";
import { downloadHTML } from "../helpers/exportFile";

interface WordSearchFormValues {
  wordList: { phonemes: string[] }[];
  rows: string;
  cols: string;
  showHints: boolean;
}

function WordSearchBuilder() {
  const [html, setHtml] = useState("");

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
    <div className="mx-auto flex flex-col space-y-6 min-h-screen items-center px-6 py-20">
      <section className="w-full max-w-7xl rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Word Search Game generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          You can generate a Word Search game by entering phoneme words, the
          number of rows and columns, and whether to show hints. After
          generating the preview, you can download the HTML file for the game.
        </p>
        <hr className="w-full mt-6 border-slate-600 dark:border-slate-300" />
      </section>
      <section className="w-full max-w-7xl rounded-2xl py-6 backdrop-blur">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col text-start space-y-4"
        >
          <label>Phoneme Words</label>
          <textarea
            name="phonemeWord"
            placeholder="Enter phoneme words, one per line"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
          />
          <label>Rows</label>
          <input
            name="rows"
            type="number"
            placeholder="Enter number of rows"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
          />
          <label>Columns</label>
          <input
            name="columns"
            type="number"
            placeholder="Enter number of columns"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
          />
          <label>Hints</label>
          <select
            name="showHints"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
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
                downloadHTML(`phoneme-word-search-21992617.html`, html)
              }
            >
              Download HTML File
            </button>
          )}
        </form>
      </section>
      <section className="flex flex-col w-full min-h-[700px] max-w-7xl rounded-2xl py-6 backdrop-blur">
        <h2 className="text-2xl mb-4 font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Preview
        </h2>
        <iframe
          srcDoc={html}
          title="Word Search Preview"
          className="w-full flex-1 border border-gray-300 rounded"
        />
      </section>
    </div>
  );
}

export default WordSearchBuilder;
