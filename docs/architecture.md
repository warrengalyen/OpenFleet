# Architecture

OpenFleet is structured as a Clean Architecture monolith with clear layer boundaries and dependency rules.

---

## Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│  OpenFleet.Api                                           │
│  Controllers · Hubs · Middleware · Extensions · Program.cs│
│                                                          │
│  Depends on: Application, Infrastructure                 │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│  OpenFleet.Application                                   │
│  Services · DTOs · Validators · Interfaces · Common      │
│  Reports (IPdfExportService, PdfExportResult, models)    │
│  INotificationPublisher + notification DTOs              │
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
│  Reports (QuestPDF documents, theme, QuestPdfExportService)│
│                                                          │
│  Implements Application interfaces                       │
└──────────────────────────────────────────────────────────┘
```

PDF export is generated server-side with [QuestPDF](https://www.questpdf.com/). Application owns contracts and immutable report models under `Application/Reports/`. Infrastructure owns QuestPDF document templates, shared components, styling, and `QuestPdfExportService`. The API registers `IPdfExportService` and configures the QuestPDF license at startup:

```csharp
QuestPDF.Settings.License = LicenseType.Community;
```

OpenFleet is an open-source portfolio demo and is configured for the QuestPDF Community license. Re-verify [QuestPDF licensing](https://www.questpdf.com/license/) before commercial redistribution; use a commercial license if the project no longer qualifies.

Real-time notifications use SignalR. Application owns `INotificationPublisher` and payload DTOs. The Api hosts `NotificationsHub` (`/hubs/notifications`) and `SignalRNotificationPublisher`. `WorkOrderService.TransitionStatusAsync` publishes status changes; `MaintenanceDueCheckerService` publishes newly overdue schedules (in-memory dedupe per process). JWT for hub connections accepts `access_token` on `/hubs` paths.

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
UseAuthorization                - enforces [Authorize(Policy = "...")] attributes
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

### Policy-Based Authorization

Five roles are defined in the `UserRole` enum (ordered by privilege):

| Role | Level |
|------|-------|
| Viewer | Read-only access |
| Technician | Read + work order / inspection write |
| Supervisor | Technician + wider read access |
| FleetManager | Supervisor + schedule and inventory management |
| Administrator | Full access including user administration |

Named policies in `AuthorizationPolicies` map to a minimum role via `MinimumRoleRequirement` / `MinimumRoleHandler`:

| Policy | Minimum role |
|--------|--------------|
| `AnyAuthenticated` | Viewer |
| `TechnicianOrAbove` | Technician |
| `FleetManagerOrAbove` | FleetManager |
| `AdminOnly` | Administrator |

Controllers and the SignalR hub use `[Authorize(Policy = AuthorizationPolicies....)]`. Policy names align with frontend `AuthPolicy` values in `lib/auth.ts`.

---

## Background Services

Two hosted services run on fixed intervals:

| Service | Interval | Purpose |
|---------|----------|---------|
| `MaintenanceDueCheckerService` | Every hour | Logs overdue schedules and publishes SignalR `MaintenanceOverdue` for newly overdue IDs |
| `IntegrationSyncService` | Every 5 minutes | Runs all registered `IExternalIntegrationConnector` implementations |

Both services use scoped DI lifetime (create a scope per run) to safely access `OpenFleetDbContext`.

---

## Database

PostgreSQL 16 via `Npgsql.EntityFrameworkCore.PostgreSQL`. All migrations are code-first (EF Core). The `DataSeeder` runs on startup only if the database is empty, seeding departments, users, vehicles, work orders, inspections, and integration logs for development use. On already-seeded databases it still ensures inventory demo data and that the public Viewer account has `IsDemoUser = true`.

### Protected demo accounts

`User.IsDemoUser` marks shared public demo logins. When `true`, self-service profile and password updates via `PUT /api/auth/profile` are rejected with **403** ProblemDetails (backend is authoritative). Admin deactivation and name changes for demo users are also blocked. Normal users (`IsDemoUser = false`) retain full self-service profile updates. Create additional protected demo accounts by setting `IsDemoUser = true` in seed data—do not authorize by hard-coded email in application services.

See [database-schema.md](database-schema.md) for the entity relationship overview.

---

## Testing Architecture

Tests use `WebApplicationFactory<Program>` with EF Core In-Memory database, replacing PostgreSQL entirely. A shared `OpenFleetWebFactory` instance (via xUnit `ICollectionFixture`) is used across all integration tests to avoid repeated startup overhead.

`TestJwtHelper.GenerateToken(role)` produces signed JWT tokens for authenticated test requests. `CreateClientWithRole(role)` wraps this into a pre-configured `HttpClient`.

See [testing.md](testing.md) for details.
