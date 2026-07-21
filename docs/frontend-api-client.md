# Frontend API Client

OpenFleet.Web communicates with the backend exclusively through a shared Axios instance and typed service modules.

---

## Axios Instance

**File:** `src/lib/api.ts`

```typescript
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})
```

In development, Vite proxies `/api` to the backend (`VITE_API_BASE_URL`, default `http://localhost:8080`). In production, configure your reverse proxy to forward `/api` to the API host.

---

## Authentication Flow

### Login

1. `POST /api/auth/login` with `{ email, password }`
2. Response includes `token`, `expiresAt`, and user profile fields
3. `tokenStorage.set(token, expiresAt)` persists to `localStorage`

### Authenticated requests

The request interceptor attaches:

```
Authorization: Bearer <token>
```

If the stored token is locally expired, the session is cleared and the browser redirects to `/login` before the request is sent.

### Session expiry / 401

The response interceptor clears the session and redirects to `/login` on HTTP 401, except for failed login attempts (so invalid credentials show an inline error).

### Current user

`GET /api/auth/me` is called on app load when a valid token exists. The result is stored in `AuthContext`.

### Update profile

`authService.updateProfile(request)` calls `PUT /api/auth/profile` with optional `firstName`, `lastName`, `currentPassword`, and `newPassword`. On success, the Profile page updates the `['auth','me']` cache so the header display name refreshes.

When `isDemoUser` is `true` on the current-user response, the Profile page disables name and password fields and shows an informational message. The backend still rejects restricted updates with **403** ProblemDetails; the Axios interceptor does **not** log the user out on 403 (only on 401).

---

## Token Storage

| Key | Purpose |
|-----|---------|
| `openfleet_token` | JWT string |
| `openfleet_token_expires` | ISO expiry timestamp |

`tokenStorage.isValid()` checks presence and expiry. `getTokenExpiry()` can decode the JWT `exp` claim as a fallback.

---

## Error Handling

### ProblemDetails

The API returns [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) Problem Details for errors:

```json
{
  "type": "https://httpstatuses.io/400",
  "title": "Domain Error",
  "status": 400,
  "detail": "Cannot transition from Completed to Open.",
  "correlationId": "908dcc06-a181-471c-8321-1977866db5cd"
}
```

Use `getApiErrorMessage(error)` to extract a user-facing string. Priority: `detail` → `message` → `title` → `error` → generic fallback.

### Blob downloads (PDF export)

Work order and vehicle maintenance history PDFs use `responseType: 'blob'`:

- `workOrdersService.downloadPdf(id)` → `GET /workorders/{id}/pdf`
- `vehiclesService.downloadMaintenanceHistoryPdf(id)` → `GET /vehicles/{id}/maintenance-history/pdf`

Shared helpers live in `src/lib/download.ts`:

| Helper | Purpose |
|--------|---------|
| `downloadBlobResponse` | Parse `Content-Disposition` (including `filename*=UTF-8''...`), trigger download, revoke object URL in `finally` |
| `getProblemDetailsFromBlob` | Parse RFC 7807 ProblemDetails from blob or JSON error bodies |
| `getBlobApiErrorMessage` | User-facing message for blob download failures |

When the API and SPA are on different origins, the API must expose `Content-Disposition` via CORS so the filename is visible to JavaScript.

### Real-time notifications (SignalR)

Authenticated sessions connect to `/hubs/notifications` via `@microsoft/signalr` (`lib/signalr.ts`, `hooks/useRealtimeNotifications.ts`).

- Token: `accessTokenFactory` reads `tokenStorage.get()`
- Local Vite proxies `/hubs` with `ws: true` when using a relative API origin
- Events: `WorkOrderStatusChanged` (info toast + work-order/dashboard invalidation), `MaintenanceOverdue` (warning toast + maintenance/vehicles-due invalidation)

### TanStack Query retry policy

Queries do not retry on 401, 403, or 404. Other errors retry up to twice.

---

## Service Layer

Each domain has a service file in `src/services/`:

| Service | Base path |
|---------|-----------|
| `auth.service.ts` | `/auth` |
| `users.service.ts` | `/users` |
| `vehicles.service.ts` | `/vehicles` |
| `assets.service.ts` | `/assets` |
| `workOrders.service.ts` | `/workorders` |
| `inspections.service.ts` | `/inspections` |
| `maintenanceSchedules.service.ts` | `/maintenance-schedules` |
| `parts.service.ts` | `/parts` |
| `vendors.service.ts` | `/vendors` |
| `departments.service.ts` | `/departments` - list, get, create, update, delete |
| `settings.service.ts` | `/settings` - get, update |
| `integrations.service.ts` | `/integrations` |
| `reports.service.ts` | `/reports` |
| `audit.service.ts` | `/audit` |

### Conventions

```typescript
// Typical list call
async list(filters?: FilterRequest): Promise<ItemResponse[]> {
  const { data } = await api.get<ItemResponse[]>('/vehicles', { params: filters })
  return data.map(normalizeItem)
}

// Typical mutation
async create(request: CreateRequest): Promise<ItemResponse> {
  const { data } = await api.post<ItemResponse>('/vehicles', request)
  return normalizeItem(data)
}
```

Services return typed DTOs. Enum fields are normalized in the service layer via `lib/enums.ts` because the API serializes enums as integers.

---

## Enum Normalization

**File:** `src/lib/enums.ts`

| Normalizer | Used for |
|------------|----------|
| `normalizeUserRole` | Auth, users, policy checks |
| `normalizeWorkOrderStatus` | Work orders, reports |
| `normalizeWorkOrderPriority` | Work orders, reports |
| `normalizeVehicleStatus` | Vehicles, downtime reports |
| `normalizeInspectionStatus` | Inspections |
| `normalizeAuditAction` | Audit logs |

Always normalize in services (not in components) so all consumers receive consistent string enum values.

---

## Feature Hooks

Feature hooks wrap services with TanStack Query:

```typescript
export function useVehicles(filters?: VehicleFilterRequest) {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehiclesService.list(filters),
  })
}
```

Mutations call `queryClient.invalidateQueries()` for affected keys after success.

---

## MSW (Tests)

Unit and component tests use Mock Service Worker handlers in `src/test/msw/handlers.ts`. The test render helper in `src/test/render.tsx` wraps components with `QueryClientProvider` and `MemoryRouter`.

E2E tests (Playwright) hit the real Vite dev server with MSW disabled; they require the API running or use mocked network at the test level.

---

## Health Checks

`GET /health`, `/health/live`, and `/health/ready` are proxied in development but not used by the SPA UI. They are available for deployment probes and manual verification.

---

## Adding a New Endpoint

1. Add or extend types in `src/types/`
2. Add service methods in `src/services/<domain>.service.ts`
3. Normalize enums in the service if the response includes enum fields
4. Create feature hooks with query keys and invalidation rules
5. Build the page using existing `DataTable`, `PageTitle`, and form patterns
6. Register the route in `src/routes/index.tsx`
7. Add MSW handlers for unit tests
