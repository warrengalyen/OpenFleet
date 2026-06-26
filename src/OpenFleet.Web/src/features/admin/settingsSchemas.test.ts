import { describe, expect, it } from 'vitest'
import { settingsFormSchema } from '@/features/admin/schemas'

describe('settingsFormSchema', () => {
  it('accepts valid settings values', () => {
    const result = settingsFormSchema.safeParse({
      organizationName: 'Acme Fleet',
      defaultWorkOrderPriority: 'Medium',
      defaultWorkOrderDueDays: 7,
      autoCreateWorkOrderOnFailedInspection: true,
      maintenanceReminderLeadDays: 14,
      lowPartsStockThreshold: 25,
      integrationRetryLimit: 3,
      auditLogRetentionDays: 365,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty organization name', () => {
    const result = settingsFormSchema.safeParse({
      organizationName: '',
      defaultWorkOrderPriority: 'Medium',
      defaultWorkOrderDueDays: 7,
      autoCreateWorkOrderOnFailedInspection: true,
      maintenanceReminderLeadDays: 0,
      lowPartsStockThreshold: 25,
      integrationRetryLimit: 3,
      auditLogRetentionDays: 365,
    })
    expect(result.success).toBe(false)
  })

  it('accepts numeric API priority values', () => {
    const result = settingsFormSchema.safeParse({
      organizationName: 'OpenFleet',
      defaultWorkOrderPriority: 1,
      defaultWorkOrderDueDays: '7',
      autoCreateWorkOrderOnFailedInspection: true,
      maintenanceReminderLeadDays: '7',
      lowPartsStockThreshold: '25',
      integrationRetryLimit: '3',
      auditLogRetentionDays: '365',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.defaultWorkOrderPriority).toBe('Medium')
      expect(result.data.defaultWorkOrderDueDays).toBe(7)
    }
  })
})
