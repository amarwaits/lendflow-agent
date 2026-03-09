# LendFlow Architecture

## 1) System Overview
LendFlow is a web-based digital onboarding and underwriting platform for **Home**, **Car**, and **Personal** loans.

Two primary journeys:
- **Customer Journey (Public):** Submit a loan application and receive an immediate system-driven underwriting decision.
- **Admin Journey (Protected):** Review queued applications, adjust underwriting rules, add notes, and manually override decisions.

## 2) High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│               Browser (React 19)                    │
│  Customer: OnboardingPage → ApplicationSubmitted    │
│  Admin:    Dashboard → ApplicationReview → Rules    │
└────────────────────┬────────────────────────────────┘
                     │ HTTP (Axios)
┌────────────────────▼────────────────────────────────┐
│       Express + TypeScript API  (port 8001)         │
│  Public:  POST /api/applications                    │
│  Admin:   /api/admin/* (JWT-protected)              │
│  Docs:    GET /api-docs (Swagger UI)                │
└────────────────────┬────────────────────────────────┘
                     │ better-sqlite3
┌────────────────────▼────────────────────────────────┐
│              SQLite Database                        │
│  underwriting_rules | applications | audit trail   │
└─────────────────────────────────────────────────────┘
```

## 3) Backend (`backend_node/`)

### Stack
- **Runtime:** Node.js 20, TypeScript 5
- **Framework:** Express 4
- **Database:** SQLite via `better-sqlite3`
- **Auth:** JWT (`jsonwebtoken`), 10-hour token expiry
- **Validation:** Zod schemas (`src/types.ts`)
- **API Docs:** Swagger UI (`/api-docs`), raw spec at `/api-docs.json`

### Key Source Files
| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point — DB init, server listen on PORT (default 8001) |
| `src/app.ts` | Express app factory — CORS, routes, Swagger UI mount |
| `src/types.ts` | Zod schemas and DB row interfaces |
| `src/db.ts` | DB init/schema creation, `getDb()`, `addAuditEntry()` |
| `src/auth.ts` | `createToken()`, `requireAdmin` middleware |
| `src/underwriting.ts` | `calculateUnderwriting()` scoring algorithm |
| `src/utils.ts` | UTC timestamp helper |
| `src/swagger.ts` | OpenAPI 3.0 spec |
| `src/middleware/validate.ts` | Zod-based request body validation |
| `src/routes/public.ts` | Health, loan-types, applications |
| `src/routes/admin.ts` | Login, dashboard |
| `src/routes/adminApplications.ts` | Application review, override, notes, re-evaluate |
| `src/routes/adminRules.ts` | Underwriting rule CRUD |
| `src/routes/architecture.ts` | Architecture metadata endpoint |

### API Endpoints

**Public** (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/` | Health check |
| GET | `/api/loan-types` | List loan types |
| POST | `/api/applications` | Submit application + run underwriting |
| GET | `/api/applications/:id` | Get application by ID |

**Admin** (Bearer JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Authenticate and receive JWT |
| GET | `/api/admin/dashboard` | KPIs + recent 8 applications |
| GET | `/api/admin/applications` | List with optional `status` / `loan_type` filters |
| GET | `/api/admin/applications/:id` | Application detail + full audit trail |
| PUT | `/api/admin/applications/:id/status` | Update status |
| POST | `/api/admin/applications/:id/override` | Manual decision override |
| POST | `/api/admin/applications/:id/notes` | Add timestamped note |
| POST | `/api/admin/applications/:id/reevaluate` | Re-run underwriting with current rules |
| GET | `/api/admin/rules` | Get all underwriting rules |
| PUT | `/api/admin/rules/:loanType` | Update rule for a loan type |

## 4) Underwriting Engine (`src/underwriting.ts`)

### Component Scores (0–100 each)
| Score | Formula |
|-------|---------|
| `score_credit` | `clamp((credit_score − 300) / 550 × 100)` |
| `score_income` | `clamp(annual_income / loan_amount × 40)` |
| `score_dti` | `clamp(100 − debt_to_income × 1.5)` |
| `score_employment` | `clamp(employment_years / 10 × 100)` |

`debt_to_income` = `(monthly_debt × 12 / annual_income) × 100`

### Weighted Score
`weighted_score = Σ(component_score × weight) / Σ(weights)`

### Decision Logic
1. **Hard fail** → `credit_score < min_credit_score` OR `debt_to_income > max_dti` → `rejected`
2. `weighted_score ≥ approval_score` → `approved`
3. `weighted_score ≥ review_score` → `review` (queued for manual review)
4. Otherwise → `rejected`

### Default Rules

| Loan Type | Min Credit | Max DTI | Approval | Review | Weights (credit/income/dti/employment) |
|-----------|-----------|---------|----------|--------|----------------------------------------|
| Home | 680 | 45% | 78 | 60 | 0.40 / 0.25 / 0.20 / 0.15 |
| Car | 640 | 50% | 74 | 56 | 0.35 / 0.30 / 0.20 / 0.15 |
| Personal | 620 | 55% | 70 | 52 | 0.32 / 0.28 / 0.25 / 0.15 |

## 5) Database Schema (SQLite)

### `underwriting_rules`
PK: `loan_type` | Fields: `min_credit_score`, `max_dti`, `approval_score`, `review_score`, `weight_credit`, `weight_income`, `weight_dti`, `weight_employment`, `updated_at`

### `applications`
PK: `id` (UUID) | Key fields: loan details, applicant info, `score_credit/income/dti/employment`, `weighted_score`, `auto_decision`, `final_decision`, `status`, `override_reason`, `admin_notes`, `created_at`, `updated_at`

### `application_audit`
Append-only audit trail. FK: `application_id`. Fields: `action`, `actor`, `details`, `created_at`

### Application Statuses
`pending_review` | `in_review` | `approved` | `rejected` | `on_hold` | `auto_approved` | `auto_rejected` | `overridden`

## 6) Frontend (`frontend/`)

### Stack
- React 19, React Router DOM 7
- Tailwind CSS 3, Shadcn UI (Radix primitives), Recharts
- Axios, react-hook-form + Zod
- CRACO for CRA config overrides (port 3000)

### Pages
| Page | Route | Description |
|------|-------|-------------|
| `OnboardingPage` | `/` | Customer loan application form |
| `ApplicationSubmittedPage` | `/submitted` | Confirmation with score & tracking ID |
| `AdminLoginPage` | `/admin/login` | Admin credential form |
| `AdminDashboardPage` | `/admin/dashboard` | KPIs + filterable application queue |
| `ApplicationReviewPage` | `/admin/applications/:id` | Detail review, override, notes, audit |
| `RulesManagementPage` | `/admin/rules` | Per-loan-type rule configuration |
| `ArchitecturePage` | `/architecture` | Architecture documentation |

### Auth Flow
- JWT stored in `localStorage` under key `lendflow_admin_token`
- `<AdminProtectedRoute>` guards all `/admin/*` routes
- Admin sidebar provided by `AdminLayout.jsx`

## 7) Admin Workflow
1. Login → receive JWT
2. Dashboard: review KPIs and application queue
3. Open application → view scores, audit history
4. Add review notes (auto-sets status to `in_review`)
5. Update status or trigger re-evaluation after rule changes
6. Manual override (approve/reject) with mandatory reason
7. All actions recorded in `application_audit`

## 8) Environment Variables

**Backend (`backend_node/.env`)**
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8001 | Server port |
| `ADMIN_USERNAME` | — | Admin login username |
| `ADMIN_PASSWORD` | — | Admin login password |
| `ADMIN_JWT_SECRET` | — | JWT signing secret |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `DB_PATH` | `loan_onboarding.db` | SQLite file path |

**Frontend**
| Variable | Description |
|----------|-------------|
| `REACT_APP_BACKEND_URL` | Backend API base URL |

## 9) Deployment

```bash
# Local development
cd backend_node && npm run dev    # port 8001 with hot reload
cd frontend && npm start          # port 3000

# Docker (both services)
docker compose up
```

The `Dockerfile` uses a multi-stage build (Node 20 Alpine). SQLite data is persisted via a Docker named volume (`db_data`).

## 10) Scale-Up Path
- SQLite → PostgreSQL
- Add Redis for caching/queue
- Role-based access (reviewer vs super-admin)
- Event streaming / audit sink (Kafka or cloud-native)
