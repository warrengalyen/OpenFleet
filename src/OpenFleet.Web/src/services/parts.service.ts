import { api } from '@/lib/api'
import type {
  CreatePartRequest,
  PartFilterRequest,
  PartResponse,
  PartUsageHistoryEntry,
  UpdatePartRequest,
} from '@/types'

export const partsService = {
  async list(filters?: PartFilterRequest): Promise<PartResponse[]> {
    const { data } = await api.get<PartResponse[]>('/parts', { params: filters })
    return data
  },

  async get(id: string): Promise<PartResponse> {
    const { data } = await api.get<PartResponse>(`/parts/${id}`)
    return data
  },

  async getUsageHistory(id: string): Promise<PartUsageHistoryEntry[]> {
    const { data } = await api.get<PartUsageHistoryEntry[]>(`/parts/${id}/usage-history`)
    return data
  },

  async create(request: CreatePartRequest): Promise<PartResponse> {
    const { data } = await api.post<PartResponse>('/parts', request)
    return data
  },

  async update(id: string, request: UpdatePartRequest): Promise<PartResponse> {
    const { data } = await api.put<PartResponse>(`/parts/${id}`, request)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/parts/${id}`)
  },
}
