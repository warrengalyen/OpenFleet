import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { PageTitle } from '@/components/layout/PageTitle'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { MaintenanceDueList } from './MaintenanceDueList'
import { MaintenanceScheduleList } from './MaintenanceScheduleList'

type Tab = 'due' | 'schedules'

export function MaintenancePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPolicy } = useAuth()
  const canManage = hasPolicy(AuthPolicy.FleetManagerOrAbove)

  const tab = (searchParams.get('tab') as Tab) || 'due'
  const showInactive = searchParams.get('showInactive') === 'true'

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Preventive Maintenance"
        subtitle="Track service schedules and vehicles due for maintenance"
        actions={
          canManage ? (
            <Button onClick={() => navigate('/maintenance/schedules/new')}>
              <Plus className="h-4 w-4" />
              New schedule
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setTab('due')}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'due'
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
            )}
            aria-pressed={tab === 'due'}
          >
            Due for service
          </button>
          <button
            type="button"
            onClick={() => setTab('schedules')}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'schedules'
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
            )}
            aria-pressed={tab === 'schedules'}
          >
            <Calendar className="h-4 w-4" />
            Schedules
          </button>
        </div>

        {tab === 'schedules' && canManage && (
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams)
                if (e.target.checked) params.set('showInactive', 'true')
                else params.delete('showInactive')
                setSearchParams(params)
              }}
              className="rounded border-gray-300"
            />
            Show inactive schedules
          </label>
        )}
      </div>

      {tab === 'due' ? (
        <MaintenanceDueList />
      ) : (
        <MaintenanceScheduleList activeOnly={!showInactive} />
      )}
    </div>
  )
}
