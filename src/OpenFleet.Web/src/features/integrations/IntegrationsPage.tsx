import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { History, LayoutDashboard } from 'lucide-react'
import { PageTitle } from '@/components/layout/PageTitle'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { INTEGRATION_CONNECTORS, INTEGRATION_PAGE_SIZE } from './constants'
import { ConnectorSyncCard } from './ConnectorSyncCard'
import { IntegrationHistoryTable } from './IntegrationHistoryTable'
import { IntegrationSummaryCards } from './IntegrationSummaryCards'
import { useIntegrationHistory, useIntegrationSummary } from './hooks'
import type { IntegrationHistoryFilter, IntegrationSource, IntegrationStatus } from '@/types'

type Tab = 'dashboard' | 'history'

const SOURCE_OPTIONS: { value: IntegrationSource | ''; label: string }[] = [
  { value: '', label: 'All systems' },
  { value: 'FuelUsage', label: 'Fuel Usage' },
  { value: 'VendorRepair', label: 'Vendor Repair' },
  { value: 'PartsSupplier', label: 'Parts Supplier' },
  { value: 'ExternalAsset', label: 'External Asset' },
]

const STATUS_OPTIONS: { value: IntegrationStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'Success', label: 'Succeeded' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Retrying', label: 'Retrying' },
  { value: 'Pending', label: 'Pending' },
]

export function IntegrationsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') as Tab) || 'dashboard'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const historyFilter = useMemo<IntegrationHistoryFilter>(() => {
    const source = searchParams.get('source') as IntegrationSource | null
    const status = searchParams.get('status') as IntegrationStatus | null
    return {
      ...(source ? { source } : {}),
      ...(status ? { status } : {}),
      page,
      pageSize: INTEGRATION_PAGE_SIZE,
    }
  }, [searchParams, page])

  const { data: summary, isLoading: summaryLoading } = useIntegrationSummary()
  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch,
  } = useIntegrationHistory(historyFilter)

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    if (next === 'dashboard') {
      params.delete('page')
      params.delete('source')
      params.delete('status')
    }
    setSearchParams(params)
  }

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Integrations"
        subtitle="Monitor multi-system syncs for fuel, vendors, parts, and external assets"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'dashboard'
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
            )}
            aria-pressed={tab === 'dashboard'}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'history'
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400',
            )}
            aria-pressed={tab === 'history'}
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      {tab === 'dashboard' ? (
        <>
          <IntegrationSummaryCards data={summary} isLoading={summaryLoading} />

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Connected systems
            </h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {INTEGRATION_CONNECTORS.map((connector) => (
                <ConnectorSyncCard
                  key={connector.source}
                  connector={connector}
                  onSyncComplete={(logId) => navigate(`/integrations/${logId}`)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent activity
              </h2>
              <Button variant="ghost" onClick={() => setTab('history')}>
                View all history
              </Button>
            </div>
            <IntegrationHistoryTable
              data={summary?.items.slice(0, 8)}
              isLoading={summaryLoading}
              isError={false}
              onRetry={() => void refetch()}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Select
              value={searchParams.get('source') ?? ''}
              onChange={(e) => updateParams({ source: e.target.value || null, page: '1' })}
              className="w-full sm:w-48"
              aria-label="Filter by system"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              value={searchParams.get('status') ?? ''}
              onChange={(e) => updateParams({ status: e.target.value || null, page: '1' })}
              className="w-full sm:w-48"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            {(searchParams.get('source') || searchParams.get('status')) && (
              <Button
                variant="ghost"
                onClick={() => updateParams({ source: null, status: null, page: '1' })}
              >
                Clear filters
              </Button>
            )}
          </div>

          <IntegrationHistoryTable
            data={history?.items}
            isLoading={historyLoading}
            isError={historyError}
            onRetry={() => void refetch()}
          />

          {history && history.pageCount > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Page {history.page} of {history.pageCount} · {history.totalCount} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= history.pageCount}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
