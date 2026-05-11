# Testing

OpenFleet has 243 tests across five layers: domain, application, infrastructure, API middleware, and integration.

```
dotnet test
```

No external dependencies are required — tests use EF Core In-Memory database.

---

## Test Structure

```
tests/OpenFleet.Tests/
├── Domain/
│   ├── VehicleTests.cs                      — entity defaults and property assignment
│   ├── WorkOrderStatusRulesTests.cs          — valid/invalid status transitions
│   ├── MaintenanceDueCalculatorTests.cs      — date/mileage due logic
│   └── InspectionWorkOrderPolicyTests.cs     — auto-WO creation policy
│
├── Application/
│   ├── AuthServiceTests.cs                   — login, JWT generation, inactive users
│   ├── AuditServiceTests.cs                  — audit log persistence and filtering
│   ├── ReportingServiceTests.cs              — report aggregation math
│   ├── IntegrationLogServiceTests.cs         — sync log create/update, retry tracking
│   ├── VehicleValidatorTests.cs              — FluentValidation: VIN, plate, year, mileage
│   ├── AssetValidatorTests.cs                — FluentValidation: asset tag, type
│   ├── WorkOrderValidatorTests.cs            — title, target, labor hours, note content
│   ├── InspectionValidatorTests.cs           — target, inspector, future date guard
│   └── MaintenanceScheduleValidatorTests.cs  — name, interval requirements
│
├── Infrastructure/
│   ├── OpenFleetDbContextTests.cs            — EF Core CRUD operations
│   └── MockConnectorTests.cs                 — external integration mock outputs
│
├── Api/
│   └── ExceptionHandlingMiddlewareTests.cs   — 400/404/500 responses, correlationId injection
│
├── Integration/
│   ├── AuthIntegrationTests.cs               — login, /me endpoint, token shape
│   ├── AuthorizationTests.cs                 — role guards across all controllers
│   ├── VehiclesIntegrationTests.cs           — vehicle CRUD, filtering, validation
│   ├── AssetsIntegrationTests.cs             — asset CRUD and validation
│   ├── WorkOrdersIntegrationTests.cs         — work order lifecycle, status transitions
│   ├── InspectionsIntegrationTests.cs        — inspection submission, auto-WO on failure
│   ├── IntegrationsIntegrationTests.cs       — integration history, sync triggers
│   └── ReportsIntegrationTests.cs            — all 8 report endpoints, auth enforcement
│
└── Helpers/
    ├── OpenFleetWebFactory.cs                — WebApplicationFactory, JWT helper, test seeding
    └── Builders/
        ├── DepartmentBuilder.cs              — fluent builder for Department entities
        ├── VehicleBuilder.cs                 — fluent builder with unique VIN/plate counters
        ├── WorkOrderBuilder.cs               — fluent builder with Completed() shortcut
        └── InspectionBuilder.cs              — fluent builder with Failed() shortcut
```

---

## Integration Test Infrastructure

### OpenFleetWebFactory

`WebApplicationFactory<Program>` is subclassed to:
- Replace PostgreSQL with EF Core In-Memory database
- Suppress Serilog (avoid static logger conflicts across test runs)
- Seed a minimal admin user for authentication tests
- Share one factory instance across all integration tests via `ICollectionFixture`

```csharp
[Collection("Integration")]
public class VehiclesIntegrationTests
{
    private readonly HttpClient _client;

    public VehiclesIntegrationTests(OpenFleetWebFactory factory)
    {
        _client = factory.CreateClientWithRole("FleetManager");
    }
}
```

### TestJwtHelper

Generates valid signed JWT tokens for any role, using the same secret as the running API:

```csharp
var client = factory.CreateClientWithRole("Technician");
// → HttpClient with Authorization: Bearer eyJ...
```

### Test Data Builders

Fluent builders provide sensible defaults and ensure uniqueness (auto-incrementing counters):

```csharp
var vehicle = new VehicleBuilder()
    .WithMake("Ford")
    .WithStatus(VehicleStatus.InMaintenance)
    .WithDepartmentId(deptId)
    .Build();

var inspection = new InspectionBuilder()
    .WithVehicleId(vehicleId)
    .Failed("Brake fluid contaminated.")
    .Build();
```

---

## Domain Testing

Domain tests are pure unit tests with no database or DI dependencies. They test the business rules directly:

```csharp
[Fact]
public void Transition_from_Completed_to_Open_is_invalid()
{
    var allowed = WorkOrderStatusRules.GetAllowedTransitions(WorkOrderStatus.Completed);
    Assert.DoesNotContain(WorkOrderStatus.Open, allowed);
}
```

---

## Middleware Testing

`ExceptionHandlingMiddleware` is tested by constructing it with a fake `RequestDelegate` that throws specific exceptions:

```csharp
RequestDelegate throwDomain = _ => Task.FromException(new DomainException("Invalid transition."));
var middleware = new ExceptionHandlingMiddleware(throwDomain, NullLogger<...>.Instance);

var context = new DefaultHttpContext();
await middleware.InvokeAsync(context);

Assert.Equal(400, context.Response.StatusCode);
Assert.Equal("application/problem+json", context.Response.ContentType);
```

---

## Coverage

Run with Coverlet:

```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage
```

Coverage XML is uploaded as an artifact in the GitHub Actions CI pipeline.

---

## CI Pipeline

Tests run automatically on every push and pull request to `main` via `.github/workflows/ci.yml`. The workflow:

1. Restores NuGet packages
2. Builds in Release configuration
3. Runs all tests with coverage collection
4. Uploads coverage XML and TRX results as artifacts (14-day retention)

No external services (PostgreSQL, Redis, etc.) are required in CI — tests are fully self-contained.
