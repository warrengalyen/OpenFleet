import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle } from 'lucide-react'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { getApiErrorMessage } from '@/lib/api'
import { formatDate, formatNumber } from '@/lib/formatters'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { useToast } from '@/components/ui/Toaster'
import type { MaintenanceScheduleResponse } from '@/types'
import { useMaintenanceSchedules, useMarkMaintenancePerformed } from './hooks'
import { MarkPerformedDialog } from './MarkPerformedDialog'
import type { MarkPerformedFormValues } from './schemas'

interface MaintenanceScheduleListProps {
  activeOnly: boolean
}

export function MaintenanceScheduleList({ activeOnly }: MaintenanceScheduleListProps) {
  const navigate = useNavigate()
  const { hasPolicy } = useAuth()
  const canManage = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const toast = useToast()

  const { data, isLoading, isError, refetch } = useMaintenanceSchedules(activeOnly)
  const [markSchedule, setMarkSchedule] = useState<MaintenanceScheduleResponse | null>(null)
  const markPerformed = useMarkMaintenancePerformed(markSchedule?.id ?? '')

  const schedules = useMemo(() => data ?? [], [data])

  async function handleMarkPerformed(values: MarkPerformedFormValues) {
    if (!markSchedule) return
    try {
      await markPerformed.mutateAsync({
        performedAt: new Date(values.performedAt).toISOString(),
        mileage: values.mileage ?? null,
      })
      toast.success('Service marked as performed')
      setMarkSchedule(null)
    } catch (err) {
      toast.error('Failed to mark performed', getApiErrorMessage(err))
    }
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Failed to load schedules.{' '}
        <button type="button" onClick={() => void refetch()} className="underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      <DataTable<MaintenanceScheduleResponse>
        columns={[
          {
            key: 'name',
            header: 'Schedule',
            sortable: true,
            render: (row) => (
              <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
            ),
          },
          {
            key: 'target',
            header: 'Vehicle / Asset',
            render: (row) => {
              if (row.vehicleId) {
                return (
                  <Link
                    to={`/vehicles/${row.vehicleId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand-600 hover:underline"
                  >
                    {row.vehicleDescription}
                  </Link>
                )
              }
              if (row.assetId) {
                return (
                  <Link
                    to={`/assets/${row.assetId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand-600 hover:underline"
                  >
                    {row.assetDescription}
                  </Link>
                )
              }
              return '—'
            },
          },
          {
            key: 'intervals',
            header: 'Interval',
            className: 'hidden md:table-cell',
            headerClassName: 'hidden md:table-cell',
            render: (row) => {
              const parts: string[] = []
              if (row.mileageInterval) parts.push(`${formatNumber(row.mileageInterval)} mi`)
              if (row.dayInterval) parts.push(`${row.dayInterval} days`)
              return parts.join(' / ') || '—'
            },
          },
          {
            key: 'nextDue',
            header: 'Next due',
            className: 'hidden lg:table-cell',
            headerClassName: 'hidden lg:table-cell',
            render: (row) => {
              const parts: string[] = []
              if (row.nextDueDate) parts.push(formatDate(row.nextDueDate))
              if (row.nextDueMileage) parts.push(`${formatNumber(row.nextDueMileage)} mi`)
              return parts.join(' / ') || '—'
            },
          },
          {
            key: 'isDue',
            header: 'Status',
            render: (row) =>
              row.isDue ? (
                <Badge variant="warning">Due</Badge>
              ) : row.isActive ? (
                <Badge variant="success">On track</Badge>
              ) : (
                <Badge variant="neutral">Inactive</Badge>
              ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage && row.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMarkSchedule(row)
                  }}
                  aria-label={`Mark ${row.name} as performed`}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              ) : null,
          },
        ]}
        data={schedules}
        isLoading={isLoading}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/maintenance/schedules/${row.id}/edit`)}
        emptyIcon={Calendar}
        emptyTitle="No schedules"
        emptyDescription="Create a preventive maintenance schedule for vehicles or assets."
        emptyAction={
          canManage ? (
            <Link
              to="/maintenance/schedules/new"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New schedule
            </Link>
          ) : undefined
        }
      />

      {markSchedule && (
        <MarkPerformedDialog
          open={!!markSchedule}
          onClose={() => setMarkSchedule(null)}
          onSubmit={handleMarkPerformed}
          scheduleName={markSchedule.name}
          isLoading={markPerformed.isPending}
        />
      )}
    </>
  )
}
