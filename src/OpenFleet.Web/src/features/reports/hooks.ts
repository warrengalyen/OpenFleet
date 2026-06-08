import { useQuery } from '@tanstack/react-query'
import { reportsService } from '@/services/reports.service'

export const reportKeys = {
  all: ['reports'] as const,
  maintenanceCost: () => [...reportKeys.all, 'maintenance-cost'] as const,
  vehicleDowntime: () => [...reportKeys.all, 'vehicle-downtime'] as const,
  partsUsage: () => [...reportKeys.all, 'parts-usage'] as const,
  inspectionFailureRate: () => [...reportKeys.all, 'inspection-failure-rate'] as const,
  workOrdersByStatus: () => [...reportKeys.all, 'work-orders-by-status'] as const,
  workOrdersByPriority: () => [...reportKeys.all, 'work-orders-by-priority'] as const,
  vehiclesDue: () => [...reportKeys.all, 'vehicles-due'] as const,
}

const queryDefaults = { staleTime: 60_000 }

export function useMaintenanceCostReport() {
  return useQuery({
    queryKey: reportKeys.maintenanceCost(),
    queryFn: reportsService.maintenanceCost,
    ...queryDefaults,
  })
}

export function useVehicleDowntimeReport() {
  return useQuery({
    queryKey: reportKeys.vehicleDowntime(),
    queryFn: reportsService.vehicleDowntime,
    ...queryDefaults,
  })
}

export function usePartsUsageReport() {
  return useQuery({
    queryKey: reportKeys.partsUsage(),
    queryFn: reportsService.partsUsage,
    ...queryDefaults,
  })
}

export function useInspectionFailureRateReport() {
  return useQuery({
    queryKey: reportKeys.inspectionFailureRate(),
    queryFn: reportsService.inspectionFailureRate,
    ...queryDefaults,
  })
}

export function useWorkOrdersByStatusReport() {
  return useQuery({
    queryKey: reportKeys.workOrdersByStatus(),
    queryFn: reportsService.workOrdersByStatus,
    ...queryDefaults,
  })
}

export function useWorkOrdersByPriorityReport() {
  return useQuery({
    queryKey: reportKeys.workOrdersByPriority(),
    queryFn: reportsService.workOrdersByPriority,
    ...queryDefaults,
  })
}

export function useVehiclesDueReport() {
  return useQuery({
    queryKey: reportKeys.vehiclesDue(),
    queryFn: reportsService.vehiclesDue,
    ...queryDefaults,
  })
}
