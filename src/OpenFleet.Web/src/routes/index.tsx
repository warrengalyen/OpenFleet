import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'

// Public pages
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'

// Dashboard
import { DashboardPage } from '@/features/dashboard/DashboardPage'

// Feature pages
import { VehiclesPage } from '@/features/vehicles/VehiclesPage'
import { AssetsPage } from '@/features/assets/AssetsPage'
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
      { path: 'assets', element: <AssetsPage /> },
      { path: 'work-orders', element: <WorkOrdersPage /> },
      { path: 'inspections', element: <InspectionsPage /> },
      { path: 'maintenance', element: <MaintenancePage /> },
      { path: 'parts', element: <PartsPage /> },
      { path: 'vendors', element: <VendorsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/audit', element: <AuditPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
