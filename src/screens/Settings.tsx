type SettingsProps = {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

function Settings({ isDarkMode, onToggleDarkMode }: SettingsProps) {
  return (
    <main className="mx-auto flex min-h-screen justify-center px-6 py-20">
      <section className="w-full max-w-7xl space-y-8 rounded-2xl p-10 backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Settings
        </h1>

        <hr className="w-full mt-6 border-slate-600 dark:border-slate-300" />
<div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Dark Mode
            </h2>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-pressed={isDarkMode}
            className="mt-6 rounded-lg bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Toggle dark mode
          </button>
        </div>
      </section>
    </main>
  );
}

export default Settings;
