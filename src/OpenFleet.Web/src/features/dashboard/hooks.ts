import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '@/services/reports.service'
import { integrationsService } from '@/services/integrations.service'
import { DASHBOARD_STALE_TIME } from './constants'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  workOrdersByStatus: ['reports', 'work-orders-by-status'] as const,
  workOrdersByPriority: ['reports', 'work-orders-by-priority'] as const,
  openWorkOrders: ['reports', 'open-work-orders'] as const,
  vehiclesDue: ['reports', 'vehicles-due'] as const,
  inspectionFailureRate: ['reports', 'inspection-failure-rate'] as const,
  partsUsage: ['reports', 'parts-usage'] as const,
  integrationFailures: ['integrations', 'failures'] as const,
}

const queryDefaults = {
  staleTime: DASHBOARD_STALE_TIME,
}

export function useWorkOrdersByStatus() {
  return useQuery({
    queryKey: dashboardKeys.workOrdersByStatus,
    queryFn: reportsService.workOrdersByStatus,
    ...queryDefaults,
  })
}

export function useWorkOrdersByPriority() {
  return useQuery({
    queryKey: dashboardKeys.workOrdersByPriority,
    queryFn: reportsService.workOrdersByPriority,
    ...queryDefaults,
  })
}

export function useOpenWorkOrders() {
  return useQuery({
    queryKey: dashboardKeys.openWorkOrders,
    queryFn: reportsService.openWorkOrders,
    ...queryDefaults,
  })
}

export function useVehiclesDue() {
  return useQuery({
    queryKey: dashboardKeys.vehiclesDue,
    queryFn: reportsService.vehiclesDue,
    ...queryDefaults,
  })
}

export function useInspectionFailureRate() {
  return useQuery({
    queryKey: dashboardKeys.inspectionFailureRate,
    queryFn: reportsService.inspectionFailureRate,
    ...queryDefaults,
  })
}

export function usePartsUsage() {
  return useQuery({
    queryKey: dashboardKeys.partsUsage,
    queryFn: reportsService.partsUsage,
    ...queryDefaults,
  })
}

export function useIntegrationFailures() {
  return useQuery({
    queryKey: dashboardKeys.integrationFailures,
    queryFn: () =>
      integrationsService.getHistory({ status: 'Failed', page: 1, pageSize: 5 }),
    ...queryDefaults,
  })
}

export function useDashboardRefresh() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    await queryClient.invalidateQueries({ queryKey: ['reports'] })
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.integrationFailures })
  }
}
