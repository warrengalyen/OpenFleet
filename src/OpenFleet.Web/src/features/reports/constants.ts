import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Package,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react'

export type ReportSlug =
  | 'maintenance-cost'
  | 'vehicle-downtime'
  | 'parts-usage'
  | 'inspection-failure-rate'
  | 'work-orders-by-status'
  | 'work-orders-by-priority'
  | 'vehicles-due'

export interface ReportDefinition {
  slug: ReportSlug
  title: string
  description: string
  icon: LucideIcon
  supportsDateFilter: boolean
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    slug: 'maintenance-cost',
    title: 'Maintenance Cost by Vehicle',
    description: 'Labor hours and completed work orders per vehicle to identify high-maintenance assets.',
    icon: DollarSign,
    supportsDateFilter: false,
  },
  {
    slug: 'vehicle-downtime',
    title: 'Vehicle Downtime',
    description: 'Vehicles in maintenance or with open work orders affecting fleet availability.',
    icon: Truck,
    supportsDateFilter: true,
  },
  {
    slug: 'parts-usage',
    title: 'Parts Usage & Inventory',
    description: 'Current stock levels, unit costs, and total inventory value by part.',
    icon: Package,
    supportsDateFilter: false,
  },
  {
    slug: 'inspection-failure-rate',
    title: 'Inspection Failure Rate',
    description: 'Inspection outcomes, failure rate percentage, and top failing vehicles.',
    icon: ShieldAlert,
    supportsDateFilter: false,
  },
  {
    slug: 'work-orders-by-status',
    title: 'Work Orders by Status',
    description: 'Workflow throughput and backlog size across all work order statuses.',
    icon: ClipboardList,
    supportsDateFilter: false,
  },
  {
    slug: 'work-orders-by-priority',
    title: 'Work Orders by Priority',
    description: 'Priority distribution for staffing and escalation decisions.',
    icon: Wrench,
    supportsDateFilter: false,
  },
  {
    slug: 'vehicles-due',
    title: 'Vehicles Due for Service',
    description: 'Overdue preventive maintenance schedules by date or mileage.',
    icon: BarChart3,
    supportsDateFilter: true,
  },
]

export function getReportDefinition(slug: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((r) => r.slug === slug)
}
