# Architecture

OpenFleet is structured as a Clean Architecture monolith with clear layer boundaries and dependency rules.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│  OpenFleet.Api                                           │
│  Controllers · Middleware · Extensions · Program.cs      │
│                                                          │
│  Depends on: Application, Infrastructure                 │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│  OpenFleet.Application                                   │
│  Services · DTOs · Validators · Interfaces · Common      │
│                                                          │
│  Depends on: Domain only                                 │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│  OpenFleet.Domain                                        │
│  Entities · Enums · Exceptions · Domain Services         │
│                                                          │
│  No dependencies on other layers                         │
└──────────────────────────────────────────────────────────┘
                           ▲
┌──────────────────────────┴───────────────────────────────┐
│  OpenFleet.Infrastructure                                │
│  EF Core DbContext · Migrations · Seeders                │
│  Background Services · External Connectors               │
│                                                          │
│  Implements Application interfaces                       │
└──────────────────────────────────────────────────────────┘
```

---

## Request Pipeline

Every HTTP request passes through this middleware chain before reaching a controller:

```
HTTP Request
    │
    ▼
CorrelationIdMiddleware        - reads/generates X-Correlation-ID header
    │
    ▼
ExceptionHandlingMiddleware    - catches DomainException, KeyNotFoundException, unhandled errors
    │
    ▼
UseSerilogRequestLogging       - logs method, path, status, elapsed time
    │
    ▼
Swagger UI (Development only)
    │
    ▼
UseAuthentication               - validates JWT Bearer token
    │
    ▼
UseAuthorization                - enforces [Authorize(Roles = "...")] attributes
    │
    ▼
Controllers
```

---

## Key Design Patterns

### Result\<T\>

Services return `Result<T>` instead of throwing exceptions for expected failure cases. This keeps control flow explicit and errors traceable.

```csharp
public async Task<Result<WorkOrderResponse>> CreateAsync(CreateWorkOrderRequest request)
{
    if (vehicle is null)
        return Result<WorkOrderResponse>.Failure("Vehicle not found.", ErrorCode.NotFound);

    // ...
    return Result<WorkOrderResponse>.Success(response);
}
```

Controllers map `Result<T>` to appropriate HTTP responses.

### Domain Services

Business rules that span multiple entities live in stateless domain services in `OpenFleet.Domain.Services`:

| Service | Responsibility |
|---------|---------------|
| `WorkOrderStatusRules` | Valid status transitions (Open → InProgress, etc.) |
| `InspectionWorkOrderPolicy` | Whether a failed inspection should generate a work order |
| `MaintenanceDueCalculator` | Date/mileage due calculations for maintenance schedules |

### IOpenFleetDbContext Interface

The Application layer never references `OpenFleetDbContext` directly. It uses `IOpenFleetDbContext`, which exposes `DbSet<T>` properties and `SaveChangesAsync`. This makes services testable without EF's concrete implementation.

### FluentValidation

All request DTOs have corresponding validators in `OpenFleet.Application.Validators`. Validation is wired via `AddFluentValidationAutoValidation()` and runs automatically before the action method is called. Validation failures return `ValidationProblemDetails` (RFC 7807) enriched with the request's `correlationId`.

### Audit Trail

`AuditService` is injected into services that perform auditable operations. It writes `AuditLog` records with old/new values and the identity of the actor. Audited actions include vehicle updates, work order status changes, inspection failures, sync failures, and user management.

### Role-Based Authorization

Five roles are defined in `UserRole` enum:

| Role | Level |
|------|-------|
| Viewer | Read-only access |
| Technician | Read + work order / inspection write |
| Supervisor | Technician + wider read access |
| FleetManager | Supervisor + schedule and user management |
| Administrator | Full access including user administration |

`AuthorizationPolicies` static class provides role-string constants used in `[Authorize(Roles = "...")]` attributes across all controllers.

---

## Background Services

Two hosted services run on fixed intervals:

| Service | Interval | Purpose |
|---------|----------|---------|
| `MaintenanceDueCheckerService` | Every hour | Logs warnings for overdue maintenance schedules |
| `IntegrationSyncService` | Every 5 minutes | Runs all registered `IExternalIntegrationConnector` implementations |

Both services use scoped DI lifetime (create a scope per run) to safely access `OpenFleetDbContext`.

---

## Database

PostgreSQL 16 via `Npgsql.EntityFrameworkCore.PostgreSQL`. All migrations are code-first (EF Core). The `DataSeeder` runs on startup only if the database is empty, seeding departments, users, vehicles, work orders, inspections, and integration logs for development use.

See [database-schema.md](database-schema.md) for the entity relationship overview.

---

## Testing Architecture

Tests use `WebApplicationFactory<Program>` with EF Core In-Memory database, replacing PostgreSQL entirely. A shared `OpenFleetWebFactory` instance (via xUnit `ICollectionFixture`) is used across all integration tests to avoid repeated startup overhead.

`TestJwtHelper.GenerateToken(role)` produces signed JWT tokens for authenticated test requests. `CreateClientWithRole(role)` wraps this into a pre-configured `HttpClient`.

See [testing.md](testing.md) for details.
