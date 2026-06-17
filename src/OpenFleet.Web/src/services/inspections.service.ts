import { api } from '@/lib/api'
import { normalizeInspectionStatus } from '@/lib/enums'
import type {
  CreateInspectionRequest,
  InspectionFilterRequest,
  InspectionResponse,
  UpdateInspectionRequest,
} from '@/types'

function normalizeInspection(inspection: InspectionResponse): InspectionResponse {
  return {
    ...inspection,
    status: normalizeInspectionStatus(inspection.status),
  }
}

export const inspectionsService = {
  async list(filters?: InspectionFilterRequest): Promise<InspectionResponse[]> {
    const { data } = await api.get<InspectionResponse[]>('/inspections', { params: filters })
    return data.map(normalizeInspection)
  },

  async get(id: string): Promise<InspectionResponse> {
    const { data } = await api.get<InspectionResponse>(`/inspections/${id}`)
    return normalizeInspection(data)
  },

  async create(request: CreateInspectionRequest): Promise<InspectionResponse> {
    const { data } = await api.post<InspectionResponse>('/inspections', request)
    return normalizeInspection(data)
  },

  async update(id: string, request: UpdateInspectionRequest): Promise<InspectionResponse> {
    const { data } = await api.put<InspectionResponse>(`/inspections/${id}`, request)
    return normalizeInspection(data)
  },
}
