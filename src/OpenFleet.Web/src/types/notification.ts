export interface WorkOrderStatusChangedNotification {
  workOrderId: string
  title: string
  oldStatus: string
  newStatus: string
  occurredAtUtc: string
}

export interface MaintenanceOverdueNotification {
  scheduleId: string
  scheduleName: string
  targetLabel: string
  daysOverdue: number | null
  milesOverdue: number | null
  occurredAtUtc: string
}
