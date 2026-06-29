# Inspection & Preventive Maintenance Workflow

This document describes the inspection lifecycle and preventive maintenance scheduling features in OpenFleet.

---

## 1. Inspection Lifecycle

An inspection captures the result of a physical check on a vehicle or asset. Every inspection has one of three statuses:

| Status | Description |
|---|---|
| `Passed` | Inspection was successful - no issues found. |
| `Failed` | Critical issue detected - a work order is automatically created. |
| `NeedsReview` | Minor concern noted - flagged for follow-up but no automatic action taken. |

### Inspections are immutable records

Once created, inspections serve as an audit trail. The `DELETE` endpoint returns `405 Method Not Allowed`.

---

## 2. Auto-Work-Order Creation Policy

The `InspectionWorkOrderPolicy` (in `OpenFleet.Domain.Services`) governs when a work order is automatically created.

**Rule:** If `Status == Failed` → create a work order.

The policy assigns `High` priority by default and titles the work order `"Inspection Failure - <vehicle/asset description>"`.

This logic runs in two scenarios:
- On initial inspection creation (`POST /api/inspections`)
- On status update if the status transitions to `Failed` and no work order has been created yet (`PUT /api/inspections/{id}`)

The response includes `generatedWorkOrderId` so the caller can immediately navigate to the created work order.

---

## 3. Maintenance Schedule Setup

Maintenance schedules define recurring service tasks linked to vehicles or assets. Each schedule can use one or both interval types:

| Interval Type | Field | Example |
|---|---|---|
| Date-based | `DayInterval` | Every 90 days |
| Mileage-based | `MileageInterval` | Every 5,000 miles |

A schedule is marked as **due** if either condition is satisfied. If a schedule has never been performed, it is immediately considered due.

**Create a schedule:**
```http
POST /api/maintenance-schedules
{
  "name": "Oil Change",
  "vehicleId": "...",
  "mileageInterval": 5000,
  "dayInterval": 180
}
```

**Mark as performed:**
```http
PUT /api/maintenance-schedules/{id}/mark-performed
{
  "performedAt": "2026-07-07T10:00:00Z",
  "mileage": 15000
}
```

**Deactivate a schedule (soft delete):**
```http
DELETE /api/maintenance-schedules/{id}
```

---

## 4. Due-for-Service Calculation

The `MaintenanceDueCalculator` domain service (in `OpenFleet.Domain.Services`) computes:

- `IsDue(schedule, now, currentMileage)` - true if past date or mileage threshold
- `NextDueDate(schedule)` - when the schedule is next due by date
- `NextDueMileage(schedule)` - mileage at which service is due next
- `DaysOverdue(schedule, now)` - how long past the due date (if applicable)
- `MilesOverdue(schedule, currentMileage)` - how many miles past the due mileage (if applicable)

---

## 5. Due-for-Service API

Returns all vehicles and assets with at least one active schedule that is currently due:

```http
GET /api/maintenance-schedules/due
```

**Response shape:**
```json
[
  {
    "vehicleId": "...",
    "vehicleDescription": "2022 Ford F-150",
    "currentMileage": 16000,
    "dueSchedules": [
      {
        "scheduleId": "...",
        "scheduleName": "Oil Change",
        "isDueByDate": false,
        "isDueByMileage": true,
        "nextDueMileage": 15000,
        "milesOverdue": 1000
      }
    ]
  }
]
```

---

## 6. Background Due-Checker Service

`MaintenanceDueCheckerService` (in `OpenFleet.Infrastructure.BackgroundServices`) is a hosted background service that runs **every hour**.

On each interval it:
1. Loads all active maintenance schedules from the database.
2. Evaluates each against `MaintenanceDueCalculator.IsDue`.
3. Logs a warning for each due or overdue schedule, including days/miles overdue.

This provides passive monitoring without requiring external tooling. For alerting or automated action, integrate with the `/api/maintenance-schedules/due` endpoint from a notification service.

---

## Architecture Summary

```
POST /api/inspections
    → InspectionService.CreateAsync
        → InspectionWorkOrderPolicy.ShouldCreateWorkOrder (status == Failed?)
            → YES: WorkOrderService.CreateAsync → work order created
            → stores GeneratedWorkOrderId on inspection

GET /api/maintenance-schedules/due
    → MaintenanceScheduleService.GetDueForServiceAsync
        → per schedule: MaintenanceDueCalculator.IsDue
        → groups results by vehicle/asset

[every hour]
    → MaintenanceDueCheckerService
        → MaintenanceDueCalculator.IsDue
        → logs warnings for due/overdue schedules
```
