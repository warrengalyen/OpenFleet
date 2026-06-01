import type { WorkOrderPriority, WorkOrderStatus, VehicleStatus, InspectionStatus, AssetStatus, AssetCondition } from '@/types'
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
  OutOfService: 'Out of Service',
  Retired: 'Retired',
}

export const vehicleStatusVariant: Record<VehicleStatus, BadgeVariant> = {
  Active: 'success',
  InMaintenance: 'warning',
  OutOfService: 'danger',
  Retired: 'neutral',
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

// ── Asset helpers ───────────────────────────────────────────────────────────

export const assetStatusLabel: Record<AssetStatus, string> = {
  Available: 'Available',
  InUse: 'In Use',
  UnderMaintenance: 'Under Maintenance',
  Decommissioned: 'Decommissioned',
}

export const assetStatusVariant: Record<AssetStatus, BadgeVariant> = {
  Available: 'success',
  InUse: 'info',
  UnderMaintenance: 'warning',
  Decommissioned: 'neutral',
}

export const assetConditionLabel: Record<AssetCondition, string> = {
  New: 'New',
  Good: 'Good',
  Fair: 'Fair',
  Poor: 'Poor',
  Damaged: 'Damaged',
}

export const assetConditionVariant: Record<AssetCondition, BadgeVariant> = {
  New: 'success',
  Good: 'info',
  Fair: 'default',
  Poor: 'warning',
  Damaged: 'danger',
}

// ── Inventory helpers ───────────────────────────────────────────────────────

export type StockLevel = 'in-stock' | 'low-stock' | 'out-of-stock'

export function stockLevel(quantity: number, threshold: number): StockLevel {
  if (quantity <= 0) return 'out-of-stock'
  if (quantity <= threshold) return 'low-stock'
  return 'in-stock'
}

export const stockLevelLabel: Record<StockLevel, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
}

export const stockLevelVariant: Record<StockLevel, BadgeVariant> = {
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'danger',
}

export type VendorAvailability = 'active' | 'available' | 'unassigned'

export function vendorAvailability(partCount: number): VendorAvailability {
  if (partCount > 0) return 'active'
  return 'available'
}

export const vendorAvailabilityLabel: Record<VendorAvailability, string> = {
  active: 'Active supplier',
  available: 'Available',
  unassigned: 'No parts assigned',
}

export const vendorAvailabilityVariant: Record<VendorAvailability, BadgeVariant> = {
  active: 'success',
  available: 'info',
  unassigned: 'neutral',
}
