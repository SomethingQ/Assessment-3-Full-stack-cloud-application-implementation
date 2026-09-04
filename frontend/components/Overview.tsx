export default function Overview() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-20">
      <section className="w-full space-y-12 rounded-2xl backdrop-blur">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          About This Project
        </h1>
        <hr className="w-full border-slate-600 dark:border-slate-300" />

        <div className="text-start">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Student Information
          </h2>

          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            <strong>Student Name:</strong> Abdulmelik Al-Mashhadani
          </p>
          <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            <strong>Student Number:</strong> 21992617
          </p>
        </div>
        <div className="text-start">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Project Overview
          </h2>
          <p className="mb-2 text-lg leading-8 text-slate-600 dark:text-slate-300">
            This project is a web application that lets teachers create
            interactive phoneme-based learning activities for students. It
            provides tools for generating activities such as Phoneme Word Search
            and Phoneme Wordle, with a simple, user-friendly interface.
          </p>
          <p className="mb-2 text-lg leading-8 text-slate-600 dark:text-slate-300">
            The aim of the project is to make it easier for teachers to prepare
            engaging learning activities that can be shared with students.
          </p>
        </div>
        <div className="text-start">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Frontend Build
          </h2>
          <p className="mb-2 text-lg leading-8 text-slate-600 dark:text-slate-300">
            The frontend is built with React, TypeScript, and Tailwind CSS, and
            demonstrates responsive page design, reusable components,
            navigation, and client-side generation of standalone HTML activity
            files.
          </p>
          <p className="mb-2 text-lg leading-8 text-slate-600 dark:text-slate-300">
            Backend functionality, databases, and more advanced activity
            generation are out of scope for this version.
          </p>
        </div>

        <div className="text-start">
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Demonstration Video
          </h2>
          <iframe
            className="mt-6 aspect-video w-full rounded-lg"
            src="https://www.youtube.com/embed/ZDciHwMbukk"
            title="Demonstration Video"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </main>
  );
}
