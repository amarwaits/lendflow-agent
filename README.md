# LendFlow — Mortgage & Loan Underwriting Platform

LendFlow is a full-stack digital onboarding and underwriting platform for **Home**, **Car**, and **Personal** loans. It provides a customer-facing application form with real-time scoring and an admin portal for review, rule management, and decision overrides.

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Local Development

```bash
# Backend (port 8000)
cd backend_node
cp .env.example .env        # fill in credentials
npm install
npm run dev

# Frontend (port 3000) — in a separate terminal
cd frontend
npm install
npm start
```

### Docker

```bash
docker compose up
```

Both services start automatically. SQLite data persists in the `db_data` Docker volume.

## Project Structure

```
backend_node/    Express + TypeScript API (port 8000)
frontend/        React 19 + Tailwind + Shadcn UI (port 3000)
```

## Backend

| Item | Detail |
|------|--------|
| Runtime | Node.js 20, TypeScript 5 |
| Framework | Express 4 |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (10-hour expiry) |
| Validation | Zod |
| API Docs | Swagger UI at `GET /api-docs` |

### Commands
```bash
npm run dev      # hot reload via ts-node-dev
npm run build    # compile TypeScript → dist/
npm start        # run compiled dist/index.js
```

### Environment Variables (`backend_node/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8001) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_JWT_SECRET` | JWT signing secret |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `DB_PATH` | SQLite file path (default: `loan_onboarding.db`) |

### Key API Endpoints

All routes are under `/api`.

**Public**
- `GET /api/` — health check
- `GET /api/loan-types` — available loan types
- `POST /api/applications` — submit application (triggers underwriting)
- `GET /api/applications/:id` — retrieve application

**Admin** (Bearer JWT required)
- `POST /api/admin/login` — authenticate
- `GET /api/admin/dashboard` — KPIs + recent applications
- `GET /api/admin/applications` — list with filters
- `GET /api/admin/applications/:id` — detail + audit trail
- `PUT /api/admin/applications/:id/status` — update status
- `POST /api/admin/applications/:id/override` — manual decision override
- `POST /api/admin/applications/:id/notes` — add review note
- `POST /api/admin/applications/:id/reevaluate` — re-run underwriting
- `GET /api/admin/rules` — get all underwriting rules
- `PUT /api/admin/rules/:loanType` — update rule

## Frontend

| Item | Detail |
|------|--------|
| Framework | React 19, React Router DOM 7 |
| Styling | Tailwind CSS 3, Shadcn UI (Radix) |
| Charts | Recharts |
| Forms | react-hook-form + Zod |
| HTTP | Axios |
| Build | CRACO |

### Commands
```bash
npm start        # dev server on port 3000
npm run build    # production build
```

### Pages
| Page | Description |
|------|-------------|
| `/` | Customer loan application form |
| `/submitted` | Application confirmation with score + tracking ID |
| `/admin/login` | Admin authentication |
| `/admin/dashboard` | KPIs and application queue |
| `/admin/applications/:id` | Application review, override, notes, audit |
| `/admin/rules` | Underwriting rule configuration |
| `/architecture` | Architecture documentation |

## Underwriting Engine

For each loan application, the engine computes four component scores (0–100):

- **Credit score** — `clamp((credit_score − 300) / 550 × 100)`
- **Income strength** — `clamp(annual_income / loan_amount × 40)`
- **DTI health** — `clamp(100 − debt_to_income × 1.5)`
- **Employment stability** — `clamp(employment_years / 10 × 100)`

A weighted average produces the final score. Hard fails (credit below minimum or DTI above maximum) immediately reject the application.

Default thresholds:

| Loan | Min Credit | Max DTI | Approval | Review |
|------|-----------|---------|----------|--------|
| Home | 680 | 45% | 78 | 60 |
| Car | 640 | 50% | 74 | 56 |
| Personal | 620 | 55% | 70 | 52 |

## Database

SQLite with three tables:
- `underwriting_rules` — per-loan-type scoring configuration
- `applications` — application data + computed scores + status
- `application_audit` — append-only audit trail

## Application Statuses

`pending_review` | `in_review` | `approved` | `rejected` | `on_hold` | `auto_approved` | `auto_rejected` | `overridden`

## Documentation

- Swagger UI: `http://localhost:8001/api-docs`
- OpenAPI JSON: `http://localhost:8001/api-docs.json`
- Architecture: see [ARCHITECTURE.md](./ARCHITECTURE.md)
