import { api } from '@/lib/api'
import { downloadBlobResponse } from '@/lib/download'
import {
  normalizeWorkOrderPriority,
  normalizeWorkOrderStatus,
  serializeWorkOrderPriority,
  serializeWorkOrderStatus,
} from '@/lib/enums'
import type {
  AddNoteRequest,
  CreateMaintenanceRecordRequest,
  CreateWorkOrderRequest,
  MaintenanceRecordResponse,
  RecordLaborRequest,
  TransitionStatusRequest,
  UpdateWorkOrderRequest,
  WorkOrderFilterRequest,
  WorkOrderNoteResponse,
  WorkOrderResponse,
} from '@/types'

function normalizeWorkOrder(workOrder: WorkOrderResponse): WorkOrderResponse {
  return {
    ...workOrder,
    status: normalizeWorkOrderStatus(workOrder.status),
    priority: normalizeWorkOrderPriority(workOrder.priority),
    allowedNextStatuses: workOrder.allowedNextStatuses.map(normalizeWorkOrderStatus),
  }
}

export const workOrdersService = {
  async list(filters?: WorkOrderFilterRequest): Promise<WorkOrderResponse[]> {
    const { data } = await api.get<WorkOrderResponse[]>('/workorders', { params: filters })
    return data.map(normalizeWorkOrder)
  },

  async get(id: string): Promise<WorkOrderResponse> {
    const { data } = await api.get<WorkOrderResponse>(`/workorders/${id}`)
    return normalizeWorkOrder(data)
  },

  async create(request: CreateWorkOrderRequest): Promise<WorkOrderResponse> {
    const { data } = await api.post<WorkOrderResponse>('/workorders', {
      ...request,
      priority: request.priority
        ? serializeWorkOrderPriority(request.priority)
        : request.priority,
    })
    return normalizeWorkOrder(data)
  },

  async update(id: string, request: UpdateWorkOrderRequest): Promise<WorkOrderResponse> {
    const { data } = await api.put<WorkOrderResponse>(`/workorders/${id}`, {
      ...request,
      priority:
        request.priority !== undefined
          ? serializeWorkOrderPriority(request.priority)
          : request.priority,
    })
    return normalizeWorkOrder(data)
  },

  async cancel(id: string): Promise<void> {
    await api.delete(`/workorders/${id}`)
  },

  async transitionStatus(id: string, request: TransitionStatusRequest): Promise<WorkOrderResponse> {
    const { data } = await api.patch<WorkOrderResponse>(`/workorders/${id}/status`, {
      newStatus: serializeWorkOrderStatus(request.newStatus),
    })
    return normalizeWorkOrder(data)
  },

  async recordLabor(id: string, request: RecordLaborRequest): Promise<WorkOrderResponse> {
    const { data } = await api.put<WorkOrderResponse>(`/workorders/${id}/labor`, request)
    return normalizeWorkOrder(data)
  },

  async addNote(id: string, request: AddNoteRequest): Promise<WorkOrderNoteResponse> {
    const { data } = await api.post<WorkOrderNoteResponse>(`/workorders/${id}/notes`, request)
    return data
  },

  async getNotes(id: string): Promise<WorkOrderNoteResponse[]> {
    const { data } = await api.get<WorkOrderNoteResponse[]>(`/workorders/${id}/notes`)
    return data
  },

  async linkMaintenanceRecord(
    id: string,
    request: CreateMaintenanceRecordRequest,
  ): Promise<MaintenanceRecordResponse> {
    const { data } = await api.post<MaintenanceRecordResponse>(
      `/workorders/${id}/maintenance-record`,
      request,
    )
    return data
  },

  async downloadPdf(id: string): Promise<void> {
    const response = await api.get<Blob>(`/workorders/${id}/pdf`, {
      responseType: 'blob',
    })
    downloadBlobResponse(response, `work-order-${id}.pdf`)
  },
}
