import { api } from '@/lib/api'
import type {
  AddNoteRequest,
  CreateWorkOrderRequest,
  RecordLaborRequest,
  TransitionStatusRequest,
  WorkOrderNoteResponse,
  WorkOrderResponse,
} from '@/types'

export const workOrdersService = {
  async list(): Promise<WorkOrderResponse[]> {
    const { data } = await api.get<WorkOrderResponse[]>('/workorders')
    return data
  },

  async get(id: string): Promise<WorkOrderResponse> {
    const { data } = await api.get<WorkOrderResponse>(`/workorders/${id}`)
    return data
  },

  async create(request: CreateWorkOrderRequest): Promise<WorkOrderResponse> {
    const { data } = await api.post<WorkOrderResponse>('/workorders', request)
    return data
  },

  async transitionStatus(id: string, request: TransitionStatusRequest): Promise<WorkOrderResponse> {
    const { data } = await api.patch<WorkOrderResponse>(`/workorders/${id}/status`, request)
    return data
  },

  async recordLabor(id: string, request: RecordLaborRequest): Promise<WorkOrderResponse> {
    const { data } = await api.post<WorkOrderResponse>(`/workorders/${id}/labor`, request)
    return data
  },

  async addNote(id: string, request: AddNoteRequest): Promise<WorkOrderNoteResponse> {
    const { data } = await api.post<WorkOrderNoteResponse>(`/workorders/${id}/notes`, request)
    return data
  },

  async getNotes(id: string): Promise<WorkOrderNoteResponse[]> {
    const { data } = await api.get<WorkOrderNoteResponse[]>(`/workorders/${id}/notes`)
    return data
  },
}
