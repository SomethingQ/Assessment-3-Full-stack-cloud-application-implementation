# Phoneme Activity Builder

A full-stack web application for Speech Pathology teachers to build phoneme-based
**Wordle** and **Word Search** activities for classroom use. Teachers can create,
save, edit and delete word lists and activity settings, then generate downloadable
HTML activity files driven by that stored data.

This repository contains Assessment 2 of the Cloud-Based Application Development
project. Assessment 1 delivered the frontend builder UI (see `nextjs/`); Assessment
2 adds the backend API, database persistence, validation, and Docker packaging
described below.

## Architecture

The application is split into three independently deployable services (a 3-tier
architecture), wired together with Docker Compose:

```
┌─────────────┐      HTTP       ┌─────────────┐      SQL       ┌──────────────┐
│  frontend    │ ───────────────▶│  backend    │ ──────────────▶│  db          │
│  Next.js     │  /api/*, /health│  Express +  │  Prisma ORM    │  PostgreSQL  │
│  (port 3000) │◀─────────────── │  Prisma     │◀────────────── │  (port 5432) │
└─────────────┘      JSON        │ (port 4000) │                └──────────────┘
                                  └─────────────┘
```

- **`nextjs/`** – The Next.js 16 (App Router) frontend from Assessment 1, extended
  with an `ActivitiesManager` page and API client (`lib/api.ts`) that talks to the
  backend. Builds a static/SSR bundle served by `next start`.
- **`backend/`** – An Express + TypeScript API with Prisma ORM, providing CRUD
  routes for activities and words, input validation (Zod), centralised error
  handling, and a `/health` endpoint.
- **`db`** – A PostgreSQL container (official `postgres:16-alpine` image) with a
  named volume for persistence. Schema is managed via Prisma migrations.

### What is (and isn't) stored in the database

Only teacher-authored content is persisted:

- **Activities** – name, type (`WORDLE` / `WORD_SEARCH`), difficulty, hint
  visibility, and type-specific settings (`numGuesses` for Wordle, `rows`/`cols`
  for Word Search).
- **Words** – an ordered list of phoneme units (stored as a Postgres text array so
  multi-character IPA symbols such as `tʃ` or `dʒ` are preserved) plus an optional
  English translation.

Static reference data (the IPA phoneme → hint text lookup table) and the Word
Search grid layout are **not** stored — the hint table is a frontend constant
(`nextjs/lib/helpers/exportFile.ts`), and the grid is regenerated on demand from
the saved word list each time an activity is opened.

## Running locally with Docker Compose

**Prerequisites:** Docker and Docker Compose.

```bash
# 1. Copy the example environment file and adjust values if desired
cp .env.example .env

# 2. Build and start all three services
docker compose up --build

# 3. Open the app
#    Frontend:            http://localhost:3000
#    Backend API:         http://localhost:4000
#    Health check:        http://localhost:4000/health
```

Credentials and URLs are read from `.env` (not committed — see `.env.example`)
and passed into the containers via `docker-compose.yml`. Nothing is hardcoded in
the Dockerfiles or compose file.

To stop everything:

```bash
docker compose down          # stop containers, keep the database volume
docker compose down -v       # stop containers and delete the database volume
```

## Running services individually (without Docker)

### Database
Any local PostgreSQL instance works. Update `backend/.env`'s `DATABASE_URL`
accordingly.

### Backend (`backend/`)
```bash
cd backend
cp .env.example .env   # then edit DATABASE_URL
npm install
npm run prisma:migrate # applies migrations to your local Postgres
npm run dev             # starts the API on http://localhost:4000
```

### Frontend (`nextjs/`)
```bash
cd nextjs
cp .env.example .env    # NEXT_PUBLIC_API_URL should point at the backend
npm install
npm run dev              # starts the app on http://localhost:3000
```

## API overview

All endpoints are served by the `backend` service and prefixed with `/api`.

| Method | Path                              | Description                              |
|--------|-----------------------------------|-------------------------------------------|
| GET    | `/health`                         | Liveness check, returns `200 OK`           |
| GET    | `/api/activities?type=`           | List activities (optional type filter)     |
| GET    | `/api/activities/:id`             | Get one activity with its words            |
| POST   | `/api/activities`                 | Create an activity (with optional words)   |
| PUT    | `/api/activities/:id`             | Update activity settings                   |
| DELETE | `/api/activities/:id`             | Delete an activity (cascades to its words)  |
| POST   | `/api/activities/:id/words`       | Add a word to an activity                  |
| PUT    | `/api/words/:wordId`              | Update a word                              |
| DELETE | `/api/words/:wordId`              | Delete a word                              |

Requests are validated with [Zod](https://zod.dev); invalid input returns
`400` with a descriptive error body, and missing resources return `404`.

## Project structure

```
.
├── docker-compose.yml     # Orchestrates frontend, backend, and db containers
├── .env.example           # Template for docker-compose environment variables
├── backend/               # Express + Prisma API service
│   ├── Dockerfile
│   ├── prisma/schema.prisma
│   └── src/
├── nextjs/                # Next.js frontend (Assessment 1 UI + Activities manager)
│   ├── Dockerfile
│   ├── app/
│   ├── components/
│   └── lib/
└── src/                   # Original Vite/React Assessment 1 prototype (superseded by nextjs/)
```

## Tech stack

- Next.js 16 (App Router), React 19, Tailwind CSS
- Express, Prisma ORM, PostgreSQL
- Zod for request validation
- Docker & Docker Compose
