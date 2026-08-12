import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="mx-auto flex flex-col space-y-12 min-h-screen items-center px-6 py-20">
      <section className="w-full max-w-7xl rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Phoneme Word Activity Generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Generate Wordle and Word Search activities as downloadable html files.
        </p>
        <hr className="w-full mt-6 border-slate-600 dark:border-slate-300" />
      </section>


      <section className="w-full max-w-7xl rounded-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Word Search
        </h2>
        <Link to="/wordsearch">
          <button className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Start Word Search
          </button>
        </Link>
      </section>

      <section className="w-full max-w-7xl rounded-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Wordle
        </h2>
        <Link to="/wordle">
          <button className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Start Wordle
          </button>
        </Link>
      </section>
    </div>
  );
}

export default Landing;