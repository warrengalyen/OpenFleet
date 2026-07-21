# Roadmap

This roadmap lists potential improvements for OpenFleet. The project is a portfolio demo - contributions and ideas are welcome.

---

## Near-Term

- [x] **Real-time notifications** - SignalR hub for work order status changes and overdue maintenance alerts
- [x] **PDF export** - work order detail and vehicle maintenance history as downloadable PDFs
- [x] **Pagination metadata** - add `totalCount`, `pageCount` envelope to all paginated list responses
- [x] **Soft delete on vehicles and assets** - retire without hard delete; filter by `IsDeleted` flag
- [x] **User profile update** - `PUT /api/auth/profile` for password change and display name



## Architecture Improvements

- [ ] **Policy-based authorization** - replace role-string constants with `IAuthorizationRequirement` policies for finer-grained access control
- [ ] **Outbox pattern** - reliable integration event publishing using a database-backed outbox (e.g., MassTransit or a simple EF Core outbox table)
- [ ] **CQRS separation** - split read/write operations with separate query models for reporting endpoints
- [ ] **OpenTelemetry** - distributed traces with Jaeger or Zipkin exporter; spans across controller → service → EF Core



## Operational

- [ ] **Alerting** - integration with a notification service (email, Slack) when maintenance is overdue or integrations fail
- [ ] **Multi-tenancy** - fleet isolation by tenant ID for SaaS scenarios
- [ ] **Rate limiting** - per-user or per-IP throttling using ASP.NET Core rate limiter middleware
- [ ] **Response caching** - cache report endpoints with a short TTL (e.g., 1 minute) to reduce DB load



## Frontend

- [x] **React dashboard** - Vite/React app consuming the OpenFleet API
- [ ] **Mobile app** - Flutter or React Native technician app for work order updates and inspection submission



## Testing & Quality

- [ ] **Mutation testing** - Stryker.NET to measure test quality
- [ ] **Contract testing** - Pact for consumer-driven API contracts if a frontend is added
- [ ] **Load testing** - k6 or NBomber scripts for key endpoints under concurrent load