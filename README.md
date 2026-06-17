# OpenFleet

**A full-stack fleet and maintenance management platform** — enterprise-grade .NET 8 REST API with a React operations console, built as a portfolio demonstration of production-oriented architecture.

![Dashboard](docs/images/placeholder-dashboard.svg)

---

## What Is OpenFleet?

OpenFleet manages a vehicle fleet end to end: vehicles and assets, preventive maintenance schedules, inspections, work orders, parts inventory, vendor relationships, external integrations, operational reports, and administration. The backend follows Clean Architecture; the frontend is a typed React SPA with role-based access control aligned to the API.

---

## Features

### Backend API

| Area | What's Included |
|------|----------------|
| Fleet Management | Vehicle and asset CRUD with filtering, department assignment, VIN validation |
| Work Orders | Full lifecycle with status transitions, priority levels, labor hour tracking, notes |
| Inspections | Inspection submission with automatic work order creation on failure |
| Preventive Maintenance | Mileage and date-interval schedules; background service checks every hour |
| Authentication | JWT Bearer with role-based access (Viewer → Administrator) |
| Audit Trail | Immutable audit log for vehicle updates, status changes, inspection failures, sync failures |
| External Integrations | Mock connectors for fuel import, vendor repair status, parts inventory, and asset sync |
| Reporting | 8 dashboard endpoints: open work orders, maintenance cost, parts inventory, downtime, failure rates |
| Observability | Correlation IDs, structured Serilog logging, split health checks |
| Testing | 243+ backend tests — domain, application, infrastructure, integration, middleware |
| CI | GitHub Actions build, test, and coverage pipeline |

### Web Application (OpenFleet.Web)

| Area | What's Included |
|------|----------------|
| Dashboard | KPI cards, charts, open work orders, due vehicles, failed inspections, low stock, integration failures |
| Fleet | Vehicles and assets — list, detail, create, edit with filters and pagination |
| Operations | Work orders, inspections, preventive maintenance schedules |
| Inventory | Parts catalog and vendor management |
| Integrations | Sync history, manual triggers, failure visibility |
| Reports | 7 operational reports with charts, tables, date filters, CSV export |
| Administration | User management, roles reference, departments, audit logs, settings placeholder |
| UX | Dark mode, responsive sidebar, loading skeletons, empty states, toast notifications |
| Testing | Vitest unit/component tests, Playwright E2E, MSW API mocking |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | .NET 8 / ASP.NET Core, EF Core 8, PostgreSQL 16, FluentValidation, Serilog, Swagger |
| **Frontend** | React 18, TypeScript, Vite 6, TanStack Query, React Router, Tailwind CSS, Axios |
| **Auth** | JWT Bearer (shared between API and SPA) |
| **Testing** | xUnit (API), Vitest + Testing Library + MSW (unit), Playwright (E2E) |
| **Containers** | Docker / Docker Compose |
| **CI** | GitHub Actions (.NET + frontend tests) |

---

## Architecture

OpenFleet follows **Clean Architecture** on the backend with a feature-module SPA on the frontend:

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│  OpenFleet.Web (React SPA)      │────▶│  OpenFleet.Api                  │
│  Features · Services · Query    │ JWT │  Controllers · Middleware       │
└─────────────────────────────────┘     │  ─────────────────────────────  │
                                        │  OpenFleet.Application          │
                                        │  ─────────────────────────────  │
                                        │  OpenFleet.Domain               │
                                        │  ─────────────────────────────  │
                                        │  OpenFleet.Infrastructure       │
                                        └─────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) and [docs/frontend-architecture.md](docs/frontend-architecture.md) for detailed breakdowns.

---

## Running Locally

### Prerequisites

- Docker Desktop, **or** .NET 8 SDK + PostgreSQL 16
- Node.js 20+ (for the web application)

### Docker — API only (recommended for backend)

```bash
git clone https://github.com/your-username/openfleet.git
cd openfleet
docker compose up --build
```

Swagger UI: **http://localhost:8080**

Migrations and seed data apply automatically on first boot.

### Full stack — API + Web UI

**Terminal 1 — API:**

```bash
docker compose up --build
# or: dotnet run --project src/OpenFleet.Api
```

**Terminal 2 — Frontend:**

```bash
cd src/OpenFleet.Web
cp .env.example .env.local
npm install
npm run dev
```

Web UI: **http://localhost:5173**

The Vite dev server proxies `/api` to the backend, so no CORS setup is required locally.

### Default credentials

| Email | Password | Role | Typical use |
|-------|----------|------|-------------|
| `admin@openfleet.io` | `Admin@1234` | Administrator | Full access including user admin |
| `alice.johnson@openfleet.io` | `Fleet@1234` | FleetManager | Reports, maintenance schedules, audit |
| `bob.smith@openfleet.io` | `Fleet@1234` | Technician | Create work orders, inspections, vehicles |

---

## Environment Variables

### API (`.env` at repo root)

Copy `.env.example` to `.env` for Docker Compose. Key variables:

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | PostgreSQL credentials |
| `ConnectionStrings__DefaultConnection` | EF Core connection string |
| `JwtSettings__SecretKey` | HMAC signing key (min 32 chars) |
| `JwtSettings__Issuer` / `Audience` / `ExpiryMinutes` | JWT configuration |

See [.env.example](.env.example) for the full list.

### Frontend (`src/OpenFleet.Web/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend URL for Vite dev proxy | `http://localhost:8080` |

See [src/OpenFleet.Web/.env.example](src/OpenFleet.Web/.env.example). Only `VITE_*` variables are exposed to the browser bundle.

---

## Build Instructions

### API

```bash
dotnet build --configuration Release
dotnet publish src/OpenFleet.Api -c Release -o ./publish/api
```

### Frontend

```bash
cd src/OpenFleet.Web
npm ci
npm run build        # outputs to dist/
npm run preview      # serve production build locally
```

Deploy `dist/` behind a static host or reverse proxy that forwards `/api` to the API service.

---

## Running Tests

### Backend

```bash
dotnet test
```

With coverage:

```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

Tests use an EF Core In-Memory database — no PostgreSQL required. See [docs/testing.md](docs/testing.md).

### Frontend

```bash
cd src/OpenFleet.Web
npm run test              # Vitest unit and component tests
npm run test:coverage     # with coverage report
npm run test:e2e          # Playwright (requires API or mocked backend)
```

E2E tests run in CI with Chromium. See the `frontend-test` job in [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend shows blank data or 401 | Ensure the API is running on port 8080; check `VITE_API_BASE_URL` |
| Login succeeds but redirects back | Clear `localStorage` keys `openfleet_token` / `openfleet_token_expires` |
| Status badges show blank labels | Hard-refresh after updates; enums are normalized in services — report if a page was missed |
| Admin nav missing for admin user | Confirm role is `Administrator` (API may return numeric enum — handled by `lib/enums.ts`) |
| `npm run test:e2e` fails | Start API with seed data, or run in CI where the workflow configures the environment |
| Docker API won't start | Check port 8080 / 5432 conflicts; verify `.env` database credentials |
| CORS errors in production | Serve SPA and API under the same origin or configure API CORS for your host |

---

## API Documentation

Interactive Swagger UI: `http://localhost:8080` (Development).

**Authentication flow:**

1. `POST /api/auth/login` with `{"email": "...", "password": "..."}`
2. Copy the `token` from the response
3. In Swagger, click **Authorize** and paste the token (without `Bearer ` prefix)

The web app handles this automatically via the login form.

### Endpoint overview

| Area | Base Route |
|------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Users (Admin) | `GET/POST/PUT/DELETE /api/users` |
| Vehicles | `GET/POST/PUT/DELETE /api/vehicles` |
| Assets | `GET/POST/PUT/DELETE /api/assets` |
| Work Orders | `GET/POST /api/workorders`, `PATCH /api/workorders/{id}/status` |
| Inspections | `GET/POST/PUT /api/inspections` |
| Maintenance Schedules | `GET/POST /api/maintenance-schedules`, `GET /api/maintenance-schedules/due` |
| Departments | `GET /api/departments` |
| Integrations | `GET /api/integrations`, `POST /api/integrations/{source}/sync` |
| Audit | `GET /api/audit`, `GET /api/audit/{id}` |
| Reports | `GET /api/reports/*` (8 endpoints) |
| Health | `GET /health`, `/health/live`, `/health/ready` |

See [docs/api-design.md](docs/api-design.md) and [docs/frontend-api-client.md](docs/frontend-api-client.md).

---

## Frontend Documentation

| Document | Contents |
|----------|----------|
| [frontend-architecture.md](docs/frontend-architecture.md) | Stack, folder layout, patterns |
| [frontend-routes.md](docs/frontend-routes.md) | Route map and role policies |
| [frontend-api-client.md](docs/frontend-api-client.md) | Axios, services, enum normalization |
| [frontend-accessibility.md](docs/frontend-accessibility.md) | A11y patterns and testing |
| [screenshots.md](docs/screenshots.md) | UI capture guide and placeholders |

---

## Portfolio Relevance

OpenFleet is designed to demonstrate skills expected in enterprise full-stack roles:

- **Backend:** Clean Architecture, domain-driven validation, `Result<T>` error handling, JWT RBAC, EF Core migrations, background services, integration connectors, structured logging, health checks, comprehensive test pyramid
- **Frontend:** Feature-based modules, typed API layer, TanStack Query cache strategy, form validation with Zod, role-gated routing, accessible component library, dark mode, responsive layout
- **DevOps:** Docker Compose, GitHub Actions CI for API and frontend, artifact uploads for coverage and Playwright reports
- **Documentation:** Architecture decision records, API design docs, frontend guides, screenshot workflow

The project intentionally mirrors patterns found in fleet, logistics, and asset-management systems — a realistic domain for demonstrating CRUD, workflows, reporting, and audit requirements.

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md). Near-term ideas:

- [x] React frontend (OpenFleet.Web)
- [ ] SignalR real-time work order notifications
- [ ] PDF work order export
- [ ] Department create/edit API endpoints
- [ ] Application settings API
- [ ] OpenTelemetry traces (Jaeger/Zipkin)
- [ ] Multi-tenant fleet isolation

---

## Project Layout

```
.
├── .github/workflows/ci.yml         # GitHub Actions CI (API + frontend)
├── docs/                            # Architecture, API, frontend, testing docs
├── docs/images/                     # Screenshot placeholders and captures
├── src/
│   ├── OpenFleet.Api                # Controllers, middleware, Swagger
│   ├── OpenFleet.Application        # Services, DTOs, validators
│   ├── OpenFleet.Domain             # Entities, enums, domain services
│   ├── OpenFleet.Infrastructure     # EF Core, migrations, seed data
│   └── OpenFleet.Web/               # React SPA (Vite + TypeScript)
└── tests/
    └── OpenFleet.Tests              # Backend unit + integration tests
```

---

## Adding a Migration

```bash
dotnet ef migrations add <Name> \
  --project src/OpenFleet.Infrastructure \
  --startup-project src/OpenFleet.Api
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
