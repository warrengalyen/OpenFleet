import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/Toaster'
import { useAuth } from '@/hooks/useAuth'
import {
  createNotificationsConnection,
  startNotificationsConnection,
  stopNotificationsConnection,
} from '@/lib/signalr'
import { workOrderKeys } from '@/features/work-orders/hooks'
import { dashboardKeys } from '@/features/dashboard/hooks'
import { maintenanceKeys } from '@/features/maintenance/hooks'
import { reportKeys } from '@/features/reports/hooks'
import { workOrderStatusLabel } from '@/lib/formatters'
import type {
  MaintenanceOverdueNotification,
  WorkOrderStatus,
  WorkOrderStatusChangedNotification,
} from '@/types'

function formatOverdueSummary(notification: MaintenanceOverdueNotification): string {
  const parts: string[] = []
  if (notification.daysOverdue != null && notification.daysOverdue > 0) {
    parts.push(`${Math.ceil(notification.daysOverdue)}d overdue`)
  }
  if (notification.milesOverdue != null && notification.milesOverdue > 0) {
    parts.push(`${notification.milesOverdue.toLocaleString()} mi overdue`)
  }
  return parts.length > 0 ? parts.join(', ') : 'Due for service'
}

function statusLabel(status: string): string {
  const known = status as WorkOrderStatus
  return workOrderStatusLabel[known] ?? status
}

/** Handles hub event side effects; exported for unit tests. */
export function handleWorkOrderStatusChanged(
  notification: WorkOrderStatusChangedNotification,
  toast: { info: (title: string, message?: string) => void },
  queryClient: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown },
): void {
  toast.info(
    'Work order updated',
    `${notification.title}: ${statusLabel(notification.oldStatus)} → ${statusLabel(notification.newStatus)}`,
  )
  void queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.workOrdersByStatus })
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.workOrdersByPriority })
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.openWorkOrders })
}

/** Handles hub event side effects; exported for unit tests. */
export function handleMaintenanceOverdue(
  notification: MaintenanceOverdueNotification,
  toast: { warning: (title: string, message?: string) => void },
  queryClient: { invalidateQueries: (opts: { queryKey: readonly unknown[] }) => unknown },
): void {
  toast.warning(
    'Maintenance overdue',
    `${notification.scheduleName} — ${notification.targetLabel} (${formatOverdueSummary(notification)})`,
  )
  void queryClient.invalidateQueries({ queryKey: maintenanceKeys.all })
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.vehiclesDue })
  void queryClient.invalidateQueries({ queryKey: reportKeys.vehiclesDue() })
}

export function useRealtimeNotifications(): void {
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const toastRef = useRef(toast)
  const queryClientRef = useRef(queryClient)
  toastRef.current = toast
  queryClientRef.current = queryClient

  useEffect(() => {
    if (!isAuthenticated) return

    const connection = createNotificationsConnection()

    connection.on('WorkOrderStatusChanged', (payload: WorkOrderStatusChangedNotification) => {
      handleWorkOrderStatusChanged(payload, toastRef.current, queryClientRef.current)
    })

    connection.on('MaintenanceOverdue', (payload: MaintenanceOverdueNotification) => {
      handleMaintenanceOverdue(payload, toastRef.current, queryClientRef.current)
    })

    void startNotificationsConnection(connection).catch(() => {
      // Automatic reconnect handles transient failures; avoid toast noise on load.
    })

    return () => {
      void stopNotificationsConnection(connection)
    }
  }, [isAuthenticated])
}
