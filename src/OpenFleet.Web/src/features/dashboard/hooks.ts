import { useQuery } from '@tanstack/react-query'
import { reportsService } from '@/services/reports.service'

export const dashboardKeys = {
  workOrdersByStatus: ['reports', 'work-orders-by-status'] as const,
  workOrdersByPriority: ['reports', 'work-orders-by-priority'] as const,
  openWorkOrders: ['reports', 'open-work-orders'] as const,
  vehiclesDue: ['reports', 'vehicles-due'] as const,
  inspectionFailureRate: ['reports', 'inspection-failure-rate'] as const,
  vehicleDowntime: ['reports', 'vehicle-downtime'] as const,
}

export function useWorkOrdersByStatus() {
  return useQuery({ queryKey: dashboardKeys.workOrdersByStatus, queryFn: reportsService.workOrdersByStatus })
}

export function useWorkOrdersByPriority() {
  return useQuery({ queryKey: dashboardKeys.workOrdersByPriority, queryFn: reportsService.workOrdersByPriority })
}

export function useOpenWorkOrders() {
  return useQuery({ queryKey: dashboardKeys.openWorkOrders, queryFn: reportsService.openWorkOrders })
}

export function useVehiclesDue() {
  return useQuery({ queryKey: dashboardKeys.vehiclesDue, queryFn: reportsService.vehiclesDue })
}

export function useInspectionFailureRate() {
  return useQuery({ queryKey: dashboardKeys.inspectionFailureRate, queryFn: reportsService.inspectionFailureRate })
}

export function useVehicleDowntime() {
  return useQuery({ queryKey: dashboardKeys.vehicleDowntime, queryFn: reportsService.vehicleDowntime })
}
