import { api } from '@/lib/api'
import type {
  CreateInspectionRequest,
  InspectionFilterRequest,
  InspectionResponse,
  UpdateInspectionRequest,
} from '@/types'

export const inspectionsService = {
  async list(filters?: InspectionFilterRequest): Promise<InspectionResponse[]> {
    const { data } = await api.get<InspectionResponse[]>('/inspections', { params: filters })
    return data
  },

  async get(id: string): Promise<InspectionResponse> {
    const { data } = await api.get<InspectionResponse>(`/inspections/${id}`)
    return data
  },

  async create(request: CreateInspectionRequest): Promise<InspectionResponse> {
    const { data } = await api.post<InspectionResponse>('/inspections', request)
    return data
  },

  async update(id: string, request: UpdateInspectionRequest): Promise<InspectionResponse> {
    const { data } = await api.put<InspectionResponse>(`/inspections/${id}`, request)
    return data
  },
}
