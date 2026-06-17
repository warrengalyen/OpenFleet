import { api } from '@/lib/api'
import { normalizeAssetCondition, normalizeAssetStatus } from '@/lib/enums'
import type {
  AssetFilterRequest,
  AssetResponse,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '@/types'

function normalizeAsset(asset: AssetResponse): AssetResponse {
  return {
    ...asset,
    status: normalizeAssetStatus(asset.status),
    condition: normalizeAssetCondition(asset.condition),
  }
}

export const assetsService = {
  async list(filters?: AssetFilterRequest): Promise<AssetResponse[]> {
    const { data } = await api.get<AssetResponse[]>('/assets', { params: filters })
    return data.map(normalizeAsset)
  },

  async get(id: string): Promise<AssetResponse> {
    const { data } = await api.get<AssetResponse>(`/assets/${id}`)
    return normalizeAsset(data)
  },

  async create(request: CreateAssetRequest): Promise<AssetResponse> {
    const { data } = await api.post<AssetResponse>('/assets', request)
    return normalizeAsset(data)
  },

  async update(id: string, request: UpdateAssetRequest): Promise<AssetResponse> {
    const { data } = await api.put<AssetResponse>(`/assets/${id}`, request)
    return normalizeAsset(data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/assets/${id}`)
  },
}
