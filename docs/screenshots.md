# Screenshots

OpenFleet's primary interface is the Swagger UI available at `http://localhost:8080` in Development mode.

---

## Swagger UI

The Swagger UI provides interactive documentation for all API endpoints.

**To access:**
1. Start the API: `docker compose up --build`
2. Open `http://localhost:8080`
3. Authenticate: click **Authorize**, call `POST /api/auth/login`, paste the returned token

### Endpoint Groups

The Swagger UI organizes endpoints by controller tag:

| Tag | Endpoints |
|-----|----------|
| Auth | Login, current user profile |
| Users | Admin user management |
| Vehicles | Fleet CRUD with filtering |
| Assets | Asset tracking CRUD |
| WorkOrders | Work order lifecycle management |
| Inspections | Inspection submission and history |
| MaintenanceSchedules | Schedule creation, due-for-service view |
| Departments | Department management |
| Integrations | Sync history and manual triggers |
| Audit | Audit trail history |
| Reports | 8 dashboard and operational report endpoints |

---

## Adding Real Screenshots

To add real screenshots to this document:

1. Start the API with `docker compose up --build`
2. Open `http://localhost:8080`
3. Take screenshots of:
   - The full endpoint list in Swagger UI
   - The Authorize dialog with a token pasted
   - A sample request/response (e.g., `GET /api/reports/work-orders-by-status`)
   - The `/health` endpoint response
4. Save images to `docs/images/`
5. Reference them here:

```markdown
![Swagger UI](images/swagger-ui.png)
![Work Orders Report](images/work-orders-by-status.png)
```

---

## Sample API Responses

### GET /api/reports/work-orders-by-status

```json
{
  "open": 2,
  "inProgress": 1,
  "waitingForParts": 1,
  "completed": 3,
  "cancelled": 1,
  "total": 8
}
```

### GET /health/ready

```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "postgres",
      "status": "Healthy",
      "description": null
    }
  ]
}
```

### POST /api/auth/login (response)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-07-08T01:00:00Z",
  "userId": "22222222-0000-0000-0000-000000000004",
  "email": "admin@openfleet.io",
  "role": "Administrator",
  "fullName": "Admin User"
}
```

### GET /api/reports/inspection-failure-rate

```json
{
  "totalInspections": 4,
  "passed": 2,
  "failed": 1,
  "needsReview": 1,
  "failureRatePercent": 25.0,
  "topFailedVehicles": [
    {
      "vehicleId": "44444444-0000-0000-0000-000000000003",
      "vehicleLabel": "Ram ProMaster",
      "failedCount": 1
    }
  ]
}
```

### Error response (ProblemDetails)

```json
{
  "type": "https://httpstatuses.io/400",
  "title": "Domain Error",
  "status": 400,
  "detail": "Cannot transition from Completed to Open.",
  "instance": "/api/workorders/55555555-0000-0000-0000-000000000001/status",
  "correlationId": "908dcc06-a181-471c-8321-1977866db5cd"
}
```
