import type { WorkOrderPriority, WorkOrderStatus, VehicleStatus, InspectionStatus } from '@/types'
import type { BadgeVariant } from './badges'

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// ── Work order helpers ──────────────────────────────────────────────────────

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  WaitingForParts: 'Waiting for Parts',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
}

export const workOrderStatusVariant: Record<WorkOrderStatus, BadgeVariant> = {
  Open: 'info',
  InProgress: 'default',
  WaitingForParts: 'warning',
  Completed: 'success',
  Cancelled: 'neutral',
}

export const workOrderPriorityLabel: Record<WorkOrderPriority, string> = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
}

export const workOrderPriorityVariant: Record<WorkOrderPriority, BadgeVariant> = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Critical: 'danger',
}

// ── Vehicle helpers ─────────────────────────────────────────────────────────

export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  Active: 'Active',
  InMaintenance: 'In Maintenance',
  Retired: 'Retired',
  Decommissioned: 'Decommissioned',
}

export const vehicleStatusVariant: Record<VehicleStatus, BadgeVariant> = {
  Active: 'success',
  InMaintenance: 'warning',
  Retired: 'neutral',
  Decommissioned: 'danger',
}

// ── Inspection helpers ──────────────────────────────────────────────────────

export const inspectionStatusLabel: Record<InspectionStatus, string> = {
  Passed: 'Passed',
  Failed: 'Failed',
  NeedsReview: 'Needs Review',
}

export const inspectionStatusVariant: Record<InspectionStatus, BadgeVariant> = {
  Passed: 'success',
  Failed: 'danger',
  NeedsReview: 'warning',
}
