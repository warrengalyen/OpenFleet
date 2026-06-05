import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface JsonPayloadPanelProps {
  payload: string | null
  title?: string
  emptyMessage?: string
}

function formatPayload(payload: string | null): string {
  if (!payload) return ''
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

export function JsonPayloadPanel({
  payload,
  title = 'JSON payload',
  emptyMessage = 'No payload recorded for this sync.',
}: JsonPayloadPanelProps) {
  const formatted = useMemo(() => formatPayload(payload), [payload])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {formatted ? (
          <pre className="max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
            {formatted}
          </pre>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}
