# OpenFleet

**A fleet and maintenance management REST API** built with C#/.NET 8 as a portfolio demonstration of enterprise backend architecture.

---

## What Is OpenFleet?

OpenFleet is a backend API for managing a vehicle fleet — tracking vehicles and assets, scheduling preventive maintenance, logging inspections, dispatching work orders to technicians, and syncing with external systems (fuel data, vendor repairs, parts suppliers). It is not a finished product; it is a portfolio project demonstrating how I approach backend systems at an enterprise scale.

---

## Features

| Area | What's Included |
|------|----------------|
| Fleet Management | Vehicle and asset CRUD with filtering, department assignment, VIN validation |
| Work Orders | Full lifecycle with status transitions, priority levels, labor hour tracking, notes |
| Inspections | Inspection submission with automatic work order creation on failure |
| Preventive Maintenance | Mileage and date-interval schedules; background service checks every hour |
| Authentication | JWT Bearer with role-based access (Viewer, Technician, Supervisor, FleetManager, Administrator) |
| Audit Trail | Immutable audit log for vehicle updates, status changes, inspection failures, sync failures |
| External Integrations | Mock connectors for fuel import, vendor repair status, parts inventory, and asset sync |
| Reporting | 8 dashboard endpoints: open work orders, maintenance cost, parts inventory, downtime, failure rates |
| Observability | Correlation IDs on every request/response, structured Serilog logging, split health checks |
| Testing | 243 tests — domain, application, infrastructure, integration, and middleware layers |
| CI | GitHub Actions build, test, and coverage pipeline |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | .NET 8 / ASP.NET Core |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL 16 |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Validation | FluentValidation with auto-validation |
| Logging | Serilog (Console + File sinks, LogContext enricher) |
| API Docs | Swashbuckle / Swagger UI |
| Testing | xUnit, EF Core In-Memory, WebApplicationFactory |
| Containers | Docker / Docker Compose |
| CI | GitHub Actions |

---

## Architecture

OpenFleet follows **Clean Architecture** with four layers:

```
┌─────────────────────────────────┐
│  OpenFleet.Api                  │  Controllers, Middleware, Swagger
│  ─────────────────────────────  │
│  OpenFleet.Application          │  Services, DTOs, Validators, Interfaces
│  ─────────────────────────────  │
│  OpenFleet.Domain               │  Entities, Enums, Exceptions, Domain Services
│  ─────────────────────────────  │
│  OpenFleet.Infrastructure       │  EF Core, Migrations, Background Services, Connectors
└─────────────────────────────────┘
```

**Key design decisions:**
- Business rules live in the Domain and Application layers, not controllers
- The `Result<T>` pattern is used for service-layer outcomes instead of exceptions for control flow
- `IOpenFleetDbContext` interface decouples the Application layer from EF Core
- Background services use `IHostedService` and are fully testable via the in-memory DB

See [docs/architecture.md](docs/architecture.md) for a detailed breakdown.

---

## Running Locally

### Prerequisites

- Docker Desktop, **or** .NET 8 SDK + PostgreSQL 16

### Docker (recommended)

```bash
git clone https://github.com/your-username/openfleet.git
cd openfleet
docker compose up --build
```

Swagger UI: **http://localhost:8080**

Migrations and seed data apply automatically on first boot.

**Default credentials:**

| Email | Password | Role |
|-------|----------|------|
| `admin@openfleet.io` | `Admin@1234` | Administrator |
| `alice.johnson@openfleet.io` | `Fleet@1234` | FleetManager |
| `bob.smith@openfleet.io` | `Fleet@1234` | Technician |

### Local (without Docker)

```bash
# 1. Copy the env example
cp .env.example .env
# edit .env with your PostgreSQL connection string

# 2. Run
dotnet run --project src/OpenFleet.Api
```

Or configure `ConnectionStrings:DefaultConnection` in `src/OpenFleet.Api/appsettings.Development.json`.

---

## Running Tests

```bash
dotnet test
```

With coverage:

```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

Tests use an EF Core In-Memory database — no PostgreSQL required. See [docs/testing.md](docs/testing.md) for the full testing strategy.

---

## API Documentation

Interactive Swagger UI is available at `http://localhost:8080` when running in Development.

**Authentication flow:**

1. `POST /api/auth/login` with `{"email": "...", "password": "..."}`
2. Copy the `token` from the response
3. Click **Authorize** in Swagger UI and paste the token (without `Bearer ` prefix)

### Endpoint Overview

| Area | Base Route |
|------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Users (Admin) | `GET/POST/PUT/DELETE /api/users` |
| Vehicles | `GET/POST/PUT/DELETE /api/vehicles` |
| Assets | `GET/POST/PUT/DELETE /api/assets` |
| Work Orders | `GET/POST /api/workorders`, `PATCH /api/workorders/{id}/status` |
| Inspections | `GET/POST/PUT /api/inspections` |
| Maintenance Schedules | `GET/POST /api/maintenance-schedules`, `GET /api/maintenance-schedules/due` |
| Departments | `GET/POST/PUT/DELETE /api/departments` |
| Integrations | `GET /api/integrations`, `POST /api/integrations/{source}/sync` |
| Audit | `GET /api/audit`, `GET /api/audit/{id}` |
| Reports | `GET /api/reports/*` (8 endpoints) |
| Health | `GET /health`, `/health/live`, `/health/ready` |

See [docs/api-design.md](docs/api-design.md) for request/response examples.

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned enhancements. Near-term ideas:

- [ ] SignalR real-time work order notifications
- [ ] PDF work order export
- [ ] RBAC policy-based authorization (replace role-string constants)
- [ ] Outbox pattern for integration event reliability
- [ ] React or Next.js frontend
- [ ] OpenTelemetry traces (Jaeger/Zipkin)
- [ ] Multi-tenant fleet isolation

---

## Project Layout

```
.
├── .github/workflows/ci.yml         # GitHub Actions CI
├── docs/                            # Architecture, API, testing docs
├── src/
│   ├── OpenFleet.Api                # Controllers, middleware, Swagger, Program.cs
│   ├── OpenFleet.Application        # Services, DTOs, validators, interfaces
│   ├── OpenFleet.Domain             # Entities, enums, exceptions, domain services
│   └── OpenFleet.Infrastructure     # EF Core, migrations, seed data, background services
└── tests/
    └── OpenFleet.Tests              # Unit + integration tests (243 total)
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
