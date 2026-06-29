# Frontend Architecture

OpenFleet.Web is a single-page application (SPA) that provides a fleet operations console on top of the OpenFleet REST API. It is structured for maintainability, type safety, and role-based access control that mirrors the backend authorization policies.

---

## Stack

| Concern | Technology |
|---------|------------|
| UI | React 18, TypeScript |
| Build | Vite 6 |
| Routing | React Router 6 (`createBrowserRouter`) |
| Server state | TanStack Query v5 |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 3, `clsx` |
| Icons | Lucide React |
| Unit / component tests | Vitest, Testing Library, MSW |
| E2E tests | Playwright |

---

## Directory Layout

```
src/OpenFleet.Web/
├── e2e/                    # Playwright end-to-end specs
├── public/                 # Static assets (favicon)
├── src/
│   ├── app/                # App shell, providers, router entry
│   ├── components/         # Shared UI (layout, tables, forms, feedback)
│   ├── context/            # React context (auth, dark mode)
│   ├── features/           # Feature modules (dashboard, vehicles, admin, …)
│   ├── hooks/              # Shared hooks (auth, departments, document title)
│   ├── lib/                # API client, auth policies, formatters, enums
│   ├── routes/             # Route definitions and guards
│   ├── services/           # API service layer (one file per domain)
│   ├── test/               # Test utilities, MSW handlers
│   └── types/              # Shared TypeScript types
├── index.html
├── vite.config.ts
└── package.json
```

---

## Layering

```
┌─────────────────────────────────────────────────────────┐
│  Pages (features/*/…Page.tsx)                           │
│  Compose layout, filters, tables, forms                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Feature hooks (features/*/hooks.ts)                    │
│  TanStack Query keys, mutations, cache invalidation     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Services (services/*.service.ts)                       │
│  HTTP calls, response normalization                     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  API client (lib/api.ts)                                │
│  Axios instance, JWT interceptors, error helpers          │
└─────────────────────────────────────────────────────────┘
```

**Rules:**

- Pages do not call Axios directly; they use feature hooks or services.
- Shared presentation lives in `components/`; domain logic stays in `features/`.
- Types mirror backend DTOs in `types/` and are imported by services and pages.

---

## Feature Module Pattern

Each domain (vehicles, work orders, admin, etc.) follows a consistent shape:

| File | Responsibility |
|------|----------------|
| `*Page.tsx` | List or landing view |
| `*DetailPage.tsx` | Read-only detail |
| `*CreatePage.tsx` / `*EditPage.tsx` | Forms |
| `hooks.ts` | `useQuery` / `useMutation` wrappers |
| `schemas.ts` | Zod validation (where forms exist) |
| `constants.ts` | Labels, slugs, static config (optional) |

Administration and reports use the same pattern under `features/admin/` and `features/reports/`.

---

## Application Shell

```
Providers (QueryClient, Auth, DarkMode, Toast, ErrorBoundary)
    └── RouterProvider
            ├── /login          → LoginPage (public)
            ├── /unauthorized   → UnauthorizedPage
            └── AppLayout       → ProtectedRoute
                    ├── Sidebar (role-filtered nav)
                    ├── Header  (user menu, theme toggle)
                    └── <Outlet />  (feature pages)
```

`ProtectedRoute` redirects unauthenticated users to `/login`. `RoleProtectedRoute` wraps individual routes and sends under-privileged users to `/unauthorized`.

---

## Authentication & Authorization

| Piece | Location |
|-------|----------|
| JWT storage | `localStorage` via `tokenStorage` in `lib/api.ts` |
| Current user | `AuthContext` + `useAuth` hook |
| Role policies | `lib/auth.ts` - mirrors `AuthorizationPolicies` on the API |
| Route guards | `routes/ProtectedRoute.tsx`, `routes/RoleProtectedRoute.tsx` |
| Nav visibility | `Sidebar.tsx` filters items with `hasPolicy()` |

The API serializes enums as integers by default. `lib/enums.ts` normalizes numeric values to string union types so labels, badges, and policy checks work consistently.

---

## Server State (TanStack Query)

- Default `staleTime`: 30 seconds
- Retries: up to 2 for transient errors; no retry on 401, 403, or 404
- Mutations do not retry
- Feature hooks define query keys (e.g. `['vehicles', filters]`) and invalidate related keys after mutations
- React Query Devtools enabled in development only

---

## Styling Conventions

- **Brand color**: `brand-*` Tailwind palette (primary actions, active nav)
- **Surfaces**: `rounded-xl` cards with `border-gray-200` / `dark:border-gray-800`
- **Page headers**: `PageTitle` component (title, subtitle, action slot)
- **Tables**: `DataTable` with sortable columns, skeleton loading, integrated empty state
- **Async panels**: `AsyncStatePanel` for loading / error / empty in dashboard widgets
- **Dark mode**: `DarkModeProvider` toggles `dark` class on `<html>`; preference persisted in `localStorage`

---

## Error Handling

| Layer | Behavior |
|-------|----------|
| Axios interceptor | Clears session and redirects to `/login` on 401 (except login) |
| `getApiErrorMessage()` | Extracts `detail` / `title` from ProblemDetails |
| `QueryErrorBanner` | Inline retry banner for list-page query failures |
| `AsyncStatePanel` | Panel-level error with retry button |
| `ErrorBoundary` | Catches render errors; offers full-page reload |
| Toasts | Success / info feedback after mutations (`Toaster`) |

---

## Build & Proxy

Vite dev server runs on port **5173** and proxies `/api` and `/health` to `VITE_API_BASE_URL` (default `http://localhost:8080`). The browser always calls same-origin `/api`, avoiding CORS configuration during local development.

Production builds emit static assets to `dist/` for hosting behind any static file server or reverse proxy that forwards `/api` to the backend.

---

## Related Documentation

- [Frontend Routes](frontend-routes.md) - full route map and access policies
- [Frontend API Client](frontend-api-client.md) - Axios setup and service conventions
- [Frontend Accessibility](frontend-accessibility.md) - a11y patterns and testing
- [Screenshots](screenshots.md) - UI capture guide and placeholders
