# OpenFleet

Open-source fleet and maintenance management API built with C#/.NET 8.

## Tech Stack

- ASP.NET Core 8 / Entity Framework Core 8 / PostgreSQL 16
- Serilog, Swashbuckle/Swagger, xUnit, Docker

## Quick Start

**Docker (recommended):**
```bash
docker compose up --build
```
Swagger UI: `http://localhost:8080`

**Local:**
```bash
# 1. Set connection string in appsettings.Development.json
# 2. Run
dotnet run --project src/OpenFleet.Api
```
Migrations and seed data apply automatically on first boot.

## API Endpoints

| Method | Route                                         | Description                              |
|--------|-----------------------------------------------|------------------------------------------|
| GET    | `/api/vehicles`                               | List vehicles (filterable)               |
| GET    | `/api/vehicles/{id}`                          | Get vehicle by ID                        |
| GET    | `/api/assets`                                 | List assets                              |
| GET    | `/api/workorders`                             | List work orders                         |
| PATCH  | `/api/workorders/{id}/status`                 | Transition work order status             |
| POST   | `/api/inspections`                            | Submit inspection (auto-creates WO if failed) |
| GET    | `/api/inspections`                            | List inspections (filterable)            |
| GET    | `/api/maintenance-schedules`                  | List maintenance schedules               |
| GET    | `/api/maintenance-schedules/due`              | Vehicles/assets due for service          |
| PUT    | `/api/maintenance-schedules/{id}/mark-performed` | Record service performed              |
| GET    | `/health`                                     | Full health check                        |

Full Swagger docs are available at `/` when running in development.

## Workflow Documentation

- [Inspection & Preventive Maintenance Workflow](docs/inspection-maintenance-workflow.md)

## Running Tests

```bash
dotnet test
```

## Adding a Migration

```bash
dotnet ef migrations add <Name> \
  --project src/OpenFleet.Infrastructure \
  --startup-project src/OpenFleet.Api
```

## Project Layout

```
src/
├── OpenFleet.Domain         # Entities, enums, exceptions
├── OpenFleet.Application    # Interfaces, Result<T>
├── OpenFleet.Infrastructure # EF Core, migrations, seed data
└── OpenFleet.Api            # Controllers, middleware, Swagger
tests/
└── OpenFleet.Tests          # xUnit (14 tests)
```

## License

MIT
