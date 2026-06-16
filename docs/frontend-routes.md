# Frontend Routes

All authenticated routes render inside `AppLayout` (sidebar + header). Public routes render standalone.

Base URL in development: `http://localhost:5173`

---

## Public Routes

| Path | Page | Description |
|------|------|-------------|
| `/login` | LoginPage | Email/password sign-in |
| `/unauthorized` | UnauthorizedPage | Shown when role policy denies access |
| `*` | NotFoundPage | 404 for unknown paths |

---

## Dashboard

| Path | Page | Policy |
|------|------|--------|
| `/` | Redirect → `/dashboard` | Any authenticated |
| `/dashboard` | DashboardPage | Any authenticated |

---

## Fleet

| Path | Page | Policy |
|------|------|--------|
| `/vehicles` | VehiclesPage | Any authenticated |
| `/vehicles/new` | VehicleCreatePage | Technician+ |
| `/vehicles/:id` | VehicleDetailPage | Any authenticated |
| `/vehicles/:id/edit` | VehicleEditPage | Technician+ |
| `/assets` | AssetsPage | Any authenticated |
| `/assets/new` | AssetCreatePage | Any authenticated |
| `/assets/:id` | AssetDetailPage | Any authenticated |
| `/assets/:id/edit` | AssetEditPage | Technician+ |

---

## Maintenance Operations

| Path | Page | Policy |
|------|------|--------|
| `/work-orders` | WorkOrdersPage | Any authenticated |
| `/work-orders/new` | WorkOrderCreatePage | Technician+ |
| `/work-orders/:id` | WorkOrderDetailPage | Any authenticated |
| `/work-orders/:id/edit` | WorkOrderEditPage | Technician+ |
| `/inspections` | InspectionsPage | Any authenticated |
| `/inspections/new` | InspectionCreatePage | Technician+ |
| `/inspections/:id` | InspectionDetailPage | Any authenticated |
| `/inspections/:id/edit` | InspectionEditPage | Technician+ |
| `/maintenance` | MaintenancePage | Any authenticated |
| `/maintenance/schedules/new` | MaintenanceScheduleCreatePage | FleetManager+ |
| `/maintenance/schedules/:id/edit` | MaintenanceScheduleEditPage | FleetManager+ |

---

## Inventory & Vendors

| Path | Page | Policy |
|------|------|--------|
| `/parts` | PartsPage | Any authenticated |
| `/parts/new` | PartCreatePage | FleetManager+ |
| `/parts/:id` | PartDetailPage | Any authenticated |
| `/parts/:id/edit` | PartEditPage | FleetManager+ |
| `/vendors` | VendorsPage | Any authenticated |
| `/vendors/new` | VendorCreatePage | FleetManager+ |
| `/vendors/:id` | VendorDetailPage | Any authenticated |
| `/vendors/:id/edit` | VendorEditPage | FleetManager+ |

---

## Integrations & Reports

| Path | Page | Policy |
|------|------|--------|
| `/integrations` | IntegrationsPage | Any authenticated |
| `/integrations/:id` | IntegrationDetailPage | Any authenticated |
| `/reports` | ReportsIndexPage | Any authenticated |
| `/reports/:slug` | ReportDetailPage | Any authenticated |

### Report slugs

| Slug | Title |
|------|-------|
| `maintenance-cost` | Maintenance Cost by Vehicle |
| `vehicle-downtime` | Vehicle Downtime |
| `parts-usage` | Parts Usage & Inventory |
| `inspection-failure-rate` | Inspection Failure Rate |
| `work-orders-by-status` | Work Orders by Status |
| `work-orders-by-priority` | Work Orders by Priority |
| `vehicles-due` | Vehicles Due for Service |

---

## Administration

| Path | Page | Policy |
|------|------|--------|
| `/admin` | AdminIndexPage | FleetManager+ |
| `/admin/users` | UsersPage | Administrator |
| `/admin/users/new` | UserCreatePage | Administrator |
| `/admin/users/:id` | UserDetailPage | Administrator |
| `/admin/users/:id/edit` | UserEditPage | Administrator |
| `/admin/roles` | RolesPage | Administrator |
| `/admin/departments` | DepartmentsPage | Administrator |
| `/admin/departments/new` | DepartmentCreatePage | Administrator |
| `/admin/departments/:id` | DepartmentDetailPage | Administrator |
| `/admin/departments/:id/edit` | DepartmentEditPage | Administrator |
| `/admin/settings` | SettingsPage | Administrator |
| `/admin/audit` | AuditPage | FleetManager+ |
| `/admin/audit/:id` | AuditDetailPage | FleetManager+ |

---

## Role Policy Reference

Policies are defined in `lib/auth.ts` and align with backend `AuthorizationPolicies`:

| Policy | Roles |
|--------|-------|
| Any authenticated | Viewer, Technician, Supervisor, FleetManager, Administrator |
| Technician+ | Technician, Supervisor, FleetManager, Administrator |
| FleetManager+ | FleetManager, Administrator |
| Administrator | Administrator |

**Viewer** users can browse fleet data and reports but cannot create or edit records on protected routes.

---

## Navigation Map

Sidebar entries (filtered by role):

```
Dashboard
Vehicles
Assets
Work Orders
Inspections
Maintenance
Parts
Vendors
Integrations
Reports
Administration ▾
  ├── Overview      (/admin)          — FleetManager+
  ├── Users         (/admin/users)    — Administrator
  ├── Roles         (/admin/roles)    — Administrator
  ├── Departments   (/admin/departments) — Administrator
  ├── Settings      (/admin/settings) — Administrator
  └── Audit Logs    (/admin/audit)    — FleetManager+
```

---

## Query Parameters

Several list pages support URL-driven filters:

| Page | Parameters |
|------|------------|
| Vehicles | `search`, `status`, `departmentId`, `make`, `page` |
| Work Orders | `status`, `priority`, `vehicleId`, `page` |
| Inspections | `status`, `vehicleId`, `page` |
| Parts | `search`, `lowStock`, `page` |
| Audit | `action`, `entityType`, `from`, `to`, `page` |

Report detail pages may include date filters when `supportsDateFilter` is true for that report.

---

## Route Definition Location

All routes are declared in `src/OpenFleet.Web/src/routes/index.tsx`.
