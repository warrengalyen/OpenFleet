import { describe, expect, it } from 'vitest'
import {
  normalizeAssetCondition,
  normalizeAssetStatus,
  normalizeAuditAction,
  normalizeUserRole,
  normalizeWorkOrderPriority,
  normalizeWorkOrderStatus,
  serializeWorkOrderPriority,
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
