# Database Schema

OpenFleet uses PostgreSQL 16 managed by Entity Framework Core 8 (code-first migrations).

All entities extend `BaseEntity` which provides `Id` (UUID), `CreatedAt`, and `UpdatedAt` timestamps. UUIDs are generated client-side by EF Core, not by the database sequence.

---

## Entity Relationship Overview

```
Department
    │
    ├── User (many)
    ├── Vehicle (many)
    └── Asset (many)

Vehicle
    ├── WorkOrder (many)
    ├── Inspection (many)
    ├── Asset (many, optional assignment)
    └── MaintenanceSchedule (many)

Asset
    ├── WorkOrder (many, optional)
    └── Inspection (many, optional)

WorkOrder
    ├── WorkOrderNote (many)
    ├── MaintenanceRecord (one, optional)
    └── Inspection.GeneratedWorkOrderId (optional back-ref)

User
    ├── WorkOrder.AssignedUserId (many, optional)
    └── Inspection.InspectorUserId (many)

Vendor
    └── Part (many)

IntegrationLog    (standalone, no FK to domain entities)
AuditLog          (standalone, soft references via EntityId Guid?)
```

---

## Tables

### Departments

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Name | varchar(100) | required |
| Code | varchar(10) | required, unique |
| CreatedAt | timestamp | auto |
| UpdatedAt | timestamp | auto |

### Users

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| FirstName | varchar(100) | required |
| LastName | varchar(100) | required |
| Email | varchar(256) | required, unique |
| PasswordHash | text | BCrypt hash |
| Role | varchar(50) | stored as string (enum name) |
| IsActive | boolean | default true |
| DepartmentId | uuid | FK → Departments |

### Vehicles

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| VIN | varchar(17) | required, unique |
| LicensePlate | varchar(20) | required, unique |
| Make | varchar(100) | required |
| Model | varchar(100) | required |
| Year | integer | required |
| Mileage | integer | required |
| Status | integer | enum: Active=0, InMaintenance=1, Retired=2, Decommissioned=3 |
| DepartmentId | uuid | FK → Departments |

### Assets

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| AssetTag | varchar(50) | required, unique |
| Name | varchar(200) | required |
| Type | varchar(100) | required |
| Condition | integer | enum: New, Good, Fair, Poor, Damaged |
| Status | integer | enum: Available, InUse, UnderRepair, Decommissioned |
| PurchaseDate | timestamp | optional |
| DepartmentId | uuid | FK → Departments |
| VehicleId | uuid | FK → Vehicles (optional, asset assigned to vehicle) |

### WorkOrders

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Title | varchar(300) | required |
| Description | text | optional |
| Status | integer | enum: Open, InProgress, WaitingForParts, Completed, Cancelled |
| Priority | integer | enum: Low, Medium, High, Critical |
| LaborHours | decimal | cumulative hours recorded |
| CompletedAt | timestamp | set when status → Completed |
| VehicleId | uuid | FK → Vehicles (optional) |
| AssetId | uuid | FK → Assets (optional) |
| AssignedUserId | uuid | FK → Users (optional) |

At least one of `VehicleId` or `AssetId` must be provided (enforced by FluentValidation).

### WorkOrderNotes

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| WorkOrderId | uuid | FK → WorkOrders |
| Content | text | required |
| AuthorName | varchar(100) | required |

### MaintenanceRecords

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| WorkOrderId | uuid | FK → WorkOrders (unique - one record per WO) |
| PerformedAt | timestamp | required |
| OdometerReading | integer | required |
| Notes | text | optional |

### Inspections

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| VehicleId | uuid | FK → Vehicles (optional) |
| AssetId | uuid | FK → Assets (optional) |
| InspectorUserId | uuid | FK → Users |
| InspectedAt | timestamp | required |
| Status | integer | enum: Passed, Failed, NeedsReview |
| Notes | text | optional |
| GeneratedWorkOrderId | uuid | FK → WorkOrders (set if inspection failed) |

### MaintenanceSchedules

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Name | varchar(200) | required |
| Description | text | optional |
| VehicleId | uuid | FK → Vehicles (optional) |
| AssetId | uuid | FK → Assets (optional) |
| MileageInterval | integer | optional |
| DayInterval | integer | optional |
| LastPerformedAt | timestamp | optional |
| LastPerformedMileage | integer | optional |
| IsActive | boolean | false = soft deleted |

At least one interval must be set.

### Vendors

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Name | varchar(200) | required |
| ContactName | varchar(100) | required |
| Email | varchar(256) | required |
| Phone | varchar(30) | required |
| Address | text | required |

### Parts

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Name | varchar(200) | required |
| PartNumber | varchar(100) | required, unique |
| VendorId | uuid | FK → Vendors |
| QuantityOnHand | integer | |
| UnitCost | decimal | |

### IntegrationLogs

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Source | varchar(100) | e.g. FuelUsage, VendorRepair |
| Direction | varchar(20) | Import / Export |
| Status | varchar(20) | Pending, Success, Failed, PartialSuccess |
| Payload | text | JSON snapshot of sync data |
| RecordsProcessed | integer | |
| ErrorMessage | text | populated on failure |
| AttemptCount | integer | |
| LastAttemptAt | timestamp | |
| NextRetryAt | timestamp | for exponential backoff |

### AuditLogs

| Column | Type | Notes |
|--------|------|-------|
| Id | uuid | PK |
| Action | varchar(100) | e.g. VehicleUpdated, WorkOrderStatusChanged |
| EntityType | varchar(100) | e.g. "Vehicle", "WorkOrder" |
| EntityId | uuid | optional reference to the affected entity |
| ChangedBy | varchar(256) | email of the actor |
| OldValue | text | snapshot before change |
| NewValue | text | snapshot after change |
| Notes | text | human-readable context |

---

## Migrations

Migrations are managed with `dotnet ef`. To add a new migration:

```bash
dotnet ef migrations add <Name> \
  --project src/OpenFleet.Infrastructure \
  --startup-project src/OpenFleet.Api
```

Migrations apply automatically on startup (`db.Database.MigrateAsync()`).
