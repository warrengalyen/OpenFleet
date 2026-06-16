import { api } from '@/lib/api'
import {
  normalizeVehicleStatus,
  normalizeWorkOrderPriority,
  normalizeWorkOrderStatus,
} from '@/lib/enums'
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

function normalizeOpenWorkOrdersReport(report: OpenWorkOrdersReport): OpenWorkOrdersReport {
  return {
    ...report,
    items: report.items.map((item) => ({
      ...item,
      status: normalizeWorkOrderStatus(item.status),
      priority: normalizeWorkOrderPriority(item.priority),
    })),
  }
}

function normalizeVehicleDowntimeReport(report: VehicleDowntimeReport): VehicleDowntimeReport {
  return {
    ...report,
    vehicles: report.vehicles.map((vehicle) => ({
      ...vehicle,
      status: normalizeVehicleStatus(vehicle.status),
    })),
  }
}

export const reportsService = {
  openWorkOrders: () =>
    api
      .get<OpenWorkOrdersReport>('/reports/open-work-orders')
      .then((r) => normalizeOpenWorkOrdersReport(r.data)),

  vehiclesDue: () =>
    api.get<VehiclesDueForServiceReport>('/reports/vehicles-due').then((r) => r.data),

  maintenanceCost: () =>
    api.get<MaintenanceCostReport>('/reports/maintenance-cost').then((r) => r.data),

  partsUsage: () =>
    api.get<PartUsageReport>('/reports/parts-usage').then((r) => r.data),

  vehicleDowntime: () =>
    api
      .get<VehicleDowntimeReport>('/reports/vehicle-downtime')
      .then((r) => normalizeVehicleDowntimeReport(r.data)),

  inspectionFailureRate: () =>
    api.get<InspectionFailureRateReport>('/reports/inspection-failure-rate').then((r) => r.data),

  workOrdersByStatus: () =>
    api.get<WorkOrdersByStatusReport>('/reports/work-orders-by-status').then((r) => r.data),

  workOrdersByPriority: () =>
    api.get<WorkOrdersByPriorityReport>('/reports/work-orders-by-priority').then((r) => r.data),
}
