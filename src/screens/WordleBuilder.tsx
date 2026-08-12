import { useState, type FormEvent } from "react";

import { generateWordleHTML } from "../helpers/wordleBuilder";
import { downloadHTML } from "../helpers/exportFile";

interface WordleFormValues {
  phonemeWord: string;
  englishWord: string;
  numGuesses: string;
  showHints: boolean;
}

function WordleBuilder() {
  const [html, setHtml] = useState("");

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
    <div className="mx-auto flex flex-col items-center space-y-6 min-h-screen px-6 py-20">
      <section className="w-full max-w-7xl rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Wordle Game generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          You can generate a Wordle game by entering a phoneme word, an English
          word, the number of attempts, and whether to show hints. After
          generating the preview, you can download the HTML file for the game.
        </p>
        <hr className="w-full mt-6 border-slate-600 dark:border-slate-300" />
      </section>
      <section className="w-full max-w-7xl rounded-2xl py-6 backdrop-blur">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col text-start space-y-4"
        >
          <label>Phoneme Word</label>
          <textarea
            name="phonemeWord"
            placeholder="Enter a phoneme word"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
          />
          <label>English Word</label>
          <textarea
            name="englishWord"
            placeholder="Enter a word"
            className="border border-gray-300 rounded px-2 py-1 ml-2"
          />
          <label>Attempts</label>
          <input
            name="numGuesses"
            type="number"
            placeholder="Enter number of attempts"
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
              onClick={() => downloadHTML(`phoneme-wordle-21992617.html`, html)}
            >
              Download HTML File
            </button>
          )}
        </form>
      </section>
      <section className="flex flex-col min-h-[700px] w-full max-w-7xl rounded-2xl py-6 backdrop-blur">
        <h2 className="text-2xl mb-4 font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Preview
        </h2>
        <iframe
          srcDoc={html}
          title="Wordle Preview"
          className="w-full flex-1 border border-gray-300 rounded"
        />
      </section>
    </div>
  );
}

export default WordleBuilder;
