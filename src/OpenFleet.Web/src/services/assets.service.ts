import { api } from '@/lib/api'
import type {
  AssetFilterRequest,
  AssetResponse,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '@/types'

export const assetsService = {
  async list(filters?: AssetFilterRequest): Promise<AssetResponse[]> {
    const { data } = await api.get<AssetResponse[]>('/assets', { params: filters })
    return data
  },

  async get(id: string): Promise<AssetResponse> {
    const { data } = await api.get<AssetResponse>(`/assets/${id}`)
    return data
  },

  async create(request: CreateAssetRequest): Promise<AssetResponse> {
    const { data } = await api.post<AssetResponse>('/assets', request)
    return data
  },

  async update(id: string, request: UpdateAssetRequest): Promise<AssetResponse> {
    const { data } = await api.put<AssetResponse>(`/assets/${id}`, request)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/assets/${id}`)
  },
}
