import { api } from '@/lib/api'
import type { AuditHistoryFilter, AuditLogResponse } from '@/types/audit'

export const auditService = {
  async getHistory(filter: AuditHistoryFilter = {}): Promise<AuditLogResponse[]> {
    const params: Record<string, string | number> = {}
    if (filter.action) params.action = filter.action
    if (filter.entityId) params.entityId = filter.entityId
    if (filter.entityType) params.entityType = filter.entityType
    if (filter.dateFrom) params.dateFrom = filter.dateFrom
    if (filter.dateTo) params.dateTo = filter.dateTo
    if (filter.page) params.page = filter.page
    if (filter.pageSize) params.pageSize = filter.pageSize

    const { data } = await api.get<AuditLogResponse[]>('/audit', { params })
    return data
  },

  async getById(id: string): Promise<AuditLogResponse> {
    const { data } = await api.get<AuditLogResponse>(`/audit/${id}`)
    return data
  },
}
