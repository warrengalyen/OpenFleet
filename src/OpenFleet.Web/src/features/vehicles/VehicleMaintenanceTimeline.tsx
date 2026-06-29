import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Eye, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import {
  formatDate,
  formatDateTime,
  inspectionStatusLabel,
  inspectionStatusVariant,
  workOrderStatusLabel,
  workOrderStatusVariant,
} from '@/lib/formatters'
import { useInspections } from '@/features/inspections/hooks'
import { useMaintenanceSchedules } from '@/features/maintenance/hooks'
import { useWorkOrders } from '@/features/work-orders/hooks'

interface VehicleMaintenanceTimelineProps {
  vehicleId: string
}

type TimelineEntry =
  | {
      kind: 'inspection'
      id: string
      date: string
      title: string
      status: string
      statusVariant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'default'
      link: string
      subtitle?: string
    }
  | {
      kind: 'work-order'
      id: string
      date: string
      title: string
      status: string
      statusVariant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'default'
      link: string
      subtitle?: string
    }
  | {
      kind: 'schedule'
      id: string
      date: string
      title: string
      status: string
      statusVariant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'default'
      link: string
      subtitle?: string
    }

const kindIcon = {
  inspection: Eye,
  'work-order': ClipboardList,
  schedule: Wrench,
} as const

export function VehicleMaintenanceTimeline({ vehicleId }: VehicleMaintenanceTimelineProps) {
  const { data: inspections, isLoading: inspectionsLoading } = useInspections({ vehicleId })
  const { data: workOrders, isLoading: workOrdersLoading } = useWorkOrders({ vehicleId })
  const { data: schedules, isLoading: schedulesLoading } = useMaintenanceSchedules(false)

  const isLoading = inspectionsLoading || workOrdersLoading || schedulesLoading

  const entries = useMemo<TimelineEntry[]>(() => {
    const items: TimelineEntry[] = []

    for (const inspection of inspections ?? []) {
      items.push({
        kind: 'inspection',
        id: inspection.id,
        date: inspection.inspectedAt,
        title: `Inspection - ${inspectionStatusLabel[inspection.status]}`,
        status: inspectionStatusLabel[inspection.status],
        statusVariant: inspectionStatusVariant[inspection.status],
        link: `/inspections/${inspection.id}`,
        subtitle: inspection.generatedWorkOrderId
          ? 'Linked work order created'
          : inspection.notes || undefined,
      })
    }

    for (const wo of workOrders ?? []) {
      items.push({
        kind: 'work-order',
        id: wo.id,
        date: wo.createdAt,
        title: wo.title,
        status: workOrderStatusLabel[wo.status],
        statusVariant: workOrderStatusVariant[wo.status],
        link: `/work-orders/${wo.id}`,
        subtitle: wo.description || undefined,
      })
    }

    for (const schedule of (schedules ?? []).filter((s) => s.vehicleId === vehicleId)) {
      const date = schedule.lastPerformedAt ?? schedule.createdAt
      items.push({
        kind: 'schedule',
        id: schedule.id,
        date,
        title: schedule.name,
        status: schedule.isDue ? 'Due' : schedule.isActive ? 'Scheduled' : 'Inactive',
        statusVariant: schedule.isDue ? 'warning' : schedule.isActive ? 'info' : 'neutral',
        link: `/maintenance/schedules/${schedule.id}/edit`,
        subtitle: schedule.lastPerformedAt
          ? `Last performed ${formatDate(schedule.lastPerformedAt)}`
          : 'No service recorded yet',
      })
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [inspections, workOrders, schedules, vehicleId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No inspections, work orders, or maintenance schedules for this vehicle yet.
          </p>
        ) : (
          <ol className="relative space-y-0 border-l border-gray-200 dark:border-gray-700">
            {entries.map((entry) => {
              const Icon = kindIcon[entry.kind]
              return (
                <li key={`${entry.kind}-${entry.id}`} className="mb-6 ml-4 last:mb-0">
                  <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white dark:bg-gray-800 dark:ring-gray-900">
                    <Icon className="h-2.5 w-2.5 text-gray-500" />
                  </span>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link
                        to={entry.link}
                        className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {entry.title}
                      </Link>
                      {entry.subtitle && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {entry.subtitle}
                        </p>
                      )}
                    </div>
                    <Badge variant={entry.statusVariant}>{entry.status}</Badge>
                  </div>
                  <time className="mt-1 block text-xs text-gray-400">
                    {formatDateTime(entry.date)}
                  </time>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
