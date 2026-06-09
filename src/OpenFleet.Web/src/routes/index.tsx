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
import { WorkOrderDetailPage } from '@/features/work-orders/WorkOrderDetailPage'
import { WorkOrderCreatePage } from '@/features/work-orders/WorkOrderCreatePage'
import { WorkOrderEditPage } from '@/features/work-orders/WorkOrderEditPage'
import { InspectionsPage } from '@/features/inspections/InspectionsPage'
import { InspectionDetailPage } from '@/features/inspections/InspectionDetailPage'
import { InspectionCreatePage } from '@/features/inspections/InspectionCreatePage'
import { InspectionEditPage } from '@/features/inspections/InspectionEditPage'
import { MaintenancePage } from '@/features/maintenance/MaintenancePage'
import { MaintenanceScheduleCreatePage } from '@/features/maintenance/MaintenanceScheduleCreatePage'
import { MaintenanceScheduleEditPage } from '@/features/maintenance/MaintenanceScheduleEditPage'
import { PartsPage } from '@/features/parts/PartsPage'
import { PartDetailPage } from '@/features/parts/PartDetailPage'
import { PartCreatePage } from '@/features/parts/PartCreatePage'
import { PartEditPage } from '@/features/parts/PartEditPage'
import { VendorsPage } from '@/features/vendors/VendorsPage'
import { VendorDetailPage } from '@/features/vendors/VendorDetailPage'
import { VendorCreatePage } from '@/features/vendors/VendorCreatePage'
import { VendorEditPage } from '@/features/vendors/VendorEditPage'
import { IntegrationsPage } from '@/features/integrations/IntegrationsPage'
import { IntegrationDetailPage } from '@/features/integrations/IntegrationDetailPage'
import { ReportsIndexPage } from '@/features/reports/ReportsIndexPage'
import { ReportDetailPage } from '@/features/reports/ReportDetailPage'

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
      {
        path: 'work-orders/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <WorkOrderCreatePage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'work-orders/:id', element: <WorkOrderDetailPage /> },
      {
        path: 'work-orders/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <WorkOrderEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'inspections', element: <InspectionsPage /> },
      {
        path: 'inspections/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <InspectionCreatePage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'inspections/:id', element: <InspectionDetailPage /> },
      {
        path: 'inspections/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.TechnicianOrAbove}>
            <InspectionEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'maintenance', element: <MaintenancePage /> },
      {
        path: 'maintenance/schedules/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <MaintenanceScheduleCreatePage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'maintenance/schedules/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <MaintenanceScheduleEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'parts', element: <PartsPage /> },
      {
        path: 'parts/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <PartCreatePage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'parts/:id', element: <PartDetailPage /> },
      {
        path: 'parts/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <PartEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'vendors', element: <VendorsPage /> },
      {
        path: 'vendors/new',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <VendorCreatePage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'vendors/:id', element: <VendorDetailPage /> },
      {
        path: 'vendors/:id/edit',
        element: (
          <RoleProtectedRoute policy={AuthPolicy.FleetManagerOrAbove}>
            <VendorEditPage />
          </RoleProtectedRoute>
        ),
      },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'integrations/:id', element: <IntegrationDetailPage /> },
      { path: 'reports', element: <ReportsIndexPage /> },
      { path: 'reports/:slug', element: <ReportDetailPage /> },
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
