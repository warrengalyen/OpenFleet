import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleProtectedRoute } from './RoleProtectedRoute'
import { AuthPolicy } from '@/lib/auth'

// Public pages
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { UnauthorizedPage } from '@/features/errors/UnauthorizedPage'

// Dashboard
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// Feature pages
import { VehiclesPage } from '@/features/vehicles/VehiclesPage'
import { VehicleDetailPage } from '@/features/vehicles/VehicleDetailPage'
import { VehicleCreatePage } from '@/features/vehicles/VehicleCreatePage'
import { VehicleEditPage } from '@/features/vehicles/VehicleEditPage'
import { AssetsPage } from '@/features/assets/AssetsPage'
import { AssetDetailPage } from '@/features/assets/AssetDetailPage'
import { AssetCreatePage } from '@/features/assets/AssetCreatePage'
import { AssetEditPage } from '@/features/assets/AssetEditPage'
import { WorkOrdersPage } from '@/features/work-orders/WorkOrdersPage'
import { InspectionsPage } from '@/features/inspections/InspectionsPage'
import { MaintenancePage } from '@/features/maintenance/MaintenancePage'
import { PartsPage } from '@/features/parts/PartsPage'
import { VendorsPage } from '@/features/vendors/VendorsPage'
import { IntegrationsPage } from '@/features/integrations/IntegrationsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'

// Admin pages
import { UsersPage } from '@/features/admin/UsersPage'
import { AuditPage } from '@/features/admin/AuditPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: (
      <ProtectedRoute>
        <UnauthorizedPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'vehicles', element: <VehiclesPage /> },
      {
        path: 'vehicles/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <VehicleCreatePage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'vehicles/:id', element: <VehicleDetailPage /> },
      {
        path: 'vehicles/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <VehicleEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/new', element: <AssetCreatePage /> },
      { path: 'assets/:id', element: <AssetDetailPage /> },
      {
        path: 'assets/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <AssetEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'work-orders', element: <WorkOrdersPage /> },
      { path: 'inspections', element: <InspectionsPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'parts', element: <PartsPage /> },
      { path: 'vendors', element: <VendorsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      {
        path: 'admin/users',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.AdminOnly}>
            <UsersPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'admin/audit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <AuditPage />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
