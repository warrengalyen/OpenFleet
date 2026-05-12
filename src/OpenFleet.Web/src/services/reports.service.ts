import { api } from '@/lib/api'
import type {
  InspectionFailureRateReport,
  MaintenanceCostReport,
  OpenWorkOrdersReport,
  PartUsageReport,
  VehicleDowntimeReport,
  VehiclesDueForServiceReport,
  WorkOrdersByPriorityReport,
  WorkOrdersByStatusReport,
} from '@/types'

export const reportsService = {
  openWorkOrders: () =>
    api.get<OpenWorkOrdersReport>('/reports/open-work-orders').then((r) => r.data),

  vehiclesDue: () =>
    api.get<VehiclesDueForServiceReport>('/reports/vehicles-due').then((r) => r.data),

  maintenanceCost: () =>
    api.get<MaintenanceCostReport>('/reports/maintenance-cost').then((r) => r.data),

  partsUsage: () =>
    api.get<PartUsageReport>('/reports/parts-usage').then((r) => r.data),

  vehicleDowntime: () =>
    api.get<VehicleDowntimeReport>('/reports/vehicle-downtime').then((r) => r.data),

  inspectionFailureRate: () =>
    api.get<InspectionFailureRateReport>('/reports/inspection-failure-rate').then((r) => r.data),

  workOrdersByStatus: () =>
    api.get<WorkOrdersByStatusReport>('/reports/work-orders-by-status').then((r) => r.data),

  workOrdersByPriority: () =>
    api.get<WorkOrdersByPriorityReport>('/reports/work-orders-by-priority').then((r) => r.data),
}
