import { describe, expect, it, vi } from 'vitest'
import {
  handleMaintenanceOverdue,
  handleWorkOrderStatusChanged,
} from '@/hooks/useRealtimeNotifications'
import { workOrderKeys } from '@/features/work-orders/hooks'
import { dashboardKeys } from '@/features/dashboard/hooks'
import { maintenanceKeys } from '@/features/maintenance/hooks'
import { reportKeys } from '@/features/reports/hooks'
import type {
  MaintenanceOverdueNotification,
  WorkOrderStatusChangedNotification,
} from '@/types'

describe('realtime notification handlers', () => {
  it('toasts and invalidates work order queries on status change', () => {
    const toast = { info: vi.fn() }
    const invalidateQueries = vi.fn()
    const notification: WorkOrderStatusChangedNotification = {
      workOrderId: 'wo-1',
      title: 'Brake job',
      oldStatus: 'Open',
      newStatus: 'InProgress',
      occurredAtUtc: '2026-07-21T12:00:00Z',
    }

    handleWorkOrderStatusChanged(notification, toast, { invalidateQueries })

    expect(toast.info).toHaveBeenCalledWith(
      'Work order updated',
      'Brake job: Open → In Progress',
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: workOrderKeys.all })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardKeys.workOrdersByStatus,
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardKeys.workOrdersByPriority,
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardKeys.openWorkOrders,
    })
  })

  it('toasts and invalidates maintenance queries on overdue alert', () => {
    const toast = { warning: vi.fn() }
    const invalidateQueries = vi.fn()
    const notification: MaintenanceOverdueNotification = {
      scheduleId: 'sched-1',
      scheduleName: 'Oil change',
      targetLabel: '2020 Chevy Express',
      daysOverdue: 12.2,
      milesOverdue: 500,
      occurredAtUtc: '2026-07-21T12:00:00Z',
    }

    handleMaintenanceOverdue(notification, toast, { invalidateQueries })

    expect(toast.warning).toHaveBeenCalledWith(
      'Maintenance overdue',
      expect.stringContaining('Oil change'),
    )
    expect(toast.warning).toHaveBeenCalledWith(
      'Maintenance overdue',
      expect.stringContaining('13d overdue'),
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: maintenanceKeys.all })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: dashboardKeys.vehiclesDue })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: reportKeys.vehiclesDue() })
  })
})
