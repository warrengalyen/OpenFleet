import { api } from '@/lib/api'
import { normalizeAuditAction } from '@/lib/enums'
import type { AuditHistoryFilter, AuditHistoryResponse, AuditLogResponse } from '@/types/audit'

function normalizeAuditLog(log: AuditLogResponse): AuditLogResponse {
  return { ...log, action: normalizeAuditAction(log.action) }
}

export const auditService = {
  async getHistory(filter: AuditHistoryFilter = {}): Promise<AuditHistoryResponse> {
    const params: Record<string, string | number> = {}
    if (filter.action) params.action = filter.action
    if (filter.entityId) params.entityId = filter.entityId
    if (filter.entityType) params.entityType = filter.entityType
    if (filter.dateFrom) params.dateFrom = filter.dateFrom
    if (filter.dateTo) params.dateTo = filter.dateTo
    if (filter.page) params.page = filter.page
    if (filter.pageSize) params.pageSize = filter.pageSize

    const { data } = await api.get<AuditHistoryResponse>('/audit', { params })
    return {
      ...data,
      items: data.items.map(normalizeAuditLog),
    }
  },

  async getById(id: string): Promise<AuditLogResponse> {
    const { data } = await api.get<AuditLogResponse>(`/audit/${id}`)
    return normalizeAuditLog(data)
  },
}
