# Phoneme Activity Builder

Full-stack web application for creating phoneme-based classroom activities.

The system lets teachers:
- Create and manage activity templates (Wordle and Word Search)
- Store words/phonemes in PostgreSQL
- Generate downloadable standalone HTML game files from the frontend
- Monitor the system through a data-driven dashboard (health, usage statistics, alerts and reporting)

This repository is the Assessment 3 stage of the project. It builds on the
Assessment 1 frontend and the Assessment 2 backend/API/database/Docker work by
adding a data-driven dashboard, simulated input records, operational statistics,
alerts, reporting views, observability instrumentation and automated testing
(Playwright, JMeter and Lighthouse).

## Architecture

This repository contains three parts:
- `frontend/`: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- `backend/`: Express + TypeScript + Prisma API
- `db` service (via Docker Compose): PostgreSQL 16

High-level flow:
1. Frontend calls backend REST API (`/api/...`)
2. Backend validates input with Zod
3. Backend reads/writes activity and word data through Prisma
4. PostgreSQL persists activity metadata, phoneme word lists and the
   observability records used by the dashboard (generation events and page views)

### Observability and reporting layer

- Every Wordle / Word Search generation attempt is reported to
  `POST /api/events/generation` (success/failure, duration, word count, source).
- Time on page is reported to `POST /api/events/pageview`.
- The dashboard reads aggregated statistics from `GET /api/metrics/dashboard`,
  time-series data from `GET /api/metrics/timeseries` and a detailed report from
  `GET /api/metrics/report`.
- `POST /api/simulate` fabricates simulated input records (activities,
  generation events and page views) so the dashboard can be demonstrated
  without manual data entry.

## Project Structure

```text
.
├─ docker-compose.yml
├─ .env.example
├─ backend/
│  ├─ prisma/schema.prisma
│  ├─ prisma/seed.ts
│  └─ src/
│     ├─ routes/          # activities, words, events, metrics, simulate
│     └─ services/        # metricsService, simulateService, healthService
├─ frontend/
│  ├─ app/
│  ├─ components/
│  │  └─ dashboard/       # StatCard, AlertList, BarList, TimeseriesChart
│  ├─ e2e/                # Playwright end-to-end tests
│  └─ lib/
└─ tests/
   └─ jmeter/             # JMeter load test plan + helper scripts
```

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (for containerized run)

## Quick Start (Docker, Recommended)

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Frontend: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Backend API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`
- Postgres: `localhost:5432`

To populate the dashboard with deterministic demo data (activities, generation
events and page views), run the seed script inside the backend container:

```bash
docker compose exec backend npm run prisma:seed
```

You can also click **Simulate input records** on the dashboard to generate
randomised simulated records at any time.

To stop:

```bash
docker compose down
```

To stop and remove database volume:

```bash
docker compose down -v
```

## Local Development (Without Docker)

### 1) Database
Start a PostgreSQL instance locally and ensure it matches your connection settings.

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Backend default URL: `http://localhost:4000`

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend default URL: `http://localhost:3000`

## Environment Variables

Root `.env` (used by Docker Compose):
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `BACKEND_PORT`
- `FRONTEND_ORIGIN`
- `FRONTEND_PORT`
- `NEXT_PUBLIC_API_URL`

Backend `.env`:
- `PORT`
- `FRONTEND_ORIGIN`
- `DATABASE_URL`

Frontend `.env`:
- `NEXT_PUBLIC_API_URL`

## API Overview

Base URL: `http://localhost:4000`

- `GET /health` — liveness/readiness check, always returns `200 OK` with database status
- `GET /api/activities`
- `GET /api/activities?type=WORDLE|WORD_SEARCH`
- `GET /api/activities/:id`
- `POST /api/activities`
- `PUT /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/activities/:id/words`
- `PUT /api/words/:wordId`
- `DELETE /api/words/:wordId`
- `POST /api/events/generation` — record a generation attempt (observability)
- `POST /api/events/pageview` — record time on page (observability)
- `GET /api/metrics/dashboard` — aggregated dashboard metrics + alerts
- `GET /api/metrics/timeseries?days=14` — daily activity/generation/page-view counts
- `GET /api/metrics/report` — top activities, generation log, slow generations, empty word lists
- `POST /api/simulate` — generate simulated input records

## Frontend Pages

- `/`: Landing page
- `/wordle`: Wordle generator
- `/wordsearch`: Word Search generator
- `/activities`: Activity CRUD management page
- `/dashboard`: Data-driven dashboard, observability metrics, alerts and reporting
- `/about`: Project information
- `/settings`: Theme settings

## Testing and Accessibility

### Playwright (end-to-end)

End-to-end tests live in `frontend/e2e/` and cover:
- a **builder use case** (create, edit, add a word and delete an activity — `builder-crud.spec.ts`)
- a **user use case** (generate and view a Wordle / Word Search — `generate-activity.spec.ts`)
- the **dashboard** observability views and the simulated-records workflow (`dashboard.spec.ts`)

With the stack running (`docker compose up`):

```bash
cd frontend
npx playwright install chromium   # first run only
npm run test:e2e
```

If the frontend is not already running, the Playwright config starts `npm run dev`
automatically. The backend API must be reachable at `NEXT_PUBLIC_API_URL`.

### JMeter (load testing)

The staged load test plan is `tests/jmeter/phoneme-builder-load-test.jmx`
(generated by `tests/jmeter/generate-load-test.mjs`). It defines x1, x10, x100
and x1000 user levels and exercises the builder API and generated-activity
workflow (`/health`, `/api/activities` GET/POST, `/api/events/generation`,
`/api/metrics/dashboard`).

```bash
cd tests/jmeter
./run-load-test.sh                # host=localhost port=4000 by default
```

This requires Apache JMeter 5.x and Java. The raw results are written to
`results.jtl` and an HTML report to `report/index.html`. Use the summary table
to explain how the system behaves under increasing load.

Regenerate the plan after editing the generator:

```bash
node tests/jmeter/generate-load-test.mjs
```

### Lighthouse (accessibility)

Run the accessibility audit across all key pages and write HTML reports to
`frontend/lighthouse-reports/`:

```bash
cd frontend
npm run lighthouse                 # app must be running on port 3000
```

All audited pages score **100/100** for accessibility. Changes made after
reviewing the Lighthouse report include associating every form control with a
`<label>` (or `aria-label`), using a `<main>` landmark on each page, and fixing
the alerts list so its semantics are valid for assistive technology.

## Tech Stack

Frontend:
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`)

Backend:
- Node.js + Express
- Prisma ORM
- Zod validation

Database:
- PostgreSQL 16

## Data Model

Prisma models (`backend/prisma/schema.prisma`):

- `Activity` — name, type (WORDLE / WORD_SEARCH), difficulty, hint/output settings
- `Word` — ordered phoneme units (text array) + optional English word, linked to an activity
- `GenerationEvent` — observability record for every generation attempt
  (type, status, source, word count, duration, error message)
- `PageView` — time-on-page records used for the average time on page metric

## Notes

- The frontend generates downloadable HTML activity files client-side and reports
  each attempt to the backend so success/failure counts are database-backed.
- IPA hint mappings are maintained in frontend helper code and are not stored in the database.
- Word Search grids are generated on demand, while source words/settings are persisted.
- Assessment 3 submission: the code is submitted as a zip with `node_modules`
  removed, plus the GitHub repository link.
