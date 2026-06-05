import { useMemo } from 'react'
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { IntegrationHistoryResponse } from '@/types'

interface IntegrationSummaryCardsProps {
  data: IntegrationHistoryResponse | undefined
  isLoading?: boolean
}

export function IntegrationSummaryCards({ data, isLoading }: IntegrationSummaryCardsProps) {
  const counts = useMemo(() => {
    const items = data?.items ?? []
    return {
      total: data?.totalCount ?? items.length,
      success: items.filter((i) => i.status === 'Success').length,
      failed: items.filter((i) => i.status === 'Failed').length,
      retrying: items.filter((i) => i.status === 'Retrying').length,
      pending: items.filter((i) => i.status === 'Pending').length,
    }
  }, [data])

  const cards = [
    {
      label: 'Recent syncs',
      value: counts.total,
      icon: RefreshCw,
      tone: 'text-gray-600 dark:text-gray-300',
    },
    {
      label: 'Succeeded',
      value: counts.success,
      icon: CheckCircle,
      tone: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Failed',
      value: counts.failed,
      icon: AlertTriangle,
      tone: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Retrying / pending',
      value: counts.retrying + counts.pending,
      icon: Clock,
      tone: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <card.icon className={`h-5 w-5 ${card.tone}`} />
              <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                {isLoading ? '—' : card.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
