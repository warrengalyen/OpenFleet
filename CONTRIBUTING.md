# Contributing

Contributions, questions, and feedback are welcome. This is a portfolio project, so please keep PRs focused and well-explained.

---

## Getting Started

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes following the conventions below
4. Run the tests: `dotnet test`
5. Open a pull request

---

## Project Conventions

### Architecture

- **Do not add business logic to controllers.** Controllers map HTTP → service results → HTTP. Business rules belong in `OpenFleet.Application` or `OpenFleet.Domain`.
- **Use the `Result<T>` pattern** for service outcomes. Avoid throwing exceptions for expected failures (not found, invalid state).
- **Add FluentValidation validators** for every new request DTO. Name them `<RequestName>Validator` in `OpenFleet.Application.Validators`.
- **Register new services** in `Program.cs` - scoped for EF-dependent services, singleton for stateless helpers.

### Code Style

- C# naming conventions: `PascalCase` for types and methods, `camelCase` for locals and parameters
- Async methods end in `Async`
- No unused `using` statements
- No `var` when the type is not obvious from the right-hand side
- Comments only where the intent is non-obvious - do not narrate what the code does

### Commits

Semantic commit messages:

```
feat(vehicles): add license plate uniqueness validation
fix(auth): correct token expiry calculation
test(inspections): add auto-work-order creation scenario
docs: update API design with maintenance schedule examples
refactor(work-orders): extract status transition guard to domain service
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `ci`

Scope (optional): module name in parentheses

---

## Testing Requirements

- **Every new feature needs tests.** At minimum: one or two unit tests for business logic, and one integration test for the controller endpoint.
- Integration tests go in `tests/OpenFleet.Tests/Integration/` and use `OpenFleetWebFactory`.
- Use the fluent builders in `tests/OpenFleet.Tests/Helpers/Builders/` when creating test entities.
- Do not use magic strings for roles - use `UserRole` enum or `AuthorizationPolicies` constants.

---

## Adding a New Module

1. **Domain entity** in `OpenFleet.Domain.Entities`
2. **DbSet** on `IOpenFleetDbContext` and `OpenFleetDbContext`
3. **EF Core configuration** in `OpenFleet.Infrastructure.Persistence.Configurations`
4. **Migration**: `dotnet ef migrations add <Name> --project src/OpenFleet.Infrastructure --startup-project src/OpenFleet.Api`
5. **DTOs** in `OpenFleet.Application.DTOs`
6. **Validator** in `OpenFleet.Application.Validators`
7. **Service** in `OpenFleet.Application.Services`
8. **Controller** in `OpenFleet.Api.Controllers`
9. **Tests** for domain, service, and integration layers
10. **Swagger annotations**: `[ProducesResponseType]`, `[SwaggerOperation]` summary and tags

---

## Reporting Issues

Please open an issue describing:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment (OS, .NET version, Docker version)
