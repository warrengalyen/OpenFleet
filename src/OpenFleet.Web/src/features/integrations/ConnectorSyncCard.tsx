import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { AuthPolicy } from '@/lib/auth'
import { getApiErrorMessage } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'
import type { ConnectorDefinition } from './constants'
import { useIntegrationHistory, useExportIntegration, useTriggerSync } from './hooks'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'
import { JsonPayloadPanel } from './JsonPayloadPanel'

interface ConnectorSyncCardProps {
  connector: ConnectorDefinition
  onSyncComplete?: (logId: string) => void
}

export function ConnectorSyncCard({ connector, onSyncComplete }: ConnectorSyncCardProps) {
  const { hasPolicy } = useAuth()
  const canSync = hasPolicy(AuthPolicy.FleetManagerOrAbove)
  const toast = useToast()
  const triggerSync = useTriggerSync()
  const exportIntegration = useExportIntegration()
  const [exportPayload, setExportPayload] = useState<string | null>(null)

  const { data: recent } = useIntegrationHistory({
    source: connector.source,
    page: 1,
    pageSize: 1,
  })

  const latest = recent?.items[0]
  const Icon = connector.icon
  const isBusy = triggerSync.isPending || exportIntegration.isPending

  async function handleImport() {
    try {
      const log = await triggerSync.mutateAsync(connector.source)
      if (log.status === 'Success') {
        toast.success(`${connector.title} import completed`, `${log.recordsProcessed ?? 0} records processed`)
      } else {
        toast.error(
          `${connector.title} import failed`,
          log.errorMessage ?? 'The connector reported a failure.',
        )
      }
      onSyncComplete?.(log.id)
    } catch (err) {
      toast.error(`Failed to run ${connector.title} import`, getApiErrorMessage(err))
    }
  }

  async function handleExport() {
    try {
      const log = await exportIntegration.mutateAsync(connector.source)
      setExportPayload(log.payload)
      if (log.status === 'Success') {
        toast.success(`${connector.title} export completed`)
      } else {
        toast.error(`${connector.title} export failed`, log.errorMessage ?? 'Export failed.')
      }
      onSyncComplete?.(log.id)
    } catch (err) {
      toast.error(`Failed to export ${connector.title} data`, getApiErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{connector.title}</CardTitle>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{connector.description}</p>
            </div>
          </div>
          {latest && <IntegrationStatusBadge status={latest.status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canSync ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleImport()}
              loading={triggerSync.isPending}
              disabled={isBusy}
            >
              <Upload className="h-4 w-4" />
              {connector.importActionLabel}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleExport()}
              loading={exportIntegration.isPending}
              disabled={isBusy}
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fleet Manager access is required to trigger syncs.
          </p>
        )}

        {latest && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last sync: {latest.direction} · {latest.recordsProcessed ?? 0} records
            {latest.errorMessage ? ` · ${latest.errorMessage}` : ''}
          </p>
        )}

        {exportPayload && (
          <JsonPayloadPanel
            payload={exportPayload}
            title="Exported JSON"
            emptyMessage="Export completed with no payload."
          />
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">{connector.exportDescription}</p>
      </CardContent>
    </Card>
  )
}
