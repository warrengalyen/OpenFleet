import { api } from '@/lib/api'
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleFilterRequest,
  VehicleResponse,
} from '@/types'

export const vehiclesService = {
  async list(filters?: VehicleFilterRequest): Promise<VehicleResponse[]> {
    const { data } = await api.get<VehicleResponse[]>('/vehicles', { params: filters })
    return data
  },

  async get(id: string): Promise<VehicleResponse> {
    const { data } = await api.get<VehicleResponse>(`/vehicles/${id}`)
    return data
  },

  async create(request: CreateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.post<VehicleResponse>('/vehicles', request)
    return data
  },

  async update(id: string, request: UpdateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.put<VehicleResponse>(`/vehicles/${id}`, request)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`)
  },
}
