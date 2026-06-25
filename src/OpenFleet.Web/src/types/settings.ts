import type { WorkOrderPriority } from '@/types/workOrder'

export interface ApplicationSettingsResponse {
  organizationName: string
  defaultWorkOrderPriority: WorkOrderPriority
  defaultWorkOrderDueDays: number
  autoCreateWorkOrderOnFailedInspection: boolean
  maintenanceReminderLeadDays: number
  lowPartsStockThreshold: number
  integrationRetryLimit: number
  auditLogRetentionDays: number
  updatedAt: string
}

export interface UpdateApplicationSettingsRequest {
  organizationName: string
  defaultWorkOrderPriority: WorkOrderPriority
  defaultWorkOrderDueDays: number
  autoCreateWorkOrderOnFailedInspection: boolean
  maintenanceReminderLeadDays: number
  lowPartsStockThreshold: number
  integrationRetryLimit: number
  auditLogRetentionDays: number
}
