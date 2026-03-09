# LendFlow - Claude Code Context

## Project Overview
LendFlow is a mortgage/loan underwriting platform with a customer-facing application form and an admin portal for review, rule management, and decision overrides.

## Repository Structure
```
backend_node/    Express + TypeScript API (port 8001)
frontend/        React 19 + Tailwind + Shadcn UI (port 3000)
tests/           Test files
```

## Backend

### Stack
- **Runtime:** Node.js 20, TypeScript 5
- **Framework:** Express 4
- **DB:** SQLite via `better-sqlite3`
- **Auth:** JWT (`jsonwebtoken`)
- **Validation:** Zod schemas in `src/types.ts`

### Key Files
| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, DB init, listen on PORT (default 8001) |
| `src/app.ts` | Express app factory, CORS, routes, Swagger UI mount |
| `src/types.ts` | All Zod schemas and DB row interfaces |
| `src/db.ts` | DB init, `getDb()`, `addAuditEntry()` |
| `src/auth.ts` | `createToken()`, `requireAdmin` middleware |
| `src/underwriting.ts` | Scoring algorithm, `calculateUnderwriting()` |
| `src/swagger.ts` | OpenAPI 3.0 spec object |
| `src/routes/public.ts` | Public routes (health, loan-types, applications) |
| `src/routes/admin.ts` | Admin login + dashboard |
| `src/routes/adminApplications.ts` | Application review endpoints |
| `src/routes/adminRules.ts` | Underwriting rule CRUD |

### API Base Path
All API routes are mounted at `/api`.

### Swagger UI
- UI: `GET /api-docs`
- Raw JSON spec: `GET /api-docs.json`

### Auth
Admin endpoints require `Authorization: Bearer <token>` header. Token obtained from `POST /api/admin/login`.

### Dev Commands
```bash
cd backend_node
npm run dev      # ts-node-dev with hot reload
npm run build    # compile to dist/
npm start        # run compiled dist/index.js
```

### Environment Variables (`backend_node/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 8001) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | Secret for signing JWTs |
| `CORS_ORIGINS` | Comma-separated allowed origins |

## Frontend

### Stack
- React 19, React Router DOM 7
- Tailwind CSS, Shadcn UI (Radix primitives)
- Axios for API calls (`src/lib/api.js`)
- react-hook-form + Zod for form validation

### Dev Commands
```bash
cd frontend
npm start        # CRA + CRACO dev server on port 3000
npm run build    # production build
```

## Database Schema

### `underwriting_rules`
Per loan-type scoring configuration. PK: `loan_type`.

### `applications`
Loan applications with computed scores. PK: `id` (UUID).

### `application_audit`
Append-only audit trail. FK: `application_id`.

## Loan Types
`home` | `car` | `personal`

## Application Statuses
`pending_review` | `in_review` | `approved` | `rejected` | `on_hold` | `auto_approved` | `auto_rejected` | `overridden`

## Docker
```bash
docker compose up    # starts both backend and frontend
```
