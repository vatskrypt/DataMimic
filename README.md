# DataMimic

Generate high‑quality synthetic datasets from real CSVs with privacy‑preserving controls and rich evaluation. Full‑stack TypeScript app: Express API + Vite/React client with optional Postgres storage. A Python generator is used when available; otherwise a JS fallback produces baseline synthetic data and metrics.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [API Reference](#api-reference)
- [Data Flow](#data-flow)
- [Development Notes](#development-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features
- Upload CSV and auto‑analyze columns (numeric/categorical, null counts, basic suggestions).
- Generate synthetic data:
  - Python engine (preferred) via `python_scripts/generate_synthetic.py`.
  - JS fallback when Python is unavailable.
  - Controlled generation: choose columns to synthesize, add constraints, define simple relations.
- Evaluation metrics and charts: privacy/utility scores, KS test, correlation distance, distributions, and correlation overview.
- Compare Original vs Synthetic samples side‑by‑side.
- Download synthetic CSV and a PDF report of results.
- Storage:
  - In‑memory by default (no DB required for local dev).
  - Postgres via Drizzle ORM + Neon when `DATABASE_URL` is set.

---

## Tech Stack
- Frontend: React 18, Vite, TailwindCSS, shadcn/ui (Radix UI), Recharts, TanStack Query, Wouter.
- Backend: Node.js, Express, Multer, PDFKit.
- Database (optional): Postgres with Drizzle ORM and Neon serverless driver.
- Shared Types: Drizzle schema + Zod insert schemas in `shared/`.
- Build/Tooling: TypeScript, esbuild, TSX, Vite.
- Python (optional): Synthetic generation and evaluation helpers.

---

## Architecture
- server/index.ts
  - Express app, request logging for `/api/*`, error handler.
  - Registers routes from `server/routes.ts`.
  - Dev: attaches Vite middleware for the client; Prod: serves built static assets.
- server/routes.ts
  - CSV upload, dataset CRUD, synthetic generation (Python + JS fallback), evaluation, downloads, and PDF report.
- server/storage.ts
  - Chooses storage backend:
    - `DatabaseStorage` (Postgres via Drizzle) when `DATABASE_URL` is present.
    - `InMemoryStorage` otherwise.
- shared/schema.ts
  - Drizzle table definitions (datasets, generations, evaluations) and Zod insert schemas.
- client/
  - React routes: Upload, Model Selection, Results, Download.
  - TanStack Query default fetcher based on the `queryKey`.

---

## Directory Structure
```
DataMimic/
├─ client/               # React app (Vite)
│  └─ src/
│     ├─ pages/          # upload, models, results, download
│     ├─ components/     # UI components
│     └─ lib/queryClient.ts
├─ server/               # Express server
│  ├─ index.ts           # entrypoint
│  ├─ routes.ts          # REST API
│  ├─ storage.ts         # DB/in-memory storage abstraction
│  ├─ db.ts              # Drizzle + Neon DB client
│  └─ vite.ts            # Vite dev/prod integration
├─ shared/
│  └─ schema.ts          # Drizzle tables + Zod insert schemas
├─ python_scripts/
│  └─ generate_synthetic.py
├─ tsconfig.json
├─ vite.config.ts
├─ tailwind.config.ts
├─ drizzle.config.ts
├─ package.json
└─ README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.x (optional but recommended)
- Postgres (optional, required only if you want persistent storage)

### Install & Run (In‑Memory Storage)
```
npm install
npm run dev
```
- App runs on `http://localhost:5000`.
- In dev, Vite serves the React client through Express middleware with HMR.

### Production Build
```
npm run build
npm start
```
- Builds client and bundles server to `dist/`. Express serves the built client.

### Using Postgres (Optional)
1) Set `DATABASE_URL` (see Environment Variables).
2) Run migrations: `npm run db:push`.
3) Start the app (`dev` or `start`).

---

## Environment Variables
- `PORT` (number) — Express port. Default: `5000`.
- `DATABASE_URL` (string) — Postgres connection string. If set, enables DB storage.
- `PYTHON_BIN` (string) — Path to python binary (optional). If not set, the server tries platform‑sensible defaults (`python`, `py`, `python3`).

Create a `.env` (not committed) if desired and load via your shell or a process manager.

---

## NPM Scripts
- `dev` — Start Express in dev with Vite middleware.
- `build` — Build client and bundle server.
- `start` — Run the production server from `dist/index.js`.
- `check` — Typecheck with `tsc`.
- `db:push` — Apply Drizzle migrations when using Postgres.

---

## API Reference
Base URL: `http://localhost:5000`

- POST `/api/upload` (multipart/form-data)
  - Field: `file` (CSV)
  - Response: dataset metadata { id, name, rowCount, columnCount, columns }

- GET `/api/datasets`
  - List datasets.

- GET `/api/datasets/:id`
  - Get dataset including stored CSV (`fileData`).

- POST `/api/analyze_dataset`
  - Body: `{ datasetId }`
  - Response: `{ columns, dtypes, relations }`

- POST `/api/generate`
  - Body: `{ datasetId, modelType, parameters }`
  - Spawns Python; falls back to JS generator.
  - Persists generation + evaluation.

- POST `/api/generate_controlled`
  - Body: `{ datasetId, cols_to_synthesize, constraints, relations, modelType, parameters }`

- GET `/api/generations/:id`
  - Returns generation and evaluation.

- GET `/api/generations/latest`
  - Returns the latest generation and its evaluation.

- GET `/api/download/:id`
  - Download synthetic CSV of a specific generation.

- GET `/api/download_synthetic/:datasetId`
  - Download latest synthetic CSV for a dataset.

- GET `/api/report/:id`
  - Download a PDF report of evaluation metrics.

---

## Data Flow
1) Upload CSV → stored as text in storage (DB or memory) with derived column info.
2) Generate → server spawns Python with JSON (CSV, model, parameters). If Python is unavailable/fails, a JS fallback synthesizes and evaluates.
3) Persist → generation status/data and evaluation metrics stored.
4) Visualize → client fetches generation/evaluation and dataset to plot charts and show samples.
5) Export → download synthetic CSV or a PDF report.

---

## Development Notes
- In dev, the server attaches Vite middleware (HMR). In prod, Express serves static files from the build.
- Storage is chosen at runtime in `server/storage.ts` based on `DATABASE_URL`.
- The Results page reads original sample rows from `GET /api/datasets/:id` and synthetic rows from generation data.
- UI components are built with shadcn/ui and Tailwind; charts via Recharts.

---

## Troubleshooting
- PowerShell blocks `npm`: use `npm.cmd` or adjust execution policy.
- Python not found: set `PYTHON_BIN` or install Python; app will fall back to JS generator.
- Postgres errors: ensure `DATABASE_URL` is set and run `npm run db:push`.
- Port in use: set `PORT` to a free port.

---

