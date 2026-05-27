import { api } from '@/lib/api'
import type {
  CreateMaintenanceScheduleRequest,
  MaintenanceScheduleResponse,
  MarkPerformedRequest,
  UpdateMaintenanceScheduleRequest,
  VehicleDueForServiceResponse,
} from '@/types'

export const maintenanceSchedulesService = {
  async list(activeOnly = true): Promise<MaintenanceScheduleResponse[]> {
    const { data } = await api.get<MaintenanceScheduleResponse[]>('/maintenance-schedules', {
      params: { activeOnly },
    })
    return data
  },

  async getDue(): Promise<VehicleDueForServiceResponse[]> {
    const { data } = await api.get<VehicleDueForServiceResponse[]>('/maintenance-schedules/due')
    return data
  },

  async get(id: string): Promise<MaintenanceScheduleResponse> {
    const { data } = await api.get<MaintenanceScheduleResponse>(`/maintenance-schedules/${id}`)
    return data
  },

  async create(request: CreateMaintenanceScheduleRequest): Promise<MaintenanceScheduleResponse> {
    const { data } = await api.post<MaintenanceScheduleResponse>('/maintenance-schedules', request)
    return data
  },

  async update(
    id: string,
    request: UpdateMaintenanceScheduleRequest,
  ): Promise<MaintenanceScheduleResponse> {
    const { data } = await api.put<MaintenanceScheduleResponse>(
      `/maintenance-schedules/${id}`,
      request,
    )
    return data
  },

  async deactivate(id: string): Promise<MaintenanceScheduleResponse> {
    const { data } = await api.delete<MaintenanceScheduleResponse>(`/maintenance-schedules/${id}`)
    return data
  },

  async markPerformed(
    id: string,
    request: MarkPerformedRequest,
  ): Promise<MaintenanceScheduleResponse> {
    const { data } = await api.put<MaintenanceScheduleResponse>(
      `/maintenance-schedules/${id}/mark-performed`,
      request,
    )
    return data
  },
}
