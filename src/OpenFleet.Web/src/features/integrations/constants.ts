import type { IntegrationSource } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { Box, Fuel, Package, Wrench } from 'lucide-react'

export interface ConnectorDefinition {
  source: IntegrationSource
  title: string
  description: string
  importActionLabel: string
  exportDescription: string
  icon: LucideIcon
}

export const INTEGRATION_CONNECTORS: ConnectorDefinition[] = [
  {
    source: 'FuelUsage',
    title: 'Fuel Usage',
    description:
      'Import telematics fuel and mileage data to update vehicle odometer readings.',
    importActionLabel: 'Import fuel usage',
    exportDescription: 'Export current vehicle mileage snapshot for the telematics provider.',
    icon: Fuel,
  },
  {
    source: 'VendorRepair',
    title: 'Vendor Repair',
    description:
      'Pull repair status updates from external vendor portals for open work orders.',
    importActionLabel: 'Import repair status',
    exportDescription: 'Export open work orders waiting for vendor repair updates.',
    icon: Wrench,
  },
  {
    source: 'PartsSupplier',
    title: 'Parts Supplier',
    description: 'Sync parts inventory levels and costs from an external supplier catalog.',
    importActionLabel: 'Sync parts inventory',
    exportDescription: 'Export current parts inventory for the supplier system.',
    icon: Package,
  },
  {
    source: 'ExternalAsset',
    title: 'External Asset',
    description: 'Import asset records from an external CMMS or ERP system.',
    importActionLabel: 'Import assets',
    exportDescription: 'Export fleet assets for the external asset registry.',
    icon: Box,
  },
]

export const INTEGRATION_PAGE_SIZE = 20
