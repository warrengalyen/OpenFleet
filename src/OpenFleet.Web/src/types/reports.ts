import type { WorkOrderPriority, WorkOrderStatus } from './workOrder'
import type { VehicleStatus } from './vehicle'
import type { InspectionStatus } from './inspection'
import type { DueScheduleEntry, VehicleDueForServiceResponse } from './maintenance'

export type { DueScheduleEntry, VehicleDueForServiceResponse }

export interface WorkOrderSummaryItem {
  id: string
  title: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  vehicleLabel: string | null
  createdAt: string
}

export interface OpenWorkOrdersReport {
  totalOpen: number
  open: number
  inProgress: number
  waitingForParts: number
  items: WorkOrderSummaryItem[]
}

export interface VehiclesDueForServiceReport {
  totalDue: number
  vehicles: VehicleDueForServiceResponse[]
}

export interface MaintenanceCostByVehicle {
  vehicleId: string
  vehicleLabel: string
  totalLaborHours: number
  completedWorkOrders: number
}

export interface MaintenanceCostReport {
  vehicles: MaintenanceCostByVehicle[]
}

export interface PartUsageSummary {
  partId: string
  name: string
  partNumber: string
  vendorName: string | null
  quantityOnHand: number
  unitCost: number
  totalValue: number
}

export interface PartUsageReport {
  totalParts: number
  totalInventoryValue: number
  lowStockThreshold: number
  parts: PartUsageSummary[]
}

export interface VehicleDowntimeEntry {
  vehicleId: string
  vehicleLabel: string
  licensePlate: string
  status: VehicleStatus
  openWorkOrderCount: number
  lastMaintenanceAt: string | null
}

export interface VehicleDowntimeReport {
  vehiclesInMaintenance: number
  vehicles: VehicleDowntimeEntry[]
}

export interface InspectionFailureBySeverity {
  vehicleId: string | null
  vehicleLabel: string | null
  failedCount: number
}

export interface InspectionFailureRateReport {
  totalInspections: number
  passed: number
  failed: number
  needsReview: number
  failureRatePercent: number
  topFailedVehicles: InspectionFailureBySeverity[]
}

export interface WorkOrdersByStatusReport {
  open: number
  inProgress: number
  waitingForParts: number
  completed: number
  cancelled: number
  total: number
}

export interface WorkOrdersByPriorityReport {
  low: number
  medium: number
  high: number
  critical: number
  total: number
}

// Avoid unused import warnings
export type { InspectionStatus }
