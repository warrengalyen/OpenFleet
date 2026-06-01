import { api } from '@/lib/api'
import type {
  CreateVendorRequest,
  UpdateVendorRequest,
  VendorDetailResponse,
  VendorFilterRequest,
  VendorResponse,
} from '@/types'

export const vendorsService = {
  async list(filters?: VendorFilterRequest): Promise<VendorResponse[]> {
    const { data } = await api.get<VendorResponse[]>('/vendors', { params: filters })
    return data
  },

  async get(id: string): Promise<VendorDetailResponse> {
    const { data } = await api.get<VendorDetailResponse>(`/vendors/${id}`)
    return data
  },

  async create(request: CreateVendorRequest): Promise<VendorResponse> {
    const { data } = await api.post<VendorResponse>('/vendors', request)
    return data
  },

  async update(id: string, request: UpdateVendorRequest): Promise<VendorResponse> {
    const { data } = await api.put<VendorResponse>(`/vendors/${id}`, request)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`)
  },
}
