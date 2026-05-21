import { api } from '@/lib/api'
import type { IntegrationHistoryFilter, IntegrationHistoryResponse } from '@/types'

export const integrationsService = {
  getHistory(filter: IntegrationHistoryFilter = {}) {
    const params = new URLSearchParams()
    if (filter.source) params.set('source', filter.source)
    if (filter.status) params.set('status', filter.status)
    if (filter.dateFrom) params.set('dateFrom', filter.dateFrom)
    if (filter.dateTo) params.set('dateTo', filter.dateTo)
    if (filter.page) params.set('page', String(filter.page))
    if (filter.pageSize) params.set('pageSize', String(filter.pageSize))

    const query = params.toString()
    const url = query ? `/integrations?${query}` : '/integrations'

    return api.get<IntegrationHistoryResponse>(url).then((r) => r.data)
  },
}
