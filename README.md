# Phoneme Activity Builder

Full-stack web application for creating phoneme-based classroom activities.

The system lets teachers:
- Create and manage activity templates (Wordle and Word Search)
- Store words/phonemes in PostgreSQL
- Generate downloadable standalone HTML game files from the frontend

## Architecture

This repository contains three parts:
- `frontend/`: Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- `backend/`: Express + TypeScript + Prisma API
- `db` service (via Docker Compose): PostgreSQL 16

High-level flow:
1. Frontend calls backend REST API (`/api/...`)
2. Backend validates input with Zod
3. Backend reads/writes activity and word data through Prisma
4. PostgreSQL persists activity metadata and phoneme word lists

## Project Structure

```text
.
├─ docker-compose.yml
├─ .env.example
├─ backend/
│  ├─ prisma/schema.prisma
│  └─ src/
└─ frontend/
   ├─ app/
   ├─ components/
   └─ lib/
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
- Backend API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`
- Postgres: `localhost:5432`

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

- `GET /health`
- `GET /api/activities`
- `GET /api/activities?type=WORDLE|WORD_SEARCH`
- `GET /api/activities/:id`
- `POST /api/activities`
- `PUT /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/activities/:id/words`
- `PUT /api/words/:wordId`
- `DELETE /api/words/:wordId`

## Frontend Pages

- `/`: Landing page
- `/wordle`: Wordle generator
- `/wordsearch`: Word Search generator
- `/activities`: Activity CRUD management page
- `/about`: Project information
- `/settings`: Theme settings

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

## Notes

- The frontend generates downloadable HTML activity files client-side.
- IPA hint mappings are maintained in frontend helper code and are not stored in the database.
- Word Search grids are generated on demand, while source words/settings are persisted.
