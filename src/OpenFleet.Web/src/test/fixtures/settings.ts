import type { ApplicationSettingsResponse } from '@/types/settings'

export function createTestSettings(
  overrides: Partial<ApplicationSettingsResponse> = {},
): ApplicationSettingsResponse {
  return {
    organizationName: 'OpenFleet',
    defaultWorkOrderPriority: 'Medium',
    defaultWorkOrderDueDays: 7,
    autoCreateWorkOrderOnFailedInspection: true,
    maintenanceReminderLeadDays: 7,
    lowPartsStockThreshold: 25,
    integrationRetryLimit: 3,
    auditLogRetentionDays: 365,
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
