import { api } from '@/lib/api'
import { downloadBlobResponse } from '@/lib/download'
import { normalizeVehicleStatus, serializeVehicleStatus } from '@/lib/enums'
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleFilterRequest,
  VehicleResponse,
} from '@/types'

function normalizeVehicle(vehicle: VehicleResponse): VehicleResponse {
  return {
    ...vehicle,
    status: normalizeVehicleStatus(vehicle.status),
  }
}

export const vehiclesService = {
  async list(filters?: VehicleFilterRequest): Promise<VehicleResponse[]> {
    const { data } = await api.get<VehicleResponse[]>('/vehicles', { params: filters })
    return data.map(normalizeVehicle)
  },

  async get(id: string): Promise<VehicleResponse> {
    const { data } = await api.get<VehicleResponse>(`/vehicles/${id}`)
    return normalizeVehicle(data)
  },

  async create(request: CreateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.post<VehicleResponse>('/vehicles', {
      ...request,
      status: serializeVehicleStatus(request.status),
    })
    return normalizeVehicle(data)
  },

  async update(id: string, request: UpdateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.put<VehicleResponse>(`/vehicles/${id}`, {
      ...request,
      status:
        request.status !== undefined ? serializeVehicleStatus(request.status) : request.status,
    })
    return normalizeVehicle(data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`)
  },

  async downloadMaintenanceHistoryPdf(id: string): Promise<void> {
    const response = await api.get<Blob>(`/vehicles/${id}/maintenance-history/pdf`, {
      responseType: 'blob',
    })
    downloadBlobResponse(response, `vehicle-${id}-maintenance-history.pdf`)
  },
}
