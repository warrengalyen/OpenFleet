# API Design

OpenFleet exposes a RESTful JSON API documented with Swagger/OpenAPI. All responses follow RFC 7807 ProblemDetails for errors and include a `X-Correlation-ID` header for request tracing.

Interactive docs: **http://localhost:8080** (when running in Development)

---

## Authentication

All endpoints except `POST /api/auth/login` require a Bearer token.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@openfleet.io",
  "password": "Admin@1234"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-07-08T02:00:00Z",
  "userId": "22222222-0000-0000-0000-000000000004",
  "email": "admin@openfleet.io",
  "role": "Administrator",
  "fullName": "Admin User"
}
```

Use the `token` value as a Bearer token in subsequent requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Responses

All errors return `application/problem+json` (RFC 7807):

```json
{
  "type": "https://httpstatuses.io/400",
  "title": "Domain Error",
  "status": 400,
  "detail": "Cannot transition from Completed to Open.",
  "instance": "/api/workorders/abc/status",
  "correlationId": "908dcc06-a181-471c-8321-1977866db5cd"
}
```

Validation errors return `ValidationProblemDetails` with per-field error arrays:

```json
{
  "type": "https://httpstatuses.io/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "VIN": ["VIN is required.", "VIN must be alphanumeric (no I, O, or Q)."]
  },
  "correlationId": "908dcc06-a181-471c-8321-1977866db5cd"
}
```

---

## Vehicles

### List vehicles

```http
GET /api/vehicles?status=Active&departmentId={id}&search=ford&page=1&pageSize=20
Authorization: Bearer {token}
```

Query parameters:
- `status` - `Active`, `InMaintenance`, `Retired`, `Decommissioned`
- `departmentId` - filter by department
- `search` - searches VIN, make, model, license plate
- `page`, `pageSize` - pagination

### Create vehicle

```http
POST /api/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "vin": "1HGBH41JXMN109186",
  "licensePlate": "OPS-001",
  "make": "Ford",
  "model": "F-150",
  "year": 2022,
  "mileage": 15023,
  "status": "Active",
  "departmentId": "11111111-0000-0000-0000-000000000001"
}
```

---

## Work Orders

### Create work order

```http
POST /api/workorders
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Front Brake Inspection",
  "description": "Driver reported brake squeal. Inspect and replace if worn.",
  "priority": "High",
  "vehicleId": "44444444-0000-0000-0000-000000000001",
  "assignedUserId": "22222222-0000-0000-0000-000000000002"
}
```

### Transition status

Valid transitions: `Open → InProgress → WaitingForParts → InProgress → Completed`  
`Cancelled` can be reached from any non-terminal state.

```http
PATCH /api/workorders/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "newStatus": "InProgress"
}
```

Invalid transitions return `400 Domain Error`.

### Record labor hours

```http
POST /api/workorders/{id}/labor
Authorization: Bearer {token}
Content-Type: application/json

{
  "hours": 2.5
}
```

### Add note

```http
POST /api/workorders/{id}/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Replaced front brake pads. Rotors within tolerance.",
  "authorName": "Bob Smith"
}
```

---

## Inspections

### Submit inspection

A `Failed` inspection automatically creates a High-priority work order. The response includes `generatedWorkOrderId`.

```http
POST /api/inspections
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": "44444444-0000-0000-0000-000000000003",
  "inspectorUserId": "22222222-0000-0000-0000-000000000003",
  "inspectedAt": "2026-07-07T14:00:00Z",
  "status": "Failed",
  "notes": "Brake fluid contaminated. Left tail light inoperative."
}
```

**Response (201 Created):**
```json
{
  "id": "...",
  "status": "Failed",
  "generatedWorkOrderId": "...",
  ...
}
```

---

## Maintenance Schedules

### Create schedule

```http
POST /api/maintenance-schedules
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Oil Change",
  "vehicleId": "44444444-0000-0000-0000-000000000001",
  "mileageInterval": 5000,
  "dayInterval": 180
}
```

### Get vehicles due for service

```http
GET /api/maintenance-schedules/due
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "vehicleId": "44444444-0000-0000-0000-000000000001",
    "vehicleDescription": "2022 Ford F-150",
    "currentMileage": 16000,
    "dueSchedules": [
      {
        "scheduleName": "Oil Change",
        "isDueByMileage": true,
        "nextDueMileage": 15000,
        "milesOverdue": 1000
      }
    ]
  }
]
```

---

---

## Application Settings

Fleet-wide operational settings are stored in the database as a singleton record. All authenticated roles can read settings; only **Administrator** can update them.

### Get settings

```http
GET /api/settings
Authorization: Bearer {token}
```

### Update settings

```http
PUT /api/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "organizationName": "OpenFleet",
  "defaultWorkOrderPriority": "Medium",
  "defaultWorkOrderDueDays": 7,
  "autoCreateWorkOrderOnFailedInspection": true,
  "maintenanceReminderLeadDays": 7,
  "lowPartsStockThreshold": 25,
  "integrationRetryLimit": 3,
  "auditLogRetentionDays": 365
}
```

| Setting | Controls |
|---------|----------|
| `organizationName` | Display name in dashboard/header |
| `defaultWorkOrderPriority` | Priority used when a work order is created without one |
| `defaultWorkOrderDueDays` | Days from creation until work order `dueDate` |
| `autoCreateWorkOrderOnFailedInspection` | Whether failed inspections generate corrective work orders |
| `maintenanceReminderLeadDays` | Include schedules due within N days in due/upcoming reports |
| `lowPartsStockThreshold` | Quantity at or below which parts are flagged low stock |
| `integrationRetryLimit` | Max failed sync attempts before permanent failure |
| `auditLogRetentionDays` | Stored for future cleanup (**not enforced automatically yet**) |

---

## Departments

Departments organize vehicles, assets, and users. All authenticated roles can list and view departments; only **Administrator** can create, update, or delete.

### List departments

```http
GET /api/departments
Authorization: Bearer {token}
```

### Create department

```http
POST /api/departments
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Warehouse",
  "code": "WHS"
}
```

Validation:
- `name` - required, max 100 characters, unique (case-insensitive)
- `code` - required, max 20 characters, uppercase alphanumeric, unique

### Update department

```http
PUT /api/departments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Warehouse Operations",
  "code": "WHS"
}
```

### Delete department

```http
DELETE /api/departments/{id}
Authorization: Bearer {token}
```

Returns `409 Conflict` when vehicles, users, or assets are still assigned to the department.

Department mutations are recorded in the audit log (`DepartmentCreated`, `DepartmentUpdated`, `DepartmentDeleted`).

---

## Reports

All report endpoints require any authenticated role (`GET` only).

| Endpoint | Description |
|----------|-------------|
| `GET /api/reports/open-work-orders` | Open WOs grouped by status with item list |
| `GET /api/reports/vehicles-due` | Vehicles/assets with overdue maintenance |
| `GET /api/reports/maintenance-cost` | Total labor hours + completed WOs per vehicle |
| `GET /api/reports/parts-usage` | Parts inventory with total inventory value |
| `GET /api/reports/vehicle-downtime` | Vehicles in maintenance or with open WOs |
| `GET /api/reports/inspection-failure-rate` | Failure rate % and top-failing vehicles |
| `GET /api/reports/work-orders-by-status` | Count of WOs in each status |
| `GET /api/reports/work-orders-by-priority` | Count of WOs in each priority level |

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Combined check (all registered checks) |
| `GET /health/live` | Liveness - always 200 while process is running |
| `GET /health/ready` | Readiness - requires PostgreSQL healthy |

**Response format:**
```json
{
  "status": "Healthy",
  "checks": [
    { "name": "postgres", "status": "Healthy", "description": null }
  ]
}
```

---

## Role Reference

| Role | Read | Write WO/Inspection | Manage Schedules | Manage Users | Manage Departments | Audit |
|------|------|---------------------|-----------------|--------------|-------------------|-------|
| Viewer | ✓ | - | - | - | read | - |
| Technician | ✓ | ✓ | - | - | read | - |
| Supervisor | ✓ | ✓ | - | - | read | - |
| FleetManager | ✓ | ✓ | ✓ | - | read | ✓ |
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
