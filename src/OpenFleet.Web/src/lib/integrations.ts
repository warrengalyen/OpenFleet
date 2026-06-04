import type { IntegrationDirection, IntegrationSource, IntegrationStatus } from '@/types'
import type { BadgeVariant } from './badges'

export const integrationSourceLabel: Record<IntegrationSource, string> = {
  FuelUsage: 'Fuel Usage',
  VendorRepair: 'Vendor Repair',
  PartsSupplier: 'Parts Supplier',
  ExternalAsset: 'External Asset',
}

export const integrationDirectionLabel: Record<IntegrationDirection, string> = {
  Import: 'Import',
  Export: 'Export',
}

export const integrationStatusLabel: Record<IntegrationStatus, string> = {
  Pending: 'Pending',
  Success: 'Succeeded',
  Failed: 'Failed',
  Retrying: 'Retrying',
}

export const integrationStatusVariant: Record<IntegrationStatus, BadgeVariant> = {
  Pending: 'neutral',
  Success: 'success',
  Failed: 'danger',
  Retrying: 'warning',
}

export function canRetryIntegration(status: IntegrationStatus): boolean {
  return status === 'Failed' || status === 'Retrying'
}
