import type { AuditAction } from '@/types/audit'
import type { InspectionStatus } from '@/types/inspection'
import type { UserRole } from '@/types/auth'
import type { VehicleStatus } from '@/types/vehicle'
import type { WorkOrderPriority, WorkOrderStatus } from '@/types/workOrder'

interface EnumMap<T extends string> {
  values: readonly T[]
  byIndex: Record<number, T>
  fallback: T
}

function normalizeEnum<T extends string>(value: unknown, map: EnumMap<T>): T {
  if (typeof value === 'string' && map.values.includes(value as T)) return value as T
  if (typeof value === 'number' && value in map.byIndex) return map.byIndex[value]
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed) && parsed in map.byIndex) return map.byIndex[parsed]
  }
  return map.fallback
}

const USER_ROLE_MAP: EnumMap<UserRole> = {
  values: ['Viewer', 'Technician', 'Supervisor', 'FleetManager', 'Administrator'],
  byIndex: {
    0: 'Viewer',
    1: 'Technician',
    2: 'Supervisor',
    3: 'FleetManager',
    4: 'Administrator',
  },
  fallback: 'Viewer',
}

const WORK_ORDER_STATUS_MAP: EnumMap<WorkOrderStatus> = {
  values: ['Open', 'InProgress', 'WaitingForParts', 'Completed', 'Cancelled'],
  byIndex: {
    0: 'Open',
    1: 'InProgress',
    2: 'WaitingForParts',
    3: 'Completed',
    4: 'Cancelled',
  },
  fallback: 'Open',
}

const WORK_ORDER_PRIORITY_MAP: EnumMap<WorkOrderPriority> = {
  values: ['Low', 'Medium', 'High', 'Critical'],
  byIndex: { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical' },
  fallback: 'Medium',
}

const VEHICLE_STATUS_MAP: EnumMap<VehicleStatus> = {
  values: ['Active', 'InMaintenance', 'OutOfService', 'Retired'],
  byIndex: {
    0: 'Active',
    1: 'InMaintenance',
    2: 'OutOfService',
    3: 'Retired',
  },
  fallback: 'Active',
}

const INSPECTION_STATUS_MAP: EnumMap<InspectionStatus> = {
  values: ['Passed', 'Failed', 'NeedsReview'],
  byIndex: { 0: 'Passed', 1: 'Failed', 2: 'NeedsReview' },
  fallback: 'Passed',
}

const AUDIT_ACTION_MAP: EnumMap<AuditAction> = {
  values: [
    'VehicleUpdated',
    'WorkOrderStatusChanged',
    'InspectionFailed',
    'IntegrationSyncFailed',
    'UserCreated',
    'UserUpdated',
    'UserDeactivated',
    'PartCreated',
    'PartUpdated',
    'PartDeleted',
    'VendorCreated',
    'VendorUpdated',
    'VendorDeleted',
  ],
  byIndex: {
    0: 'VehicleUpdated',
    1: 'WorkOrderStatusChanged',
    2: 'InspectionFailed',
    3: 'IntegrationSyncFailed',
    4: 'UserCreated',
    5: 'UserUpdated',
    6: 'UserDeactivated',
    7: 'PartCreated',
    8: 'PartUpdated',
    9: 'PartDeleted',
    10: 'VendorCreated',
    11: 'VendorUpdated',
    12: 'VendorDeleted',
  },
  fallback: 'VehicleUpdated',
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLE_MAP.values.includes(value as UserRole)
}

export function normalizeUserRole(role: unknown): UserRole {
  return normalizeEnum(role, USER_ROLE_MAP)
}

export function normalizeWorkOrderStatus(status: unknown): WorkOrderStatus {
  return normalizeEnum(status, WORK_ORDER_STATUS_MAP)
}

export function normalizeWorkOrderPriority(priority: unknown): WorkOrderPriority {
  return normalizeEnum(priority, WORK_ORDER_PRIORITY_MAP)
}

export function normalizeVehicleStatus(status: unknown): VehicleStatus {
  return normalizeEnum(status, VEHICLE_STATUS_MAP)
}

export function normalizeInspectionStatus(status: unknown): InspectionStatus {
  return normalizeEnum(status, INSPECTION_STATUS_MAP)
}

export function normalizeAuditAction(action: unknown): AuditAction {
  return normalizeEnum(action, AUDIT_ACTION_MAP)
}
