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

| Method | Route                  | Description          |
|--------|------------------------|----------------------|
| GET    | `/api/vehicles`        | List vehicles        |
| GET    | `/api/vehicles/{id}`   | Get vehicle by ID    |
| GET    | `/api/workorders`      | List work orders     |
| GET    | `/api/workorders/{id}` | Get work order by ID |
| GET    | `/api/health/ping`     | Liveness check       |
| GET    | `/health`              | Full health check    |

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
