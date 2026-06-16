import { describe, expect, it } from 'vitest'
import {
  normalizeAuditAction,
  normalizeUserRole,
  normalizeWorkOrderPriority,
  normalizeWorkOrderStatus,
} from '@/lib/enums'

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
    expect(normalizeWorkOrderPriority(3)).toBe('Critical')
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
