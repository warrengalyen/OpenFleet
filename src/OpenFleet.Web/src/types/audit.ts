export type AuditAction =
  | 'VehicleUpdated'
  | 'WorkOrderStatusChanged'
  | 'InspectionFailed'
  | 'IntegrationSyncFailed'
  | 'UserCreated'
  | 'UserUpdated'
  | 'UserDeactivated'
  | 'PartCreated'
  | 'PartUpdated'
  | 'PartDeleted'
  | 'VendorCreated'
  | 'VendorUpdated'
  | 'VendorDeleted'

export interface AuditLogResponse {
  id: string
  action: AuditAction
  entityType: string
  entityId: string | null
  changedBy: string | null
  oldValue: string | null
  newValue: string | null
  notes: string | null
  createdAt: string
}

export interface AuditHistoryFilter {
  action?: AuditAction
  entityId?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
