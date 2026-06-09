import type { WorkOrderResponse, WorkOrderStatus } from '@/types'

export function createTestWorkOrder(
  overrides: Partial<WorkOrderResponse> = {},
): WorkOrderResponse {
  return {
    id: 'wo-1',
    title: 'Brake inspection',
    description: 'Inspect front brakes',
    status: 'Open',
    priority: 'Medium',
    vehicleId: 'vehicle-1',
    vehicleDescription: '2022 Ford Transit',
    assetId: null,
    assetDescription: null,
    assignedUserId: 'user-1',
    assignedUserName: 'Admin User',
    laborHours: 0,
    completedAt: null,
    noteCount: 0,
    allowedNextStatuses: ['InProgress', 'Cancelled'],
    hasMaintenanceRecord: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createWorkOrderWithTransitions(
  status: WorkOrderStatus,
  allowedNextStatuses: WorkOrderStatus[],
): WorkOrderResponse {
  return createTestWorkOrder({ status, allowedNextStatuses })
}
