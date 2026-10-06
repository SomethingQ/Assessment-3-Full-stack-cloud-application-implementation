import Link from "next/link";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center space-y-12 px-6 py-20">
      <section className="w-full rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Phoneme Word Activity Generator
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Generate Wordle and Word Search activities as downloadable html files.
        </p>
        <hr className="mt-6 w-full border-slate-600 dark:border-slate-300" />
      </section>

      <section className="w-full rounded-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Word Search
        </h2>
        <Link href="/wordsearch">
          <button className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Start Word Search
          </button>
        </Link>
      </section>

      <section className="w-full rounded-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Wordle
        </h2>
        <Link href="/wordle">
          <button className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Start Wordle
          </button>
        </Link>
      </section>

      <section className="w-full rounded-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Dashboard
        </h2>
        <p className="mt-2 text-lg leading-8 text-slate-600 dark:text-slate-300">
          Monitor health, usage statistics, alerts and reporting for every generated activity.
        </p>
        <Link href="/dashboard">
          <button className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400">
            View Dashboard
          </button>
        </Link>
      </section>
    </main>
  );
}
