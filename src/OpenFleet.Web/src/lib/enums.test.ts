import { describe, expect, it } from 'vitest'
import {
  normalizeAssetCondition,
  normalizeAssetStatus,
  normalizeAuditAction,
  normalizeUserRole,
  normalizeWorkOrderPriority,
  normalizeWorkOrderStatus,
  serializeAssetCondition,
  serializeAssetStatus,
  serializeInspectionStatus,
  serializeUserRole,
  serializeVehicleStatus,
  serializeWorkOrderPriority,
  serializeWorkOrderStatus,
} from '@/lib/enums'


describe('normalizeAssetStatus', () => {
  it('maps numeric API values to status strings', () => {
    expect(normalizeAssetStatus(0)).toBe('Available')
    expect(normalizeAssetStatus(1)).toBe('InUse')
    expect(normalizeAssetStatus(2)).toBe('UnderMaintenance')
    expect(normalizeAssetStatus(3)).toBe('Decommissioned')
  })

  it('passes through string values', () => {
    expect(normalizeAssetStatus('InUse')).toBe('InUse')
  })
})

describe('normalizeAssetCondition', () => {
  it('maps numeric API values to condition strings', () => {
    expect(normalizeAssetCondition(0)).toBe('New')
    expect(normalizeAssetCondition(1)).toBe('Good')
    expect(normalizeAssetCondition(4)).toBe('Damaged')
  })

  it('passes through string values', () => {
    expect(normalizeAssetCondition('Fair')).toBe('Fair')
  })
})

describe('normalizeWorkOrderStatus', () => {
  it('maps numeric API values to status strings', () => {
    expect(normalizeWorkOrderStatus(0)).toBe('Open')
    expect(normalizeWorkOrderStatus(1)).toBe('InProgress')
    expect(normalizeWorkOrderStatus(2)).toBe('WaitingForParts')
  })

  it('passes through string values', () => {
    expect(normalizeWorkOrderStatus('Completed')).toBe('Completed')
  })
})

describe('normalizeWorkOrderPriority', () => {
  it('maps numeric API values to priority strings', () => {
    expect(normalizeWorkOrderPriority(0)).toBe('Low')
    expect(normalizeWorkOrderPriority(1)).toBe('Medium')
    expect(normalizeWorkOrderPriority(3)).toBe('Critical')
  })
})

describe('serializeWorkOrderPriority', () => {
  it('maps priority strings to numeric API values', () => {
    expect(serializeWorkOrderPriority('Low')).toBe(0)
    expect(serializeWorkOrderPriority('Medium')).toBe(1)
    expect(serializeWorkOrderPriority('Critical')).toBe(3)
  })
})

describe('serializeWorkOrderStatus', () => {
  it('maps status strings to numeric API values', () => {
    expect(serializeWorkOrderStatus('Open')).toBe(0)
    expect(serializeWorkOrderStatus('InProgress')).toBe(1)
    expect(serializeWorkOrderStatus('WaitingForParts')).toBe(2)
    expect(serializeWorkOrderStatus('Completed')).toBe(3)
    expect(serializeWorkOrderStatus('Cancelled')).toBe(4)
  })
})

describe('serializeVehicleStatus', () => {
  it('maps vehicle status strings to numeric API values', () => {
    expect(serializeVehicleStatus('Active')).toBe(0)
    expect(serializeVehicleStatus('InMaintenance')).toBe(1)
    expect(serializeVehicleStatus('Retired')).toBe(3)
  })
})

describe('serializeAssetEnums', () => {
  it('maps asset status and condition to numeric API values', () => {
    expect(serializeAssetStatus('Available')).toBe(0)
    expect(serializeAssetStatus('UnderMaintenance')).toBe(2)
    expect(serializeAssetCondition('New')).toBe(0)
    expect(serializeAssetCondition('Damaged')).toBe(4)
  })
})

describe('serializeInspectionStatus', () => {
  it('maps inspection status strings to numeric API values', () => {
    expect(serializeInspectionStatus('Passed')).toBe(0)
    expect(serializeInspectionStatus('Failed')).toBe(1)
    expect(serializeInspectionStatus('NeedsReview')).toBe(2)
  })
})

describe('serializeUserRole', () => {
  it('maps user role strings to numeric API values', () => {
    expect(serializeUserRole('Viewer')).toBe(0)
    expect(serializeUserRole('Administrator')).toBe(4)
  })
})

describe('normalizeUserRole', () => {
  it('maps administrator role from API index', () => {
    expect(normalizeUserRole(4)).toBe('Administrator')
  })
})

describe('normalizeAuditAction', () => {
  it('maps numeric API values to action strings', () => {
    expect(normalizeAuditAction(1)).toBe('WorkOrderStatusChanged')
  })
})
